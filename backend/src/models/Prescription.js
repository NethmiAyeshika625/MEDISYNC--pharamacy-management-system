import mongoose from 'mongoose';

const prescriptionItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'preparing', 'ready', 'collected', 'delivered'],
      default: 'pending'
    },
    pharmacistNote: { type: String },
    patientNote: { type: String },
    items: [prescriptionItemSchema],
    deliveryMode: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    paymentMethod: { type: String, enum: ['card', 'cash', 'wallet'], default: 'card' },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Prescription', prescriptionSchema);
