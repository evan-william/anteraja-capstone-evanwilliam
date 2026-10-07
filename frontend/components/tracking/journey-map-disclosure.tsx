'use client';

import { useState } from 'react';
import { ChevronDown, MapPinned } from 'lucide-react';

import type { Journey } from '@/lib/tracking/journey';
import { JourneyMap } from './journey-map';

export function JourneyMapDisclosure({ journey }: { journey: Journey }) {
  const [open, setOpen] = useState(false);
  return <details className="group mt-5 rounded-xl border bg-white" onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className="summary-clean flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-6">
      <MapPinned className="size-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="min-w-0 flex-1">Lihat peta perjalanan<span className="mt-0.5 block text-xs font-normal text-muted-foreground">Perkiraan jalur; bukan lokasi GPS kurir langsung.</span></span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground group-open:rotate-180" aria-hidden="true" />
    </summary>
    {open ? <div className="border-t px-2 pb-2 sm:px-3"><JourneyMap journey={journey} /></div> : null}
  </details>;
}
