import Link from 'next/link';

import { PublicHeader } from '@/components/tracking/public-header';

export default function NotFoundPage() {
  return <>
    <PublicHeader />
    <main id="main-content" className="app-main flex min-h-[70vh] flex-col justify-center">
      <p className="eyebrow">Halaman tidak ditemukan</p>
      <h1 className="page-title">Alamat halaman ini tidak tersedia.</h1>
      <p className="page-copy">Periksa kembali tautannya, atau lanjutkan dari halaman lacak paket.</p>
      <nav aria-label="Pilihan kembali" className="mt-6 flex flex-wrap gap-5 text-sm font-semibold">
        <Link href="/lacak" className="text-primary underline underline-offset-4">Lacak paket</Link>
        <Link href="/" className="text-foreground underline underline-offset-4">Ruang kerja saya</Link>
      </nav>
    </main>
  </>;
}
