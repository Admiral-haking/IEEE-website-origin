import '@/lib/mongoose';
import BlogPost from '@/models/BlogPost';
import { AppError } from '@/server/errors';
import { CreatePostInput, UpdatePostInput } from './validators';
import { notifyUsersNewBlogPost } from '@/server/notifications/service';
import { sanitizeRichText } from '@/server/html/sanitize';

export async function listPosts(opts: { q?: string; page?: number; pageSize?: number; locale?: 'en'|'fa' }) {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 10));
  const query: any = {};
  if (opts.locale) query.locale = opts.locale;
  if (opts.q) {
    const { escapeRegex } = await import('@/lib/regex');
    const safe = escapeRegex(opts.q);
    query.$or = [
      { title: { $regex: safe, $options: 'i' } },
      { excerpt: { $regex: safe, $options: 'i' } },
      { tags: { $in: [opts.q] } }
    ];
  }
  const [items, total] = await Promise.all([
    BlogPost.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    BlogPost.countDocuments(query)
  ]);
  const safe = items.map((d: any) => ({
    id: String(d._id),
    title: d.title,
    slug: d.slug,
    excerpt: d.excerpt || '',
    contentHtml: d.contentHtml || '',
    coverFileId: d.coverFileId,
    tags: Array.isArray(d.tags) ? d.tags : [],
    published: d.published,
    author: d.author || '',
    locale: d.locale,
    createdAt: d.createdAt,
  }));
  return { items: safe, total, page, pageSize };
}

export async function createPost(input: CreatePostInput) {
  const exists = await BlogPost.findOne({ slug: input.slug }).lean();
  if (exists) throw new AppError('Slug already exists', 409);
  const created = await BlogPost.create({
    ...input,
    contentHtml: sanitizeRichText(input.contentHtml),
  });
  if (created.published) {
    notifyUsersNewBlogPost({ id: String(created._id), title: created.title }).catch((err) => {
      console.error('[notifications] Failed to broadcast blog post', err);
    });
  }
  return { id: String(created._id), title: created.title, slug: created.slug, published: created.published };
}

export async function updatePost(id: string, input: UpdatePostInput) {
  const prev = await BlogPost.findById(id).lean();
  if (!prev) throw new AppError('Post not found', 404);
  if (input.slug) {
    const dup = await BlogPost.findOne({ slug: input.slug, _id: { $ne: id } }).lean();
    if (dup) throw new AppError('Slug already exists', 409);
  }
  const patch: UpdatePostInput = { ...input };
  if (patch.contentHtml !== undefined) {
    patch.contentHtml = sanitizeRichText(patch.contentHtml);
  }
  const updated = await BlogPost.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
  if (!updated) throw new AppError('Post not found', 404);
  if (input.published === true && !prev.published && updated.published) {
    notifyUsersNewBlogPost({ id: String(updated._id), title: updated.title }).catch((err) => {
      console.error('[notifications] Failed to broadcast blog post', err);
    });
  }
  return { id: String(updated._id), title: updated.title, slug: updated.slug, published: updated.published };
}

export async function deletePost(id: string) {
  const res = await BlogPost.findByIdAndDelete(id).lean();
  if (!res) throw new AppError('Post not found', 404);
  return { ok: true };
}
