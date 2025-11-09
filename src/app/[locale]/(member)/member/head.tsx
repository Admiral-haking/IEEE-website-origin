import type { Metadata } from 'next';

async function getDict(locale: 'en'|'fa') {
  return locale === 'fa' ? (await import('@/locales/fa/common.json')).default : (await import('@/locales/en/common.json')).default;
}

export default async function Head({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  const dict: any = await getDict(locale);
  const title = `${dict.user_role_member || 'Member'} — ${dict.dashboard || 'Dashboard'}`;
  const description = dict.member_panel_desc || 'Your personalized member panel';
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
}

