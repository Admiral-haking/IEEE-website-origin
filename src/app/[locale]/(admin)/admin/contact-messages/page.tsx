import ContactMessagesAdminView from '@/views/admin/contact-messages';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { redirect } from 'next/navigation';

export default async function ContactMessagesAdminPage({ params }: { params: Promise<{ locale: 'en'|'fa' }> }) {
  const { locale } = await params;
  try {
    await requireRoleOrPermission({ minRole: 'executive', permission: 'operations.contact' });
  } catch {
    redirect(`/${locale}/signin`);
  }
  return <ContactMessagesAdminView />;
}
