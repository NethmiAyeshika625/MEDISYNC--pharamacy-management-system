import express from 'express';
import Pharmacy from '../models/Pharmacy.js';
import Review from '../models/Review.js';
import Message from '../models/Message.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';
import { publicPharmacyView } from '../utils/stock.js';
import { calculateDistance } from '../utils/geolocation.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search = '', city = '', limit = 10, skip = 0, lat, lng, radius = 10 } = req.query;
    const pageLimit = Math.min(parseInt(limit) || 10, 100);
    const pageSkip = parseInt(skip) || 0;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    let pharmacies = await Pharmacy.find(filter)
      .populate('pharmacist', 'name role avatarUrl')
      .limit(pageLimit)
      .skip(pageSkip);

    // Apply geolocation filtering if coordinates provided
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const maxRadius = parseFloat(radius) || 10;

      pharmacies = pharmacies.filter((pharmacy) => {
        const distance = calculateDistance(userLat, userLng, pharmacy.coordinates.lat, pharmacy.coordinates.lng);
        pharmacy.distance = distance;
        return distance <= maxRadius;
      });

      // Sort by distance
      pharmacies.sort((a, b) => a.distance - b.distance);
    }

    // Get total count for pagination metadata
    const total = await Pharmacy.countDocuments(filter);

    res.json({
      data: pharmacies.map(publicPharmacyView),
      pagination: {
        total,
        limit: pageLimit,
        skip: pageSkip,
        pages: Math.ceil(total / pageLimit)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me/reviews', authRequired, allowRoles('pharmacist'), async (req, res, next) => {
  try {
    const pharmacyId = req.user.pharmacyId;
    if (!pharmacyId) {
      return res.status(404).json({ message: 'No pharmacy linked to this account' });
    }

    const reviews = await Review.find({ pharmacy: pharmacyId })
      .populate('patient', 'name avatarUrl')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id).populate('pharmacist', 'name role avatarUrl phone');
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }
    res.json(publicPharmacyView(pharmacy));
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reviews', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const review = await Review.create({
      patient: req.userId,
      pharmacy: req.params.id,
      rating: req.body.rating,
      comment: req.body.comment
    });
    req.app.get('io')?.to(`pharmacy:${req.params.id}`).emit('review:created', review);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const reviews = await Review.find({ pharmacy: req.params.id })
      .populate('patient', 'name avatarUrl')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/messages', authRequired, allowRoles('patient', 'pharmacist'), async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id);
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    if (req.user.role === 'pharmacist') {
      const myPharmacy = req.user.pharmacyId && String(req.user.pharmacyId);
      if (!myPharmacy || myPharmacy !== String(req.params.id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const filter = { pharmacy: req.params.id };
    if (req.user.role === 'patient') {
      filter.patient = req.userId;
    }

    const messages = await Message.find(filter)
      .populate('patient', 'name avatarUrl')
      .populate('pharmacist', 'name avatarUrl')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    next(error);
  }
});


router.post('/:id/messages', authRequired, allowRoles('patient', 'pharmacist'), async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id).populate('pharmacist');
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    if (req.user.role === 'pharmacist') {
      const myPharmacy = req.user.pharmacyId && String(req.user.pharmacyId);
      if (!myPharmacy || myPharmacy !== String(req.params.id)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const { patientId } = req.body;
      if (!patientId) {
        return res.status(400).json({ message: 'patientId is required for pharmacist replies' });
      }

      const message = await Message.create({
        patient: patientId,
        pharmacist: req.userId,
        pharmacy: pharmacy.id,
        senderRole: 'pharmacist',
        text
      });

      req.app.get('io')?.to(`pharmacy:${pharmacy.id}`).emit('message:created', message);
      req.app.get('io')?.to(`patient:${patientId}`).emit('message:created', message);
      return res.status(201).json(message);
    }

    const pharmacistId = pharmacy.pharmacist?._id || pharmacy.pharmacist;
    if (!pharmacistId) {
      return res.status(400).json({ message: 'This pharmacy has no assigned pharmacist' });
    }

    const message = await Message.create({
      patient: req.userId,
      pharmacist: pharmacistId,
      pharmacy: pharmacy.id,
      senderRole: 'patient',
      text
    });

    req.app.get('io')?.to(`pharmacy:${pharmacy.id}`).emit('message:created', message);
    req.app.get('io')?.to(`patient:${req.userId}`).emit('message:created', message);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

export default router;
