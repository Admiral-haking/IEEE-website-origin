import '@/lib/mongoose';
import User from '@/models/User';
import { createNotification } from '@/server/notifications/service';

export async function addPoints(userId: string, delta: number, reason?: string) {
  const inc = Math.floor(delta || 0);
  if (!inc) return { ok: true };
  const doc = await User.findByIdAndUpdate(userId, { $inc: { points: inc } }, { new: true }).lean();
  if (doc) {
    try {
      await createNotification({ userId, type: 'reputation:points', title: 'Points earned', body: `+${inc} points${reason ? ` — ${reason}` : ''}`, channels: ['app'] });
    } catch {}
  }
  return { ok: true };
}

export async function awardBadge(userId: string, badge: string) {
  const b = String(badge || '').trim();
  if (!b) return { ok: true };
  const doc = await User.findByIdAndUpdate(userId, { $addToSet: { badges: b } }, { new: true }).lean();
  if (doc) {
    try { await createNotification({ userId, type: 'reputation:badge', title: 'New badge', body: b, channels: ['app'] }); } catch {}
  }
  return { ok: true };
}

