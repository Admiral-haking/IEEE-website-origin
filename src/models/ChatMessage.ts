import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const ChatMessageSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true, maxlength: 8000 }
  },
  { timestamps: true }
);

try {
  (ChatMessageSchema as any).index({ sessionId: 1, createdAt: 1 });
} catch {}

export type ChatMessageDoc = InferSchemaType<typeof ChatMessageSchema>;

const ChatMessage: Model<ChatMessageDoc> = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);

export default ChatMessage;
