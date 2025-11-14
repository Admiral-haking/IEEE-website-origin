#!/usr/bin/env node
// Promote an existing user to admin (or executive).
// Usage:
//   node scripts/promote-admin.mjs user@example.com [role]
//
// role: one of "admin" | "executive" (default: "admin")

import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';

function loadEnvLocal() {
  try {
    const p = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!m) continue;
        const key = m[1];
        let val = m[2];
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
    }
  } catch {
    // ignore
  }
}

async function main() {
  loadEnvLocal();

  const [emailArg, roleArg] = process.argv.slice(2);
  if (!emailArg) {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/promote-admin.mjs user@example.com [role]');
    process.exit(1);
  }
  const email = String(emailArg).toLowerCase().trim();
  const role = (roleArg || 'admin').toLowerCase();
  if (!['admin', 'executive'].includes(role)) {
    // eslint-disable-next-line no-console
    console.error('Role must be "admin" or "executive"');
    process.exit(1);
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ieee';

  const UserSchema = new mongoose.Schema(
    {
      email: { type: String, index: true },
      role: { type: String },
    },
    { strict: false },
  );
  const User = mongoose.models._PromoteUser || mongoose.model('_PromoteUser', UserSchema, 'users');

  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    // eslint-disable-next-line no-console
    console.log(`[promote-admin] Connected to ${MONGODB_URI}`);

    const user = await User.findOne({ email }).lean();
    if (!user) {
      // eslint-disable-next-line no-console
      console.error(`[promote-admin] User not found for email: ${email}`);
      process.exitCode = 1;
      return;
    }

    await User.updateOne({ _id: user._id }, { $set: { role } });
    // eslint-disable-next-line no-console
    console.log(`[promote-admin] Updated user ${email} to role=${role}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[promote-admin] Failed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();

