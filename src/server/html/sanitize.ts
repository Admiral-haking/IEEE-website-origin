import sanitizeHtml from 'sanitize-html';
import type { IOptions } from 'sanitize-html';

// Central HTML sanitizer for rich-text fields (blog, pages, jobs, etc.)
// Keeps a safe subset of tags/attributes needed for TipTap content and
// JSON-LD descriptions while stripping scripts and dangerous attributes.

const allowedTags = [
  ...sanitizeHtml.defaults.allowedTags,
  'img',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'figure',
  'figcaption'
];

const allowedAttributes: IOptions['allowedAttributes'] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ['href', 'name', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
};

const allowedStyles: IOptions['allowedStyles'] = {
  '*': {
    'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
  },
  img: {
    'max-width': [/^100%$/],
    height: [/^auto$/],
  },
};

export function sanitizeRichText(input: string | undefined | null): string {
  const html = typeof input === 'string' ? input : '';
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    allowedStyles,
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
    // Disallow arbitrary ids/classes to reduce XSS surface; layout is handled by containers.
    disallowedTagsMode: 'discard',
  });
}
