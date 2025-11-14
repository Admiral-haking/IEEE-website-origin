import '@/lib/mongoose';
import mongoose, { Schema, model, models } from 'mongoose';

export type SettingDoc = mongoose.Document & {
  key: string;
  value: any;
  updatedAt: Date;
  createdAt: Date;
};

const SettingSchema = new Schema<SettingDoc>({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: false });

const Setting = models.Setting || model<SettingDoc>('Setting', SettingSchema);
export default Setting;

