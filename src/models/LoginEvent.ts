import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const LoginEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

LoginEventSchema.index({ createdAt: -1 });

export type LoginEventDoc = InferSchemaType<typeof LoginEventSchema>;

const LoginEvent: Model<LoginEventDoc> = mongoose.models.LoginEvent || mongoose.model('LoginEvent', LoginEventSchema);

export default LoginEvent;

