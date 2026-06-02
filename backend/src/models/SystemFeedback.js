import mongoose from 'mongoose';

const systemFeedbackSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('SystemFeedback', systemFeedbackSchema);
