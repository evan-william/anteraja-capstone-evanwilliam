'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <>
    <header className="border-b bg-white">
      <nav aria-label="Pemulihan halaman" className="app-container flex min-h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Anteraja — ruang kerja saya" className="inline-flex items-center gap-2.5 rounded-md">
          <Image src="/brand/anteraja-mark-small.png" alt="" width={36} height={36} unoptimized />
          <span className="text-xl font-semibold tracking-tight text-primary">anteraja</span>
        </Link>
        <Link href="/lacak" className="text-sm font-semibold text-foreground underline underline-offset-4">Lacak paket</Link>
      </nav>
    </header>
    <main id="main-content" className="app-main flex min-h-[70vh] flex-col justify-center">
      <p className="eyebrow">Halaman terganggu</p>
      <h1 className="page-title">Halaman belum dapat ditampilkan.</h1>
      <p className="page-copy">Koneksi atau layanan mungkin sedang terganggu. Coba muat ulang; pekerjaan yang belum tersimpan mungkin perlu diperiksa kembali.</p>
      <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold">
        <button type="button" onClick={reset} className="text-primary underline underline-offset-4">Coba lagi</button>
        <Link href="/" className="text-foreground underline underline-offset-4">Kembali ke ruang kerja</Link>
      </div>
    </main>
  </>;
}
