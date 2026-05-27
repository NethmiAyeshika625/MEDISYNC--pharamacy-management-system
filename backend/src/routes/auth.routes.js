import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'patient', phone } = req.body;
    const user = await User.create({ name, email, password, role, phone });
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: createToken(user.id)
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: createToken(user.id)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, async (req, res) => {
  res.json({ user: req.user });
});

router.patch('/me', authRequired, async (req, res, next) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const updates = {};

    if (typeof name === 'string') updates.name = name.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof avatarUrl === 'string') updates.avatarUrl = avatarUrl.trim();

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
