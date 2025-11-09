import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    subject: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    locale: { type: String, enum: ['en', 'fa'], default: 'en' },
    resolved: { type: Boolean, default: false },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

export type ContactMessageDoc = InferSchemaType<typeof ContactMessageSchema>;

const ContactMessage: Model<ContactMessageDoc> = mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema);

export default ContactMessage;
