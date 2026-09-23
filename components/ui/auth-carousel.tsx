'use client';

import Image from 'next/image';
import { Pause, Play } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

const slides = [
  {
    image: '/auth/courier-city.webp',
    eyebrow: 'Perjalanan dana',
    title: 'Dari paket bergerak sampai dana diterima.',
    description: 'Pantau biaya pengiriman dan settlement dalam alur yang mudah ditelusuri.',
  },
  {
    image: '/auth/sorting-hub-bright.webp',
    eyebrow: 'Operasional terhubung',
    title: 'Ribuan paket, satu catatan yang tetap rapi.',
    description: 'Cocokkan mutasi bank dengan data operasional sebelum transaksi disimpan.',
  },
  {
    image: '/auth/seller-handoff.webp',
    eyebrow: 'Mitra dan seller',
    title: 'Setiap serah-terima meninggalkan jejak yang jelas.',
    description: 'Resi, COD, biaya, dan settlement tersusun sebagai satu riwayat pemeriksaan.',
  },
];

export function AuthCarousel({ className }: { className?: string }) {
  const [active, setActive] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const paused = manualPaused || hoverPaused || focusPaused;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(() => setActive((index) => (index + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [active, paused, reduceMotion]);

  return (
    <section
      className={cn('group relative order-first min-h-56 overflow-hidden bg-[#211a1f] text-white sm:min-h-64 lg:min-h-screen', className)}
      aria-label="Operasional Anteraja"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusPaused(false); }}
    >
      {slides.map((slide, index) => (
        <div key={slide.image} className={cn('absolute inset-0 transition-opacity duration-700 [transition-timing-function:var(--ease-enter)]', index === active ? 'z-10 opacity-100' : 'z-0 opacity-0')} aria-hidden={index !== active}>
          <Image src={slide.image} alt="" fill priority={index === 0} quality={82} sizes="(max-width: 1023px) 100vw, 55vw" className={cn('object-cover transition-transform duration-[5500ms] ease-linear', index === active && !reduceMotion ? 'scale-[1.025]' : 'scale-100')} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,15,19,.36),transparent_32%,transparent_48%,rgba(20,15,19,.22)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,14,18,.46),transparent_80%)]" />
        </div>
      ))}

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[80%] bg-[linear-gradient(0deg,rgba(19,15,19,.96)_0%,rgba(19,15,19,.76)_35%,rgba(19,15,19,.36)_72%,transparent_100%)] lg:h-[68%]" />

      <div className="absolute inset-x-0 top-0 z-20 hidden items-center gap-3 p-10 lg:flex xl:p-12">
        <Image src="/brand/anteraja-favicon.png" alt="" width={46} height={46} className="size-10 object-contain brightness-0 invert" priority />
        <span className="text-2xl font-bold tracking-[-0.045em]">anteraja</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-5 sm:p-6 lg:p-10 xl:p-12">
        <div key={active} className="page-enter max-w-xl [text-shadow:0_2px_16px_rgba(9,5,8,.84)]">
          <p className="text-xs font-semibold tracking-[0.16em] text-white">{slides[active].eyebrow}</p>
          <h2 className="mt-2 max-w-[18ch] text-balance text-xl font-semibold tracking-[-0.035em] sm:text-2xl lg:mt-4 lg:text-4xl xl:text-5xl">{slides[active].title}</h2>
          <p className="mt-2 hidden max-w-[48ch] text-pretty text-base text-white/88 lg:mt-4 lg:block">{slides[active].description}</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 lg:mt-8">
          <div className="flex items-center gap-1" role="tablist" aria-label="Pilih cerita operasional">
            {slides.map((slide, index) => (
              <button suppressHydrationWarning key={slide.image} type="button" role="tab" aria-selected={index === active} aria-label={`Tampilkan slide ${index + 1}: ${slide.eyebrow}`} onClick={() => setActive(index)} className={cn('grid size-11 place-items-center rounded-lg', index === active ? 'text-white' : 'text-white/65')}><span className="relative h-1 w-8 overflow-hidden rounded-full bg-white/45"><span key={`${active}-${index}`} className={cn('absolute inset-y-0 left-0 rounded-full bg-[#ff59af]', index === active ? reduceMotion ? 'w-full' : 'auth-progress' : 'w-0', paused && 'auth-progress-paused')} /></span></button>
            ))}
          </div>
          <span className="ml-auto text-xs font-semibold tabular text-white/80" aria-hidden="true">0{active + 1} / 0{slides.length}</span>
          <button suppressHydrationWarning type="button" className="grid size-11 place-items-center rounded-lg border border-white/25 bg-black/15 text-white transition-colors hover:bg-black/30" onClick={() => setManualPaused((value) => !value)} aria-label={manualPaused ? 'Putar carousel' : 'Jeda carousel'} aria-pressed={manualPaused}>{manualPaused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
        </div>
      </div>
    </section>
  );
}
