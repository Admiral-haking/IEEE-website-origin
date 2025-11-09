import '@/lib/mongoose';
import Event from '@/models/Event';
import { AppError } from '@/server/errors';
import { CreateEventInput, UpdateEventInput } from './validators';

export async function listEvents(opts: { q?: string; page?: number; pageSize?: number; locale?: 'en'|'fa' }) {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 10));
  const query: any = {};
  if (opts.locale) query.locale = opts.locale;
  if (opts.q) {
    const { escapeRegex } = await import('@/lib/regex');
    const safe = escapeRegex(opts.q);
    query.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { location: { $regex: safe, $options: 'i' } }
    ];
  }
  const [items, total] = await Promise.all([
    Event.find(query).sort({ startAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    Event.countDocuments(query)
  ]);
  const safe = items.map((d) => ({ id: String(d._id), title: d.title, slug: d.slug, startAt: d.startAt, published: d.published }));
  return { items: safe, total, page, pageSize };
}

export async function createEvent(input: CreateEventInput) {
  const exists = await Event.findOne({ slug: input.slug, locale: input.locale }).lean();
  if (exists) throw new AppError('Slug already exists', 409);
  const created = await Event.create(input);
  return { id: String(created._id), title: created.title, slug: created.slug, published: created.published };
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  if (input.slug) {
    const dup = await Event.findOne({ slug: input.slug, _id: { $ne: id } }).lean();
    if (dup) throw new AppError('Slug already exists', 409);
  }
  const updated = await Event.findByIdAndUpdate(id, { $set: input }, { new: true }).lean();
  if (!updated) throw new AppError('Event not found', 404);
  return { id: String(updated._id), title: updated.title, slug: updated.slug, published: updated.published };
}

export async function deleteEvent(id: string) {
  const res = await Event.findByIdAndDelete(id).lean();
  if (!res) throw new AppError('Event not found', 404);
  return { ok: true };
}

