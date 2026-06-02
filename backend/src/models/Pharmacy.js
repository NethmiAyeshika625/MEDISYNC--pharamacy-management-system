import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, default: '' },
    stockCount: { type: Number, default: 0, min: 0 },
    available: { type: Boolean, default: true },
    expiryDate: { type: Date },
    lowStockThreshold: { type: Number, min: 0 },
    nearExpiryThresholdDays: { type: Number, min: 1 },
    lastStockedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const pharmacySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    locationLabel: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    phone: { type: String, required: true },
    deliveryEnabled: { type: Boolean, default: false },
    deliveryFee: { type: Number, default: 0 },
    openingHours: { type: String, default: '8:00 AM - 10:00 PM' },
    medicines: [medicineSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Pharmacy', pharmacySchema);
