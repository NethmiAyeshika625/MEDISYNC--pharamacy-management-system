import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', required: true },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
    fulfillmentMode: { type: String, enum: ['pickup', 'delivery'], required: true },
    status: {
      type: String,
      enum: ['awaiting-payment', 'paid', 'preparing', 'ready', 'out-for-delivery', 'completed'],
      default: 'awaiting-payment'
    },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['card', 'cash', 'wallet'], default: 'card' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    pickupCode: { type: String },
    deliveryAddress: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
