import '@/lib/mongoose';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { sendNotificationEmail } from '@/server/mail/mailer';
import { getFeatures } from '@/server/settings/service';

type Channel = 'app' | 'email';

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  channels?: Channel[];
  metadata?: Record<string, any>;
};

export async function createNotification(input: CreateNotificationInput) {
  const channels: Channel[] = Array.from(new Set(input.channels || ['app']));
  const doc = await Notification.create({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    channels,
    metadata: input.metadata || {},
  });

  if (channels.includes('email')) {
    try {
      const user = await User.findById(input.userId).select('email name').lean();
      if (user?.email) {
        await sendNotificationEmail({
          email: String((user as any).email),
          name: (user as any).name ? String((user as any).name) : undefined,
          title: input.title,
          body: input.body,
          type: input.type,
        });
      }
    } catch (err) {
      console.error('[notifications] Failed to send email', { userId: input.userId, error: err instanceof Error ? err.message : err });
    }
  }

  return { id: String(doc._id) };
}

export async function listNotifications(opts: { userId: string; unreadOnly?: boolean; limit?: number; cursor?: string }) {
  const limit = Math.min(50, Math.max(1, opts.limit || 20));
  // Only show notifications intended for in-app display
  const query: any = { userId: opts.userId, channels: 'app' };
  if (opts.unreadOnly) query.readAt = { $exists: false };
  if (opts.cursor) {
    query._id = { $lt: opts.cursor };
  }
  const items = await Notification.find(query).sort({ _id: -1 }).limit(limit + 1).lean();
  const hasMore = items.length > limit;
  const sliced = hasMore ? items.slice(0, limit) : items;
  return {
    items: sliced.map((n: any) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.readAt,
      createdAt: n.createdAt,
      metadata: n.metadata || {},
    })),
    nextCursor: hasMore ? String(sliced[sliced.length - 1]._id) : null,
  };
}

export async function markNotificationsRead(opts: { userId: string; ids: string[] }) {
  if (!opts.ids.length) return { ok: true };
  await Notification.updateMany(
    { userId: opts.userId, _id: { $in: opts.ids } },
    { $set: { readAt: new Date() } }
  );
  return { ok: true };
}

export async function markAllNotificationsRead(userId: string) {
  await Notification.updateMany(
    { userId, channels: 'app', readAt: { $exists: false } },
    { $set: { readAt: new Date() } }
  );
  return { ok: true };
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export async function broadcastNotification(userIds: string[], payload: Omit<CreateNotificationInput, 'userId'>) {
  if (!userIds.length) return { ok: true };
  const chunks = chunk(userIds, 20);
  for (const group of chunks) {
    const tasks = group.map((userId) => createNotification({ ...payload, userId }));
    await Promise.allSettled(tasks);
  }
  return { ok: true };
}

export async function notifyUsersNewBlogPost(post: { id: string; title: string }) {
  const f = await getFeatures();
  const channels = f.notificationsEmailEnabled ? ['app', 'email'] as Channel[] : ['app'] as Channel[];
  const users = await User.find({ emailVerified: true }).select('_id').lean();
  const ids = users.map((u: any) => String(u._id));
  await broadcastNotification(ids, {
    type: 'blog:new',
    title: 'New blog post',
    body: `A new blog post "${post.title}" is now available.`,
    channels,
    metadata: { postId: post.id, title: post.title },
  });
}

export async function countUnread(userId: string) {
  const n = await Notification.countDocuments({ userId, channels: 'app', readAt: { $exists: false } });
  return n;
}

export async function markNotificationRead(userId: string, id: string) {
  await Notification.updateOne({ _id: id, userId }, { $set: { readAt: new Date() } });
  return { ok: true };
}

export async function deleteNotification(userId: string, id: string) {
  await Notification.deleteOne({ _id: id, userId });
  return { ok: true };
}
