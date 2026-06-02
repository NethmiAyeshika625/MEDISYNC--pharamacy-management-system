import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['patient', 'pharmacist', 'admin'],
      default: 'patient'
    },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy' }
      ,
    // For pharmacist applicants
    pharmacistProfile: {
      businessName: { type: String },
      licenseUrl: { type: String },
      licenseFilename: { type: String },
      address: { type: String },
      licenseNumber: { type: String }
    },
    verification: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      note: { type: String },
      admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: { type: Date }
    },
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
