import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const ProjectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    status: { type: String, enum: ['open','in_progress','completed','archived'], default: 'open' },
    team_members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    published: { type: Boolean, default: true },
    locale: { type: String, enum: ['en','fa'], default: 'en', index: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ title: 'text', description: 'text', tags: 1 });

export type ProjectDoc = InferSchemaType<typeof ProjectSchema>;

const Project: Model<ProjectDoc> = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

export default Project;

