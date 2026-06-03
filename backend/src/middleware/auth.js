import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authRequired(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    req.user = user;
    req.userId = String(user._id);
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
