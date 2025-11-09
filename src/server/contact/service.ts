import '@/lib/mongoose';
import ContactMessage from '@/models/ContactMessage';
import { AppError } from '@/server/errors';
import { UpdateContactMessageInput } from './validators';

export async function listContactMessages(opts: { q?: string; page?: number; pageSize?: number; locale?: 'en'|'fa'; resolved?: boolean }) {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 10));
  const query: any = {};
  if (opts.locale) query.locale = opts.locale;
  if (typeof opts.resolved === 'boolean') query.resolved = opts.resolved;
  if (opts.q) {
    const { escapeRegex } = await import('@/lib/regex');
    const safe = escapeRegex(opts.q);
    query.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      { subject: { $regex: safe, $options: 'i' } },
      { phone: { $regex: safe, $options: 'i' } },
      { message: { $regex: safe, $options: 'i' } }
    ];
  }
  const [items, total] = await Promise.all([
    ContactMessage.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    ContactMessage.countDocuments(query)
  ]);
  const safeItems = items.map((d: any) => ({
    id: String(d._id),
    name: d.name,
    email: d.email,
    phone: d.phone || '',
    subject: d.subject || '',
    message: d.message,
    locale: d.locale,
    resolved: !!d.resolved,
    createdAt: d.createdAt
  }));
  return { items: safeItems, total, page, pageSize };
}

export async function updateContactMessage(id: string, input: UpdateContactMessageInput) {
  const updated = await ContactMessage.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
  if (!updated) throw new AppError('Message not found', 404);
  return { id: String(updated._id), resolved: !!updated.resolved };
}

export async function deleteContactMessage(id: string) {
  const res = await ContactMessage.findByIdAndDelete(id).lean();
  if (!res) throw new AppError('Message not found', 404);
  return { ok: true };
}
