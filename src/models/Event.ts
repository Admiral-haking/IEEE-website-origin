import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date },
    location: { type: String },
    descriptionHtml: { type: String, default: '' },
    coverFileId: { type: String },
    published: { type: Boolean, default: false },
    locale: { type: String, enum: ['en','fa'], required: true, index: true }
  },
  { timestamps: true }
);

try {
  (EventSchema as any).index({ slug: 1, locale: 1 }, { unique: true, sparse: true });
} catch {}

export type EventDoc = InferSchemaType<typeof EventSchema>;

const Event: Model<EventDoc> = mongoose.models.Event || mongoose.model('Event', EventSchema);

export default Event;

