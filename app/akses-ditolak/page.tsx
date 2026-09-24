import Link from 'next/link';
import { getCurrentUser, roleHome } from '@/lib/auth';
import { SiteHeader } from '@/components/ui/site-header';
import { PublicHeader } from '@/components/tracking/public-header';

export default async function AccessDeniedPage() {
  const user = await getCurrentUser();
  return <>{user ? <SiteHeader userName={user.name || user.email} role={user.role} /> : <PublicHeader />}<main id="main-content" className="app-main flex min-h-[70vh] flex-col justify-center"><p className="eyebrow">Akses dibatasi</p><h1 className="page-title">Halaman ini bukan untuk peran akunmu.</h1><p className="page-copy">Data dan tindakan tiap ruang kerja dipisahkan agar hanya orang yang berwenang dapat mengaksesnya.</p><Link className="mt-6 w-fit font-semibold text-primary underline underline-offset-4" href={user ? roleHome(user.role) : '/masuk'}>Kembali ke ruang kerja</Link></main></>;
}
