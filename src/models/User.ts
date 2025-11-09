import mongoose, { Schema, Model, InferSchemaType } from 'mongoose';

const SocialLinkSchema = new Schema(
  {
    platform: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
    link: { type: String, trim: true },
    start_date: { type: Date },
    end_date: { type: Date },
  },
  { _id: false }
);

const CertificateSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    issuer: { type: String, trim: true },
    issue_date: { type: Date },
    credential_id: { type: String, trim: true },
    credential_url: { type: String, trim: true },
  },
  { _id: false }
);

const roles = ['member', 'volunteer', 'executive', 'admin'] as const;

const UserSchema = new Schema(
  {
    // Core auth
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    name: { type: String, trim: true }, // display name
    full_name: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: roles, default: 'volunteer' },
    last_login: { type: Date },

    // Contact
    phone: { type: String, unique: true, sparse: true, index: true },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationTokenExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetTokenExpires: { type: Date, select: false },

    // Academic / Membership
    student_id: { type: String, trim: true, unique: true, sparse: true },
    university: { type: String, trim: true },
    major: { type: String, trim: true },
    degree: { type: String, trim: true },
    entry_year: { type: Number },
    ieee_membership_id: { type: String, trim: true },
    membership_status: { type: String, trim: true, enum: ['active', 'expired', 'pending', 'reviewed', 'approved', 'rejected', 'none'], default: 'pending' },
    joined_date: { type: Date, default: Date.now },

    // Profile
    is_active: { type: Boolean, default: true },
    profile_picture: { type: String, trim: true },
    bio: { type: String, trim: true },
    interests: [{ type: String, trim: true }],
    social_links: [SocialLinkSchema],
    projects: [ProjectSchema],
    certificates: [CertificateSchema],
    permissions: { type: Schema.Types.Mixed },
    // Reputation
    points: { type: Number, default: 0 },
    badges: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.passwordHash;
        delete ret.emailVerificationTokenHash;
        delete ret.emailVerificationTokenExpires;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetTokenExpires;
        return ret;
      },
    },
  }
);

// Text index for search
UserSchema.index({ full_name: 'text', email: 'text', username: 'text', name: 'text' });
UserSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true });
UserSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

// Virtual id (string)
UserSchema.virtual('id').get(function (this: any) {
  return String(this._id);
});

// Prevent double-hashing; hash only when passwordHash is modified and not already a bcrypt hash
UserSchema.pre('save', async function (next) {
  try {
    if (this.isModified('passwordHash')) {
      const val: string = this.get('passwordHash');
      const looksHashed = typeof val === 'string' && /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(val);
      if (!looksHashed) {
        const { default: bcrypt } = await import('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(val, salt);
        this.set('passwordHash', hash);
      }
    }
    next();
  } catch (e) {
    next(e as any);
  }
});

export type UserDoc = InferSchemaType<typeof UserSchema>;

const User: Model<UserDoc> = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
