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
      patient: req.user.id,
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

router.post('/:id/messages', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id).populate('pharmacist');
    if (!pharmacy) {
      return res.status(404).json({ message: 'Pharmacy not found' });
    }

    const message = await Message.create({
      patient: req.user.id,
      pharmacist: pharmacy.pharmacist._id,
      pharmacy: pharmacy.id,
      senderRole: 'patient',
      text: req.body.text
    });

    req.app.get('io').to(`pharmacy:${pharmacy.id}`).emit('message:created', message);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

export default router;
