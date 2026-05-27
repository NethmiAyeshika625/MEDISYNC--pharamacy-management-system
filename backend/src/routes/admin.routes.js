import express from 'express';
import User from '../models/User.js';
import Pharmacy from '../models/Pharmacy.js';
import Prescription from '../models/Prescription.js';
import Order from '../models/Order.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';

const router = express.Router();

router.use(authRequired, allowRoles('admin'));

router.get('/overview', async (_req, res, next) => {
  try {
    const [patients, pharmacists, pharmacies, prescriptions, orders] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'pharmacist' }),
      Pharmacy.countDocuments(),
      Prescription.countDocuments(),
      Order.countDocuments()
    ]);

    res.json({ patients, pharmacists, pharmacies, prescriptions, orders });
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

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('patient', 'name email phone avatarUrl')
      .populate('pharmacy', 'name city deliveryEnabled deliveryFee')
      .populate('prescription')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

export default router;
