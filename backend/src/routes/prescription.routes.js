import express from 'express';
import Prescription from '../models/Prescription.js';
import Pharmacy from '../models/Pharmacy.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';

const router = express.Router();

router.post('/', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { pharmacyId, description, imageUrl, patientNote } = req.body;
    const pharmacy = await Pharmacy.findById(pharmacyId);

    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const prescription = await Prescription.create({
      patient: req.user.id,
      pharmacy: pharmacyId,
      description,
      imageUrl,
      patientNote
    });

    req.app.get('io').to(`pharmacy:${pharmacyId}`).emit('prescription:created', prescription);
    req.app.get('io').to(`patient:${req.user.id}`).emit('prescription:created', prescription);

    res.status(201).json(prescription);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.user.id })
      .populate('pharmacy', 'name city deliveryEnabled deliveryFee')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
});

router.get('/pharmacy/:pharmacyId', authRequired, allowRoles('pharmacist', 'admin'), async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ pharmacy: req.params.pharmacyId })
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authRequired, allowRoles('pharmacist', 'admin'), async (req, res, next) => {
  try {
    const { status, pharmacistNote, items, deliveryFee } = req.body;
    const update = {};

    if (status) update.status = status;
    if (typeof pharmacistNote === 'string') update.pharmacistNote = pharmacistNote;
    if (Array.isArray(items)) update.items = items;

    // Server-side compute subtotal/total from items to prevent client tampering
    if (Array.isArray(items)) {
      const computedSubtotal = items.reduce((s, it) => s + (typeof it.price === 'number' ? it.price : 0), 0);
      const computedDeliveryFee = typeof deliveryFee === 'number' ? deliveryFee : 0;
      update.subtotal = computedSubtotal;
      update.deliveryFee = computedDeliveryFee;
      update.total = computedSubtotal + computedDeliveryFee;
    } else if (typeof deliveryFee === 'number') {
      // If only deliveryFee changed, recalc total from existing subtotal
      update.deliveryFee = deliveryFee;
      const existing = await Prescription.findById(req.params.id).select('subtotal');
      update.total = (existing?.subtotal || 0) + deliveryFee;
    }

    const prescription = await Prescription.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    req.app.get('io').to(`patient:${prescription.patient.toString()}`).emit('prescription:updated', prescription);
    req.app.get('io').to(`pharmacy:${prescription.pharmacy.toString()}`).emit('prescription:updated', prescription);

    res.json(prescription);
  } catch (error) {
    next(error);
  }
});

export default router;
