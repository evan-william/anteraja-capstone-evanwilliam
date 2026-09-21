'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

const slides = [
  {
    image: '/auth/courier-city.png',
    eyebrow: 'Perjalanan dana',
    title: 'Dari paket bergerak sampai dana diterima.',
    description: 'Pantau biaya pengiriman dan settlement dalam alur yang mudah ditelusuri.',
  },
  {
    image: '/auth/sorting-hub.png',
    eyebrow: 'Operasional terhubung',
    title: 'Ribuan paket, satu catatan yang tetap rapi.',
    description: 'Cocokkan mutasi bank dengan data operasional sebelum transaksi disimpan.',
  },
  {
    image: '/auth/seller-handoff.png',
    eyebrow: 'Mitra dan seller',
    title: 'Setiap serah-terima meninggalkan jejak yang jelas.',
    description: 'Resi, COD, biaya, dan settlement tersusun sebagai satu riwayat pemeriksaan.',
  },
];

export function AuthCarousel({ className }: { className?: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

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
  }, [paused, reduceMotion]);

  return (
    <section
      className={cn('group relative hidden min-h-screen overflow-hidden bg-[#211a1f] text-white lg:block', className)}
      aria-label="Operasional Anteraja"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {slides.map((slide, index) => (
        <div key={slide.image} className={cn('absolute inset-0 transition-opacity duration-700 [transition-timing-function:var(--ease-enter)]', index === active ? 'z-10 opacity-100' : 'z-0 opacity-0')} aria-hidden={index !== active}>
          <Image src={slide.image} alt="" fill priority={index === 0} sizes="55vw" className={cn('object-cover transition-transform duration-[5500ms] ease-linear', index === active ? 'scale-105' : 'scale-100')} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,18,.22)_0%,rgba(20,14,18,.28)_35%,rgba(20,14,18,.92)_100%)]" />
        </div>
      ))}

      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 p-10 xl:p-12">
        <Image src="/brand/anteraja-favicon.png" alt="" width={46} height={46} className="size-10 object-contain brightness-0 invert" priority />
        <span className="text-2xl font-bold tracking-[-0.045em]">anteraja</span>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-10 xl:p-12">
        <div key={active} className="page-enter max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff8eca]">{slides[active].eyebrow}</p>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] xl:text-5xl">{slides[active].title}</h2>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/72">{slides[active].description}</p>
        </div>
        <div className="mt-8 flex items-center gap-2" role="tablist" aria-label="Pilih cerita operasional">
          {slides.map((slide, index) => (
            <button key={slide.image} type="button" role="tab" aria-selected={index === active} aria-label={`Tampilkan slide ${index + 1}: ${slide.eyebrow}`} onClick={() => setActive(index)} className={cn('h-1.5 w-9 origin-left rounded-full transition-[transform,background-color] duration-300', index === active ? 'scale-x-100 bg-primary' : 'scale-x-[.45] bg-white/45 hover:bg-white/75')} />
          ))}
        </div>
      </div>
    </section>
  );
}
