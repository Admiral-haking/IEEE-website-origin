import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    channels: { type: [String], default: ['app'] },
    metadata: { type: Schema.Types.Mixed },
    readAt: { type: Date },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema>;

const Notification: Model<NotificationDoc> =
  mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

export default Notification;
