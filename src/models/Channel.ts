import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const ChannelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    tags: [{ type: String, trim: true }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visibleTo: { type: [String], default: ['member','volunteer','executive','admin'] },
  },
  { timestamps: true }
);

ChannelSchema.index({ slug: 1 }, { unique: true });

export type ChannelDoc = InferSchemaType<typeof ChannelSchema>;

const Channel: Model<ChannelDoc> = mongoose.models.Channel || mongoose.model('Channel', ChannelSchema);

export default Channel;

