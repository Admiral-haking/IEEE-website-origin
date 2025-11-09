#!/usr/bin/env node
// Migration: normalize user roles and remove obsolete fields
// - Map role 'professor' -> 'executive'
// - Optionally map role 'user' -> 'member'
// - Unset field 'faculty'
// - (Optional) move legacy password_hash -> passwordHash if needed

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
        if (m) {
          const key = m[1];
          let val = m[2];
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!(key in process.env)) process.env[key] = val;
        }
      }
    }
  } catch {}
}
loadEnvLocal();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ieee-qut-website';
const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-n');

const UserSchema = new mongoose.Schema({ role: String }, { strict: false });
const User = mongoose.models._MigrationUser || mongoose.model('_MigrationUser', UserSchema, 'users');

async function main() {
  const start = Date.now();
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`[migrate-users] Connected to ${MONGODB_URI}`);

  const filterProfessor = { role: 'professor' };
  const filterUser = { role: 'user' };
  const filterHasFaculty = { faculty: { $exists: true } };
  const filterLegacyPass = { password_hash: { $exists: true }, passwordHash: { $exists: false } };

  const [countProfessor, countUser, countFaculty, countLegacyPass] = await Promise.all([
    User.countDocuments(filterProfessor),
    User.countDocuments(filterUser),
    User.countDocuments(filterHasFaculty),
    User.countDocuments(filterLegacyPass),
  ]);

  console.log(`[migrate-users] Found: professor=${countProfessor}, user=${countUser}, with faculty=${countFaculty}, legacy password=${countLegacyPass}`);

  if (DRY_RUN) {
    console.log('[migrate-users] Dry run complete. No changes applied.');
    await mongoose.disconnect();
    return;
  }

  let modified = 0;
  if (countProfessor > 0) {
    const res = await User.updateMany(filterProfessor, { $set: { role: 'executive' } });
    modified += res.modifiedCount || 0;
    console.log(`[migrate-users] professor->executive updated: ${res.modifiedCount}`);
  }
  if (countUser > 0) {
    const res = await User.updateMany(filterUser, { $set: { role: 'member' } });
    modified += res.modifiedCount || 0;
    console.log(`[migrate-users] user->member updated: ${res.modifiedCount}`);
  }
  if (countFaculty > 0) {
    const res = await User.updateMany(filterHasFaculty, { $unset: { faculty: '' } });
    modified += res.modifiedCount || 0;
    console.log(`[migrate-users] unset faculty: ${res.modifiedCount}`);
  }
  if (countLegacyPass > 0) {
    // move legacy password_hash to passwordHash (schema uses passwordHash)
    const cur = User.find(filterLegacyPass).cursor();
    let moved = 0;
    for await (const doc of cur) {
      const plain = doc.toObject();
      await User.updateOne({ _id: doc._id }, { $set: { passwordHash: plain.password_hash }, $unset: { password_hash: '' } });
      moved += 1;
    }
    modified += moved;
    console.log(`[migrate-users] moved password_hash -> passwordHash: ${moved}`);
  }

  await mongoose.disconnect();
  console.log(`[migrate-users] Done. Modified ~${modified} documents in ${Date.now() - start}ms.`);
}

main().catch((err) => {
  console.error('[migrate-users] Failed:', err?.message || err);
  process.exit(1);
});
