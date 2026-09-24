import { SellerDashboard } from '@/components/tracking/seller-dashboard';
import { PageHeader } from '@/components/ui/page-header';
import { SiteHeader } from '@/components/ui/site-header';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { SellerShipment } from '@/lib/tracking/types';

export const metadata = { title: 'Operasi Pengiriman — Anteraja' };

export default async function ShipmentsPage() {
  const user = await requireRole(['seller']);
  const supabase = await createClient();
  const { data, error } = await supabase.from('shipments').select('id, tracking_number, service_type, delivery_status, risk_status, recipient_name, destination_city, estimated_delivery_at, last_scan_at, exception_reason, current_location').eq('user_id', user.id).not('delivery_status', 'in', '(delivered,returned,cancelled)').order('estimated_delivery_at', { ascending: true });
  return <><SiteHeader userName={user.name || user.email} role={user.role} /><main id="main-content" className="app-main overflow-x-clip"><PageHeader eyebrow="Control tower" title="Operasi pengiriman" description="Prioritaskan kiriman yang membutuhkan perhatian. Risiko, konteks, dan tindakan tersedia dalam satu tampilan." />{error ? <p className="text-sm text-destructive">Data kiriman belum dapat dimuat. Terapkan migrasi tracking lalu muat ulang.</p> : <SellerDashboard shipments={(data ?? []) as SellerShipment[]} />}</main></>;
}
