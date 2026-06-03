import express from 'express';
import Order from '../models/Order.js';
import Prescription from '../models/Prescription.js';
import Pharmacy from '../models/Pharmacy.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import requireVerifiedPharmacist from '../middleware/requireVerifiedPharmacist.js';

const router = express.Router();

function pharmacistOwnsPharmacy(user, pharmacyId) {
  const myPharmacy = user?.pharmacyId && String(user.pharmacyId);
  return Boolean(myPharmacy && myPharmacy === String(pharmacyId));
}

router.post('/', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { prescriptionId, fulfillmentMode, paymentMethod, deliveryAddress } = req.body;
    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (String(prescription.patient) !== req.userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!['approved', 'ready', 'preparing'].includes(prescription.status)) {
      return res.status(400).json({ message: 'Prescription must be approved before creating an order' });
    }

    const existingOrder = await Order.findOne({ prescription: prescription.id });
    if (existingOrder) {
      return res.status(409).json({ message: 'An order already exists for this prescription', orderId: existingOrder.id });
    }

    // Compute totals on server from prescription items (source of truth)
    const subtotal = Array.isArray(prescription.items)
      ? prescription.items.reduce((s, it) => s + (typeof it.price === 'number' ? it.price : 0), 0)
      : 0;
    const deliveryFee = fulfillmentMode === 'delivery' ? (typeof prescription.deliveryFee === 'number' ? prescription.deliveryFee : 0) : 0;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      patient: req.userId,
      pharmacy: prescription.pharmacy,
      prescription: prescription.id,
      fulfillmentMode,
      paymentMethod,
      deliveryAddress,
      subtotal,
      deliveryFee,
      total,
      status: paymentMethod === 'cash' ? 'preparing' : 'awaiting-payment'
    });

    req.app.get('io')?.to(`pharmacy:${prescription.pharmacy.toString()}`).emit('order:updated', {
      orderId: order.id,
      status: order.status,
      message: 'New order received.'
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const orders = await Order.find({ patient: req.userId })
      .populate('pharmacy', 'name city deliveryEnabled deliveryFee')
      .populate('prescription')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/pharmacy/:pharmacyId', authRequired, allowRoles('pharmacist'), requireVerifiedPharmacist, async (req, res, next) => {
  try {
    if (!pharmacistOwnsPharmacy(req.user, req.params.pharmacyId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const orders = await Order.find({ pharmacy: req.params.pharmacyId })
      .populate('patient', 'name email phone avatarUrl')
      .populate('prescription')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/status', authRequired, allowRoles('pharmacist'), requireVerifiedPharmacist, async (req, res, next) => {
  try {
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!pharmacistOwnsPharmacy(req.user, existingOrder.pharmacy)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { status, paymentStatus, pickupCode } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (pickupCode) update.pickupCode = pickupCode;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).populate('pharmacy');

    // Emit generic update to both patient and pharmacy
    req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:updated', order);
    req.app.get('io')?.to(`pharmacy:${order.pharmacy.toString()}`).emit('order:updated', order);

    // When an order becomes ready, send a dedicated event to the patient
    if (update.status === 'ready' || order.status === 'ready') {
      const payload = {
        orderId: order._id,
        status: 'ready',
        message: 'Your order is ready for pickup or delivery',
        pharmacy: {
          _id: order.pharmacy?._id,
          name: order.pharmacy?.name,
          deliveryEnabled: order.pharmacy?.deliveryEnabled || false,
          deliveryFee: order.pharmacy?.deliveryFee || 0
        }
      };

      req.app.get('io')?.to(`patient:${order.patient.toString()}`).emit('order:ready', payload);
    }

    // When an order is completed, reduce pharmacy stock
    if (status === 'completed' && order.prescription) {
      const prescription = await Prescription.findById(order.prescription);
      const pharmacy = await Pharmacy.findById(order.pharmacy._id || order.pharmacy);
      
      if (prescription && prescription.items && pharmacy) {
        prescription.items.forEach(item => {
          const medIndex = pharmacy.medicines.findIndex(m => m.name === item.name && m.brand === item.brand);
          if (medIndex !== -1) {
            // Decrement by 1 since quantity isn't strictly tracked per item in the schema
            pharmacy.medicines[medIndex].stockCount = Math.max(0, (pharmacy.medicines[medIndex].stockCount || 0) - 1);
            if (pharmacy.medicines[medIndex].stockCount === 0) {
              pharmacy.medicines[medIndex].available = false;
            }
          }
        });
        await pharmacy.save();
      }
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

export default router;
