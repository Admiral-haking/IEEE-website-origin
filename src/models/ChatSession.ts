import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const ChatSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    provider: { type: String, enum: ['openai', 'deepseek'], required: true },
    model: { type: String, required: true },
    title: { type: String, default: '' }
  },
  { timestamps: true }
);

try {
  (ChatSessionSchema as any).index({ userId: 1, updatedAt: -1 });
} catch {}

export type ChatSessionDoc = InferSchemaType<typeof ChatSessionSchema>;

const ChatSession: Model<ChatSessionDoc> = mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);

export default ChatSession;
