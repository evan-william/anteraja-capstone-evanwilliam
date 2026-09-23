import Link from 'next/link';

import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { updateTicketStatus } from '../actions';

export const metadata = { title: 'Tiket CS — Anteraja' };

const statusLabel: Record<string, string> = {
  open: 'Baru', in_progress: 'Sedang ditangani', resolved: 'Selesai', closed: 'Ditutup',
};

export default async function AdminTicketsPage() {
  const user = await requireRole(['admin']);
  const supabase = await createClient();
  const { data, error } = await supabase.from('support_tickets')
    .select('id, shipment_id, ticket_number, status, customer_note, response_due_at, created_at, shipments(tracking_number, destination_city)')
    .order('created_at', { ascending: false }).limit(100);
  const tickets = data ?? [];

  return <>
    <SiteHeader userName={user.name || user.email} role={user.role} />
    <main id="main-content" className="app-main page-enter space-y-6">
      <PageHeader eyebrow="Customer service" title="Tiket pengiriman" description="Lihat konteks resi sebelum mengambil alih kasus. Perubahan status disimpan bersama identitas petugas dan waktunya." />
      {error ? <p role="alert" className="text-sm text-destructive">Tiket belum dapat dimuat. Periksa koneksi lalu muat ulang.</p> : tickets.length ? (
        <section aria-label="Daftar tiket" className="surface-flat overflow-hidden">
          <div className="hidden grid-cols-[1.1fr_1fr_1.6fr_1fr_auto] gap-4 border-b bg-[#faf9f8] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
            <span>Tiket</span><span>Kiriman</span><span>Catatan penerima</span><span>Status</span><span>Tindakan</span>
          </div>
          <ul className="divide-y">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="grid gap-4 p-5 lg:grid-cols-[1.1fr_1fr_1.6fr_1fr_auto] lg:items-center">
                <div><span className="text-xs text-muted-foreground lg:sr-only">Tiket</span><p className="font-semibold">{ticket.ticket_number}</p></div>
                <div><span className="text-xs text-muted-foreground lg:sr-only">Kiriman</span><p><Link className="font-semibold text-primary underline-offset-4 hover:underline" href={`/admin/pengiriman/${ticket.shipment_id}`}>{ticket.shipments?.tracking_number ?? 'Lihat kiriman'}</Link></p><p className="text-xs text-muted-foreground">{ticket.shipments?.destination_city ?? '—'}</p></div>
                <div><span className="text-xs text-muted-foreground lg:sr-only">Catatan penerima</span><p className="max-w-prose break-words text-sm leading-6 text-muted-foreground">{ticket.customer_note || 'Tidak ada catatan tambahan.'}</p></div>
                <div><span className="text-xs text-muted-foreground lg:sr-only">Status</span><p className="text-sm font-semibold">{statusLabel[ticket.status] ?? ticket.status}</p></div>
                <div>{ticket.status === 'open' || ticket.status === 'in_progress' ? (
                  <form action={updateTicketStatus.bind(null, ticket.id, ticket.status === 'open' ? 'in_progress' : 'resolved')}>
                    <Button type="submit" size="sm" variant="outline" className="w-full sm:w-auto">{ticket.status === 'open' ? 'Mulai tangani' : 'Tandai selesai'}</Button>
                  </form>
                ) : <span className="text-sm text-muted-foreground">Tidak ada tindakan lanjutan</span>}</div>
              </li>
            ))}
          </ul>
        </section>
      ) : <section className="surface-flat p-7"><h2 className="section-title">Belum ada tiket CS</h2><p className="mt-2 text-sm text-muted-foreground">Saat penerima mengirim laporan dari halaman lacak, tiket dan konteks resinya akan muncul di sini.</p></section>}
    </main>
  </>;
}
