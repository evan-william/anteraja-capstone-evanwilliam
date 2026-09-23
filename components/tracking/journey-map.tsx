'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Route } from 'lucide-react';
import type { Journey, JourneyPoint } from '@/lib/tracking/journey';

type RouteResult = { path?: number[][]; error?: string };

async function roadBetween(from: JourneyPoint, to: JourneyPoint): Promise<[number, number][]> {
  const query = new URLSearchParams({ from: `${from.lat},${from.lng}`, to: `${to.lat},${to.lng}` });
  const response = await fetch(`/api/v1/road-route?${query}`, { cache: 'force-cache' });
  const body = await response.json() as RouteResult;
  if (!response.ok || !Array.isArray(body.path)) throw new Error(body.error || 'Jalur jalan belum tersedia.');
  return body.path.map(([lat, lng]) => [lat, lng]);
}

export function JourneyMap({ journey }: { journey: Journey }) {
  const shellRef = useRef<HTMLElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'loading' | 'roads' | 'points'>('loading');
  const [tilesFailed, setTilesFailed] = useState(false);
  const routeKey = [journey.origin, journey.current, journey.destination].filter(Boolean).map((point) => `${point!.lat},${point!.lng}`).join(';');

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;
    if (!('IntersectionObserver' in window)) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '240px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !mapRef.current) return;
    let cancelled = false;
    let map: import('leaflet').Map | null = null;
    const points = [journey.origin, journey.current, journey.destination].filter((point): point is JourneyPoint => Boolean(point));

    async function start() {
      const L = await import('leaflet');
      if (cancelled || !mapRef.current) return;
      map = L.map(mapRef.current, { scrollWheelZoom: false, zoomControl: false });
      L.control.zoom({ position: 'bottomright', zoomInTitle: 'Perbesar peta', zoomOutTitle: 'Perkecil peta' }).addTo(map);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).on('tileerror', () => { if (!cancelled) setTilesFailed(true); }).addTo(map);

      const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
      map.fitBounds(bounds.pad(0.22), { maxZoom: 12, animate: false });
      points.forEach((point, index) => {
        const isCurrent = journey.current && index === 1;
        const color = isCurrent ? '#e9007f' : '#282024';
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: isCurrent ? 9 : 7, color: '#ffffff', weight: 3,
          fillColor: color, fillOpacity: 1,
        }).addTo(map!);
        const tooltip = document.createElement('span');
        tooltip.textContent = `${index === 0 ? 'Asal' : index === points.length - 1 ? 'Tujuan' : 'Pindai terakhir'}: ${point.label}`;
        marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -8] });
      });

      const segments = journey.current
        ? [[journey.origin, journey.current], [journey.current, journey.destination]] as const
        : [[journey.origin, journey.destination]] as const;
      const results = await Promise.allSettled(segments.map(([from, to]) => roadBetween(from, to)));
      if (cancelled || !map) return;
      let successful = 0;
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;
        successful += 1;
        const line = L.polyline(result.value, {
          color: index === 0 && journey.current ? '#e9007f' : journey.current ? '#433b40' : '#e9007f',
          weight: index === 0 ? 5 : 4,
          opacity: index === 0 ? 0.95 : 0.75,
          dashArray: journey.current && index === 1 ? '9 9' : undefined,
          lineCap: 'round',
        }).addTo(map!);
        const path = line.getElement();
        if (index === 0 && path instanceof SVGPathElement && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          const length = path.getTotalLength();
          path.style.strokeDasharray = String(length);
          path.animate([{ strokeDashoffset: String(length) }, { strokeDashoffset: '0' }], {
            duration: 950, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards',
          });
        }
      });
      // Keep stop markers above the road geometry after every route update.
      map.eachLayer((layer) => { if (layer instanceof L.CircleMarker) layer.bringToFront(); });
      setStatus(successful === results.length ? 'roads' : 'points');
    }

    void start().catch(() => { if (!cancelled) setStatus('points'); });
    return () => { cancelled = true; map?.remove(); };
    // routeKey is a stable representation of the three geographic points.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, routeKey]);

  const destination = journey.destination.label;
  return (
    <section ref={shellRef} aria-labelledby="journey-map-title" className="journey-map mt-5 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(32,27,30,.04)]">
      <header className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
        <div>
          <p className="eyebrow">Perjalanan di peta</p>
          <h2 id="journey-map-title" className="mt-2 text-xl font-semibold tracking-tight">Dari {journey.origin.label} ke {destination}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lihat titik perjalanan dan perkiraan jalur jalan antar kota atau hub.</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"><Route className="size-4 text-primary" /> {journey.current ? 'Titik terakhir ditandai' : 'Asal dan tujuan'}</span>
      </header>
      <div className="relative h-[260px] bg-[#e9e4df] sm:h-[340px] lg:h-[390px]">
        {visible ? <div ref={mapRef} className="absolute inset-0 z-0" aria-label="Peta interaktif perjalanan paket" /> : <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Menyiapkan peta…</div>}
      </div>
      <footer className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center sm:px-7">
        <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 font-semibold">
          <li className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#282024]" /> {journey.origin.label}</li>
          {journey.current ? <li className="inline-flex items-center gap-1.5 text-primary"><span aria-hidden="true">→</span><span className="size-2.5 rounded-full bg-primary" /> {journey.current.label}</li> : null}
          <li className="inline-flex items-center gap-1.5"><span aria-hidden="true">→</span><MapPin className="size-4" /> {destination}</li>
        </ol>
        <p className="text-xs text-muted-foreground" aria-live="polite">{tilesFailed ? 'Peta dasar tidak tersedia; gunakan timeline untuk detail perjalanan.' : status === 'loading' ? 'Memuat jalur jalan…' : status === 'roads' ? 'Jalur jalan perkiraan, bukan GPS kurir langsung.' : 'Jalur jalan tidak tersedia; titik kota/hub tetap ditampilkan.'}</p>
      </footer>
    </section>
  );
}
