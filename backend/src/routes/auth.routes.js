import express from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const licensesDir = path.resolve(__dirname, '../../uploads/private/licenses');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, licensesDir),
  filename: (_req, file, cb) => {
    const name = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    cb(null, name);
  }
});

function licenseFileFilter(_req, file, cb) {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('License must be a PDF or image'), false);
  }
  cb(null, true);
}

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: licenseFileFilter });

const router = express.Router();

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured on server');
  }
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    // Public registration must only create patient accounts.
    const { name, email, password, phone } = req.body;
    const role = 'patient';
    const user = await User.create({ name, email, password, role, phone });
    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: createToken(user.id)
    });
  } catch (error) {
    next(error);
  }
});

// Public endpoint for pharmacist applicants
router.post('/register-pharmacist', upload.single('license'), async (req, res, next) => {
  try {
    const { name, email, password, phone, businessName, address, licenseNumber } = req.body;
    if (!name || !email || !password || !businessName) return res.status(400).json({ message: 'missing required fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const licenseFile = req.file;
    let licenseUrl = undefined;
    let licenseFilename = undefined;
    let licenseFileId = undefined;

    if (licenseFile) {
      licenseFilename = licenseFile.filename;
      licenseUrl = `/api/admin/uploads/licenses/${licenseFilename}`;
    } else if (req.body.licenseFileId) {
      // uploaded via /api/uploads first (GridFS)
      licenseFileId = req.body.licenseFileId;
      licenseUrl = `/api/uploads/${licenseFileId}`;
    } else if (req.body.licenseDownloadUrl) {
      licenseUrl = req.body.licenseDownloadUrl;
    }

    const role = 'pharmacist';
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      pharmacistProfile: {
        businessName,
        address,
        licenseNumber,
        licenseUrl,
        licenseFilename: licenseFilename,
        licenseFileId: licenseFileId
      },
      verification: { status: 'pending' },
      isVerified: false
    });

    // create token but pharmacist cannot access protected pharmacist routes until approved
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token: createToken(user.id) });
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
