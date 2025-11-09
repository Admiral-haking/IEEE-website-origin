import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const MembershipApplicationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending','reviewed','approved','rejected'], default: 'pending', index: true },
    form: { type: Schema.Types.Mixed },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

MembershipApplicationSchema.index({ userId: 1, createdAt: -1 });

export type MembershipApplicationDoc = InferSchemaType<typeof MembershipApplicationSchema>;

const MembershipApplication: Model<MembershipApplicationDoc> =
  mongoose.models.MembershipApplication || mongoose.model('MembershipApplication', MembershipApplicationSchema);

export default MembershipApplication;

