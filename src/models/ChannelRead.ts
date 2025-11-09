import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const ChannelReadSchema = new Schema(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastReadAt: { type: Date, default: new Date(0) },
  },
  { timestamps: true }
);

ChannelReadSchema.index({ channelId: 1, userId: 1 }, { unique: true });

export type ChannelReadDoc = InferSchemaType<typeof ChannelReadSchema>;

const ChannelRead: Model<ChannelReadDoc> =
  mongoose.models.ChannelRead || mongoose.model('ChannelRead', ChannelReadSchema);

export default ChannelRead;

