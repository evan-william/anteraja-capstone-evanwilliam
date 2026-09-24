import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { AssistantOption } from './types';

type Client = Awaited<ReturnType<typeof createClient>>;
export type ToolName = 'operations_overview' | 'list_tickets' | 'search_shipments' | 'ticket_detail';
export type ToolResult =
  | { kind: 'operations_overview'; checkedAt: string; active: number; actionRequired: number; atRisk: number; newTickets: number }
  | { kind: 'tickets'; checkedAt: string; tickets: Array<{ id: string; number: string; status: string; shipmentId: string; awb: string | null; city: string | null; dueAt: string; risk: string | null; exception: string | null; location: string | null }> }
  | { kind: 'shipments'; checkedAt: string; shipments: Array<{ id: string; tracking_number: string; risk_status: string; destination_city: string | null }> };

type Ticket = {
  id: string; ticket_number: string; status: string; shipment_id: string;
  response_due_at: string;
  shipments: { tracking_number: string; destination_city: string | null; risk_status: string; exception_reason: string | null; current_location: string | null } | null;
};

export async function runAssistantTool(client: Client, name: ToolName, args: Record<string, unknown>): Promise<ToolResult> {
  if (name === 'operations_overview') {
    const [active, urgent, risky, openTickets] = await Promise.all([
      client.from('shipments').select('id', { count: 'exact', head: true }).not('delivery_status', 'in', '(delivered,returned,cancelled)'),
      client.from('shipments').select('id', { count: 'exact', head: true }).eq('risk_status', 'action_required'),
      client.from('shipments').select('id', { count: 'exact', head: true }).eq('risk_status', 'at_risk'),
      client.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    ]);
    if ([active, urgent, risky, openTickets].some((item) => item.error)) throw new Error('Data operasional belum dapat dibaca.');
    return { kind: 'operations_overview', checkedAt: new Date().toISOString(), active: active.count ?? 0, actionRequired: urgent.count ?? 0, atRisk: risky.count ?? 0, newTickets: openTickets.count ?? 0 };
  }

  if (name === 'list_tickets' || name === 'ticket_detail') {
    const raw = typeof args.ticket_number === 'string' ? args.ticket_number.trim().toUpperCase() : '';
    const status = typeof args.status === 'string' && ['open', 'in_progress', 'resolved', 'closed'].includes(args.status) ? args.status as 'open' | 'in_progress' | 'resolved' | 'closed' : null;
    let query = client.from('support_tickets')
      .select('id,ticket_number,status,shipment_id,response_due_at,shipments(tracking_number,destination_city,risk_status,exception_reason,current_location)')
      .order('created_at', { ascending: false }).limit(name === 'ticket_detail' ? 1 : 8);
    if (raw) query = query.eq('ticket_number', raw);
    else if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw new Error('Daftar tiket belum dapat dibaca.');
    const tickets = (data ?? []) as Ticket[];
    return { kind: 'tickets', checkedAt: new Date().toISOString(), tickets: tickets.map((ticket) => ({
      id: ticket.id, number: ticket.ticket_number, status: ticket.status,
      shipmentId: ticket.shipment_id, awb: ticket.shipments?.tracking_number ?? null,
      city: ticket.shipments?.destination_city ?? null, dueAt: ticket.response_due_at,
      risk: ticket.shipments?.risk_status ?? null,
      exception: ticket.shipments?.exception_reason ?? null,
      location: ticket.shipments?.current_location ?? null,
    })) };
  }

  const raw = typeof args.query === 'string' ? args.query.trim().slice(0, 80) : '';
  const awb = raw.match(/ANT-\d{6}/i)?.[0]?.toUpperCase();
  const risk = typeof args.risk === 'string' && ['action_required', 'at_risk', 'on_track'].includes(args.risk) ? args.risk as 'action_required' | 'at_risk' | 'on_track' : null;
  const city = raw.replace(/[^\p{L}\s-]/gu, '').trim().slice(0, 40);
  let query = client.from('shipments')
    .select('id,tracking_number,risk_status,delivery_status,destination_city,current_location,exception_reason,estimated_delivery_at')
    .order('estimated_delivery_at', { ascending: true }).limit(8);
  if (awb) query = query.eq('tracking_number', awb);
  else if (risk) query = query.eq('risk_status', risk);
  else if (city.length >= 3) query = query.ilike('destination_city', `%${city}%`);
  else query = query.in('risk_status', ['action_required', 'at_risk']);
  const { data, error } = await query;
  if (error) throw new Error('Data kiriman belum dapat dibaca.');
  return { kind: 'shipments', checkedAt: new Date().toISOString(), shipments: data ?? [] };
}

