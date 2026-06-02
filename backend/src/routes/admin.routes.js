import express from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import User from '../models/User.js';
import Pharmacy from '../models/Pharmacy.js';
import Prescription from '../models/Prescription.js';
import Order from '../models/Order.js';
import Audit from '../models/Audit.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';

const router = express.Router();

router.use(authRequired, allowRoles('admin'));

router.get('/overview', async (_req, res, next) => {
  try {
    const [patients, pharmacists, pharmacies, prescriptions, orders, popularPharmaciesRaw] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'pharmacist' }),
      Pharmacy.countDocuments(),
      Prescription.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$pharmacy', orderCount: { $sum: 1 } } },
        { $sort: { orderCount: -1 } },
        { $limit: 5 }
      ])
    ]);

    const popularPharmacies = await Pharmacy.populate(popularPharmaciesRaw, { path: '_id', select: 'name city' });
    const formattedPopular = popularPharmacies.map(p => ({
      name: p._id?.name || 'Unknown',
      city: p._id?.city || 'Unknown',
      orderCount: p.orderCount
    }));

    res.json({ patients, pharmacists, pharmacies, prescriptions, orders, popularPharmacies: formattedPopular });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Admin: create a user
router.post('/users', async (req, res, next) => {
  try {
    const { name, email, password, role = 'patient', phone } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'name, email and password are required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password, role, phone });
    try { await Audit.create({ actor: req.user._id, action: 'create:user', resourceType: 'User', resourceId: user._id, details: { email: user.email, role: user.role }, ip: req.ip }); } catch (err) { console.error('Audit error:', err); }
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) { next(error); }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) { next(error); }
});

// Admin: verify or reject a pharmacist application
router.post('/users/:id/verify', async (req, res, next) => {
  try {
    const { action, note, assignPharmacyId } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'pharmacist') return res.status(400).json({ message: 'User is not a pharmacist' });

    user.verification.status = action === 'approve' ? 'approved' : 'rejected';
    user.verification.note = note || '';
    user.verification.admin = req.user._id;
    user.verification.reviewedAt = new Date();
    user.isVerified = action === 'approve';

    if (action === 'approve' && assignPharmacyId) {
      user.pharmacyId = assignPharmacyId;
    }

    await user.save();
    try { await Audit.create({ actor: req.user._id, action: `verify:pharmacist:${action}`, resourceType: 'User', resourceId: user._id, details: { note, assignPharmacyId }, ip: req.ip }); } catch (err) { console.error('Audit error:', err); }

    res.json({ message: 'ok', user: { id: user._id, isVerified: user.isVerified, verification: user.verification } });
  } catch (error) { next(error); }
});

router.get('/pharmacies', async (_req, res, next) => {
  try {
    const pharmacies = await Pharmacy.find()
      .populate('pharmacist', 'name email phone avatarUrl')
      .sort({ createdAt: -1 });
    res.json(pharmacies);
  } catch (error) {
    next(error);
  }
});

// Admin: create a pharmacy
router.post('/pharmacies', async (req, res, next) => {
  try {
    const { name, address, city, phone, description, locationLabel, coordinates, pharmacist: pharmacistId, deliveryEnabled = false, deliveryFee = 0, openingHours } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const data = { name, address, city, phone, description, locationLabel, coordinates, deliveryEnabled, deliveryFee, openingHours };
    if (pharmacistId) data.pharmacist = pharmacistId;

    const pharmacy = await Pharmacy.create(data);
    if (pharmacistId) {
      const phUser = await User.findById(pharmacistId);
      if (phUser) { phUser.pharmacyId = pharmacy._id; await phUser.save(); }
    }
    try { await Audit.create({ actor: req.user._id, action: 'create:pharmacy', resourceType: 'Pharmacy', resourceId: pharmacy._id, details: { name: pharmacy.name }, ip: req.ip }); } catch (err) { console.error('Audit error:', err); }
    res.status(201).json(pharmacy);
  } catch (error) { next(error); }
});

router.get('/pharmacies/:id', async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id).populate('pharmacist', 'name email phone');
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
    res.json(pharmacy);
  } catch (error) { next(error); }
});

// Admin: update a user (role change, deactivate)
router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role, active } = req.body;
    const update = {};
    if (typeof role === 'string') update.role = role;
    if (typeof active === 'boolean') update.active = active;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Record audit
    try {
      await Audit.create({ actor: req.user._id, action: 'update:user', resourceType: 'User', resourceId: user._id, details: { role: user.role, active: user.active }, ip: req.ip });
    } catch (err) {
      // non-fatal
      console.error('Audit error:', err);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Admin: delete a user
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    try {
      await Audit.create({ actor: req.user._id, action: 'delete:user', resourceType: 'User', resourceId: user._id, details: { email: user.email, role: user.role }, ip: req.ip });
    } catch (err) {
      console.error('Audit error:', err);
    }
    res.json({ message: 'User deleted' });
  } catch (error) {
    next(error);
  }
});

// Admin: update a pharmacy
router.patch('/pharmacies/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'address', 'city', 'phone', 'description', 'deliveryEnabled', 'deliveryFee', 'openingHours', 'locationLabel', 'coordinates'];
    const update = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) update[key] = req.body[key];
    }

    const pharmacy = await Pharmacy.findByIdAndUpdate(req.params.id, update, { new: true }).populate('pharmacist', 'name email');
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
    try {
      await Audit.create({ actor: req.user._id, action: 'update:pharmacy', resourceType: 'Pharmacy', resourceId: pharmacy._id, details: update, ip: req.ip });
    } catch (err) {
      console.error('Audit error:', err);
    }
    res.json(pharmacy);
  } catch (error) {
    next(error);
  }
});

