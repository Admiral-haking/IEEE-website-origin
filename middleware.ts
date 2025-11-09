import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'fa'] as const;
type Locale = (typeof locales)[number];

function getPreferredLocale(req: NextRequest): Locale {
  const header = req.headers.get('accept-language') || '';
  const parts = header.split(',').map((s) => s.trim());
  for (const part of parts) {
    const [tag] = part.split(';');
    if (!tag) continue;
    const base = tag.toLowerCase();
    if (base.startsWith('fa')) return 'fa';
    if (base.startsWith('en')) return 'en';
  }
  return 'en';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Ignore API/static/_next and files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const pathLocale = pathname.split('/').filter(Boolean)[0];
  const hasLocale = locales.includes(pathLocale as Locale);
  if (!hasLocale) {
    const pref = getPreferredLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${pref}${pathname}`;
    const res = NextResponse.redirect(url);
    res.cookies.set('hippo_locale', pref, { path: '/' });
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|.*\..*).*)']
};