export function optionsFromResults(results: ToolResult[]): AssistantOption[] {
  const options: AssistantOption[] = [];
  for (const result of results) {
    if (result.kind === 'tickets') {
      for (const ticket of result.tickets.slice(0, 3)) {
        options.push({ kind: 'link', label: `Buka ${ticket.number}`, href: `/admin/tiket#ticket-${ticket.id}` });
        if (ticket.status === 'open') options.push({ kind: 'ticket_status', label: `Mulai tangani ${ticket.number}`, ticketId: ticket.id, ticketNumber: ticket.number, status: 'in_progress' });
        if (ticket.status === 'in_progress') options.push({ kind: 'ticket_status', label: `Selesaikan ${ticket.number}`, ticketId: ticket.id, ticketNumber: ticket.number, status: 'resolved' });
      }
    }
    if (result.kind === 'shipments') {
      for (const shipment of result.shipments.slice(0, 3)) options.push({ kind: 'link', label: `Lihat ${shipment.tracking_number}`, href: `/admin/pengiriman/${shipment.id}` });
    }
  }
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.kind === 'link' ? option.href : option.kind === 'ticket_status' ? `${option.ticketId}:${option.status}` : option.prompt;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

export function defaultToolForQuestion(question: string): { name: ToolName; args: Record<string, unknown> } | null {
  const text = question.toLowerCase();
  if (/hapus|delete|buang data|reset data/.test(text)) return null;
  if (/csv|mutasi|rekonsiliasi|finance|keuangan/.test(text)) return null;
  if (/tiket|cs|laporan/.test(text)) {
    const number = question.match(/AJ-\d{6}-[A-Z0-9]+/i)?.[0];
    return number ? { name: 'ticket_detail', args: { ticket_number: number } } : { name: 'list_tickets', args: { status: /baru|masuk|belum/.test(text) ? 'open' : undefined } };
  }
  if (/resi|paket|kiriman|pengiriman|berisiko|terlambat|tindakan|kota/.test(text) || /ANT-\d{6}/i.test(question)) {
    const number = question.match(/ANT-\d{6}/i)?.[0];
    const city = question.match(/(?:di|ke|tujuan)\s+([A-Za-z\s-]{3,35})/i)?.[1]?.trim();
    return { name: 'search_shipments', args: { query: number ?? city ?? '', risk: /perlu tindakan/.test(text) ? 'action_required' : /berisiko|terlambat/.test(text) ? 'at_risk' : undefined } };
  }
  return { name: 'operations_overview', args: {} };
}

export function dataOnlyAnswer(result: ToolResult | null, question = ''): string {
  if (!result) return /hapus|delete|buang data|reset data/i.test(question)
    ? 'Aku tidak bisa menghapus data lewat chat. Untuk tindakan yang tersedia, aku hanya bisa menyiapkan perubahan status tiket dan meminta konfirmasi kamu.'
    : 'CSV dan Finance milik Seller tidak tersedia di asisten Admin. Aku bisa bantu cari kiriman, risiko, dan tiket CS.';
  if (result.kind === 'operations_overview') return `Saat dicek, ada ${result.active} kiriman aktif, ${result.actionRequired} perlu tindakan, ${result.atRisk} berisiko, dan ${result.newTickets} tiket baru. Mau lihat tiket atau kiriman yang perlu ditindaklanjuti?`;
  if (result.kind === 'tickets') return result.tickets.length
    ? `Aku menemukan ${result.tickets.length} tiket terbaru: ${result.tickets.map((t) => `${t.number} (${t.status === 'open' ? 'Baru' : t.status === 'in_progress' ? 'Sedang ditangani' : t.status === 'resolved' ? 'Selesai' : 'Ditutup'}${t.awb ? `, ${t.awb}` : ''})`).join('; ')}. Pilih tiket di bawah untuk membuka atau mengubah statusnya.`
    : 'Tidak ada tiket yang cocok. Coba nomor tiket lain atau lihat seluruh tiket di menu Operasional.';
  return result.shipments.length
    ? `Aku menemukan ${result.shipments.length} kiriman: ${result.shipments.map((s) => `${s.tracking_number} (${s.destination_city ?? 'tujuan belum ada'}, ${s.risk_status === 'action_required' ? 'perlu tindakan' : s.risk_status === 'at_risk' ? 'berisiko' : 'sesuai jadwal'})`).join('; ')}. Buka detailnya lewat pilihan di bawah.`
    : 'Tidak ada kiriman yang cocok. Periksa nomor resi atau gunakan kata kunci kota yang lebih singkat.';
}