// Admin: delete a pharmacy
router.delete('/pharmacies/:id', async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndDelete(req.params.id);
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });
    try {
      await Audit.create({ actor: req.user._id, action: 'delete:pharmacy', resourceType: 'Pharmacy', resourceId: pharmacy._id, details: { name: pharmacy.name }, ip: req.ip });
    } catch (err) {
      console.error('Audit error:', err);
    }
    res.json({ message: 'Pharmacy deleted' });
  } catch (error) {
    next(error);
  }
});

// Admin: update a specific medicine in a pharmacy (stock item)
router.patch('/pharmacies/:pharmacyId/stock/:medicineId', async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });

    const medicine = pharmacy.medicines.id(req.params.medicineId) || pharmacy.medicines.find((m) => `${m.name}::${m.brand}` === req.params.medicineId);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    const { name, brand, price, stockCount, expiryDate, available, lowStockThreshold, nearExpiryThresholdDays, imageUrl } = req.body;
    if (typeof name === 'string') medicine.name = name;
    if (typeof brand === 'string') medicine.brand = brand;
    if (typeof imageUrl === 'string') medicine.imageUrl = imageUrl;
    if (typeof price !== 'undefined') medicine.price = Number(price);
    if (typeof stockCount !== 'undefined') medicine.stockCount = Number(stockCount);
    if (typeof expiryDate === 'string' && expiryDate) medicine.expiryDate = new Date(expiryDate);
    if (typeof available === 'boolean') medicine.available = available;
    if (typeof lowStockThreshold !== 'undefined') medicine.lowStockThreshold = Number(lowStockThreshold);
    if (typeof nearExpiryThresholdDays !== 'undefined') medicine.nearExpiryThresholdDays = Number(nearExpiryThresholdDays);

    await pharmacy.save();
    try {
      await Audit.create({ actor: req.user._id, action: 'update:medicine', resourceType: 'Medicine', resourceId: medicine._id, details: { pharmacy: pharmacy._id, changes: req.body }, ip: req.ip });
    } catch (err) {
      console.error('Audit error:', err);
    }
    res.json({ message: 'Medicine updated', medicine });
  } catch (error) {
    next(error);
  }
});

// Admin: delete a medicine from a pharmacy
router.delete('/pharmacies/:pharmacyId/stock/:medicineId', async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });

    const medicine = pharmacy.medicines.id(req.params.medicineId);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    medicine.remove();
    await pharmacy.save();

    try {
      await Audit.create({ actor: req.user._id, action: 'delete:medicine', resourceType: 'Medicine', resourceId: req.params.medicineId, details: { pharmacy: pharmacy._id, name: medicine.name, brand: medicine.brand }, ip: req.ip });
    } catch (err) {
      console.error('Audit error:', err);
    }

    res.json({ message: 'Medicine removed' });
  } catch (error) {
    next(error);
  }
});

// Admin: add a medicine to a pharmacy
router.post('/pharmacies/:pharmacyId/stock', async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.pharmacyId);
    if (!pharmacy) return res.status(404).json({ message: 'Pharmacy not found' });

    const { name, brand, price = 0, imageUrl = '', stockCount = 0, expiryDate, available = true, lowStockThreshold, nearExpiryThresholdDays } = req.body;
    if (!name || !brand) return res.status(400).json({ message: 'name and brand are required' });

    const med = {
      name, brand, price: Number(price), imageUrl, stockCount: Number(stockCount), expiryDate: expiryDate ? new Date(expiryDate) : undefined, available: Boolean(available)
    };
    if (typeof lowStockThreshold !== 'undefined') med.lowStockThreshold = Number(lowStockThreshold);
    if (typeof nearExpiryThresholdDays !== 'undefined') med.nearExpiryThresholdDays = Number(nearExpiryThresholdDays);
    med.lastStockedAt = new Date();

    pharmacy.medicines.push(med);
    await pharmacy.save();
    const added = pharmacy.medicines[pharmacy.medicines.length - 1];
    try { await Audit.create({ actor: req.user._id, action: 'create:medicine', resourceType: 'Medicine', resourceId: added._id, details: { pharmacy: pharmacy._id, name: added.name, brand: added.brand }, ip: req.ip }); } catch (err) { console.error('Audit error:', err); }
    res.status(201).json(added);
  } catch (error) { next(error); }
});

// Admin: view audits
router.get('/audits', async (req, res, next) => {
  try {
    const audits = await Audit.find().populate('actor', 'name email role').sort({ createdAt: -1 }).limit(200);
    res.json(audits);
  } catch (error) {
    next(error);
  }
});

// Admin-only download for private license files
router.get('/uploads/licenses/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const path = require('path');
    const diskPath = path.resolve(__dirname, '../../uploads/private/licenses', filename);

    if (fs.existsSync(diskPath)) {
      return res.sendFile(diskPath);
    }

    // If not on disk, try GridFS by ObjectId
    let fileId = null;
    try {
      fileId = new mongoose.Types.ObjectId(filename);
    } catch (err) {
      return res.status(404).json({ message: 'File not found' });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    const stream = bucket.openDownloadStream(fileId);
    stream.on('error', () => res.status(404).json({ message: 'File not found' }));
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
