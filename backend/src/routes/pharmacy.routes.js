import express from 'express';
import Pharmacy from '../models/Pharmacy.js';
import Review from '../models/Review.js';
import Message from '../models/Message.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { search = '', city = '' } = req.query;
    const filter = {
      name: { $regex: search, $options: 'i' },
      city: { $regex: city, $options: 'i' }
    };
    const pharmacies = await Pharmacy.find(filter).populate('pharmacist', 'name role avatarUrl');
    res.json(pharmacies);
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
    res.json(pharmacy);
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
