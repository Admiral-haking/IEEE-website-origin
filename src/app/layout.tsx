import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import { headers, cookies } from 'next/headers';
import { latin, fa } from './fonts';

export const metadata: Metadata = {
  title: 'IEEE Student Branch — Quchan University of Technology',
  description: 'Official website of the IEEE Student Branch at Quchan University of Technology.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png'
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Best-effort SSR detection of locale from path or cookie to avoid RTL/LTR flicker
  const h = await headers();
  const pathLike = h.get('x-invoke-path') || h.get('x-matched-path') || h.get('x-url') || '';
  const fromPath = (() => {
    const raw = String(pathLike || '');
    const parts = raw.split('?')[0].split('/').filter(Boolean);
    const seg = parts[0];
    return seg === 'fa' || seg === 'en' ? seg : null;
  })();
  const c = await cookies();
  const fromCookie = c.get('i18next')?.value as 'en'|'fa'|undefined;
  const locale: 'en'|'fa' = (fromPath || fromCookie || 'en') as any;
  const dir = locale === 'fa' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={`${latin.variable} ${fa.variable}`}>
      <body>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}

// Web Vitals are reported via a client component (VitalsReporter) to avoid
// export incompatibility on App Router layouts.
