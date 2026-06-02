import mongoose from 'mongoose';

const { Schema } = mongoose;

const AuditSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.Mixed },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    meta: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export default mongoose.model('Audit', AuditSchema);
