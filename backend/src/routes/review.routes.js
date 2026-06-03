import express from 'express';
import Review from '../models/Review.js';
import SystemFeedback from '../models/SystemFeedback.js';
import { authRequired } from '../middleware/auth.js';
import { allowRoles } from '../middleware/role.js';

const router = express.Router();

router.get('/me', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const reviews = await Review.find({ patient: req.userId })
      .populate('pharmacy', 'name city')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

router.post('/', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { pharmacyId, rating, comment } = req.body;

    const review = await Review.create({
      patient: req.userId,
      pharmacy: pharmacyId,
      rating,
      comment
    });

    req.app.get('io')?.to(`pharmacy:${pharmacyId}`).emit('review:created', review);
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
});

router.post('/system', authRequired, allowRoles('patient'), async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const feedback = await SystemFeedback.create({
      patient: req.userId,
      rating,
      comment
    });

    res.status(201).json(feedback);
  } catch (error) {
    next(error);
  }
});

router.get('/system', authRequired, allowRoles('admin'), async (req, res, next) => {
  try {
    const feedbacks = await SystemFeedback.find()
      .populate('patient', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    next(error);
  }
});

export default router;