import Image from 'next/image';
import { BellRing, MapPinned, ShieldCheck } from 'lucide-react';

import { PublicHeader } from '@/components/tracking/public-header';
import { TrackingSearchForm } from '@/components/tracking/tracking-search-form';

export const metadata = { title: 'Lacak Kiriman — Anteraja', description: 'Cek posisi paket, kepastian jadwal, dan selesaikan kendala pengiriman dalam satu alur.' };

export default function TrackingLandingPage() {
  return (
    <>
      <PublicHeader />
      <main id="main-content">
        <section className="relative isolate overflow-hidden bg-[#21171d] text-white">
          <div className="absolute inset-0 -z-10">
            <Image src="/auth/courier-city.png" alt="Kurir Anteraja mengantar paket di kawasan perkotaan" fill priority className="object-cover object-center opacity-42" sizes="100vw" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#21171d_7%,rgba(33,23,29,.93)_38%,rgba(33,23,29,.36)_77%,#21171d_115%)]" />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#21171d] to-transparent" />
          </div>
          <div className="app-container grid min-h-[650px] items-center gap-12 py-18 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
            <div className="max-w-2xl page-enter">
              <p className="mb-6 text-xs font-bold uppercase tracking-[.16em] text-[#ff8bc5]">Tracking dan penyelesaian kendala</p>
              <h1 className="text-4xl font-bold leading-[1.06] tracking-[-.055em] sm:text-6xl lg:text-[4.5rem]">Tahu posisinya.<br /><span className="text-[#ff3ca3]">Tahu langkah berikutnya.</span></h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-white/68 sm:text-lg">Timeline yang mudah dibaca, peringatan risiko lebih awal, dan solusi langsung saat pengiriman membutuhkan bantuanmu.</p>
            </div>
            <section aria-labelledby="tracking-form-title" className="page-enter reveal-2 rounded-2xl border border-white/20 bg-white p-5 text-foreground shadow-[0_26px_70px_rgba(0,0,0,.28)] sm:p-7">
              <p className="eyebrow">Tracking aman</p>
              <h2 id="tracking-form-title" className="mt-2 text-2xl font-bold tracking-[-.035em]">Di mana paketmu?</h2>
              <p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">Masukkan resi dan kode akses dari pesan pengiriman.</p>
              <TrackingSearchForm />
              <div className="mt-5 border-t pt-5 text-xs text-muted-foreground"><strong className="text-foreground">Demo:</strong> ANT-100015 · kode 260926</div>
            </section>
          </div>
        </section>

        <section className="app-container py-18 sm:py-24">
          <header className="max-w-xl"><p className="eyebrow">Satu alur, lebih pasti</p><h2 className="page-title">Tracking yang membantu mengambil keputusan.</h2></header>
          <div className="mt-10 grid border-y md:grid-cols-3 md:divide-x">
            {[
              [MapPinned, 'Konteks, bukan kode', 'Lokasi, waktu, estimasi, dan arti status disusun sebagai satu cerita perjalanan.'],
              [BellRing, 'Risiko terlihat lebih awal', 'Status Sesuai Jadwal, Berisiko, atau Perlu Tindakan membuat prioritas langsung jelas.'],
              [ShieldCheck, 'Aksi tetap aman', 'Detail penerima disamarkan. Perubahan penting membutuhkan kode akses enam digit.'],
            ].map(([Icon, title, copy]) => (
              <article key={String(title)} className="border-b py-7 last:border-b-0 md:border-b-0 md:px-7 md:first:pl-0 md:last:pr-0">
                <Icon className="mb-6 size-5 text-primary" />
                <h3 className="text-lg font-bold tracking-[-.025em]">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{String(copy)}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
