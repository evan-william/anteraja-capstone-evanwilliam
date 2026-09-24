import { redirect } from 'next/navigation';

import { getCurrentUser, roleHome } from '@/lib/auth';
import { SiteHeader } from '@/components/ui/site-header';
import { ActivateAdminForm } from './activate-admin-form';

export const metadata = { title: 'Aktivasi Admin — Anteraja' };

export default async function ActivateAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/masuk');
  if (user.role !== 'consumer') redirect(roleHome(user.role));
  return <><SiteHeader userName={user.name || user.email} role={user.role} /><main id="main-content" className="app-main flex min-h-[75vh] items-center justify-center"><section className="surface-flat w-full max-w-lg p-7"><p className="eyebrow">Akses operasional</p><h1 className="page-title">Aktivasi Admin</h1><p className="page-copy mb-6">Masukkan kode resmi sekali pakai setelah email akun dikonfirmasi. Akses Admin aktif hanya bila kode diterima oleh server.</p><ActivateAdminForm /></section></main></>;
}
