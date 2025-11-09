import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const ChannelMessageSchema = new Schema(
  {
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, maxlength: 4000 },
  },
  { timestamps: true }
);

ChannelMessageSchema.index({ channelId: 1, createdAt: 1 });

export type ChannelMessageDoc = InferSchemaType<typeof ChannelMessageSchema>;

const ChannelMessage: Model<ChannelMessageDoc> = mongoose.models.ChannelMessage || mongoose.model('ChannelMessage', ChannelMessageSchema);

export default ChannelMessage;

