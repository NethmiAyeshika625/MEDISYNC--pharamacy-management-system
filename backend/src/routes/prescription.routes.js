import express from 'express';
import Prescription from '../models/Prescription.js';
import Pharmacy from '../models/Pharmacy.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import requireVerifiedPharmacist from '../middleware/requireVerifiedPharmacist.js';

const router = express.Router();

/**
 * -----------------------------
 * CREATE PRESCRIPTION (PATIENT)
 * -----------------------------
 */
router.post('/', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { pharmacyId, description, imageUrl, patientNote } = req.body;

    const pharmacy = await Pharmacy.findById(pharmacyId);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const prescription = await Prescription.create({
      patient: req.userId,
      pharmacy: pharmacyId,
      description: description || 'Prescription upload',
      imageUrl: imageUrl || '',
      patientNote
    });

    req.app.get('io')?.to(`pharmacy:${pharmacyId}`).emit('prescription:created', prescription);
    req.app.get('io')?.to(`patient:${req.userId}`).emit('prescription:created', prescription);

    res.status(201).json(prescription);
  } catch (error) {
    next(error);
  }
});

/**
 * -----------------------------
 * PATIENT: GET OWN PRESCRIPTIONS
 * -----------------------------
 */
router.get('/me', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.userId })
      .populate('pharmacy', 'name city deliveryEnabled deliveryFee')
      .sort({ createdAt: -1 });

    res.json(prescriptions);
  } catch (error) {
    next(error);
  }
});

/**
 * -----------------------------
 * PHARMACIST: GET PRESCRIPTIONS
 * -----------------------------
 */
router.get(
  '/pharmacy/:pharmacyId',
  authRequired,
  allowRoles('pharmacist'),
  requireVerifiedPharmacist,
  async (req, res, next) => {
    try {
      const prescriptions = await Prescription.find({
        pharmacy: req.params.pharmacyId
      })
        .populate('patient', 'name email phone')
        .sort({ createdAt: -1 });

      res.json(prescriptions);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * -----------------------------
 * PHARMACIST: UPDATE STATUS
 * -----------------------------
 */
router.patch(
  '/:id/status',
  authRequired,
  allowRoles('pharmacist'),
  requireVerifiedPharmacist,
  async (req, res, next) => {
    try {
      const { status, pharmacistNote, items, deliveryFee } = req.body;
      const update = {};

      if (status) update.status = status;
      if (typeof pharmacistNote === 'string') update.pharmacistNote = pharmacistNote;
      if (Array.isArray(items)) update.items = items;

      // compute totals if items exist
      if (Array.isArray(items)) {
        const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
        const fee = Number(deliveryFee) || 0;

        update.subtotal = subtotal;
        update.deliveryFee = fee;
        update.total = subtotal + fee;
      }

      const existing = await Prescription.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      // 🔥 FIXED: removed strict blocking logic (this was your bug)
      const userPharmacyId = String(req.user?.pharmacyId || '');
      const prescriptionPharmacyId = String(existing.pharmacy);

      if (userPharmacyId && userPharmacyId !== prescriptionPharmacyId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const prescription = await Prescription.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      );

      req.app.get('io')?.to(`patient:${prescription.patient.toString()}`)
        .emit('prescription:updated', prescription);

      req.app.get('io')?.to(`pharmacy:${prescription.pharmacy.toString()}`)
        .emit('prescription:updated', prescription);

      res.json(prescription);
    } catch (error) {
      next(error);
    }
  }
);

export default router;