-- Jalankan setelah supabase/seed.sql. Aman dijalankan ulang.
begin;

insert into public.categories (id, user_id, name, type, is_archived) values
  ('22222222-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111', 'Pendapatan COD', 'income', false),
  ('22222222-0000-4000-8000-000000000010', '11111111-1111-4111-8111-111111111111', 'Biaya Pengiriman', 'expense', false),
  ('22222222-0000-4000-8000-000000000011', '11111111-1111-4111-8111-111111111111', 'Biaya Layanan', 'expense', false),
  ('22222222-0000-4000-8000-000000000012', '11111111-1111-4111-8111-111111111111', 'Retur Pengiriman', 'expense', false)
on conflict do nothing;

insert into public.shipments (
  id, user_id, tracking_number, service_type, delivery_status, recipient_name, delivered_at
) values
  ('33333333-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '100078421945', 'regular', 'delivered', 'Penerima Demo 1', now() - interval '2 days'),
  ('33333333-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '100078415032', 'regular', 'delivered', 'Penerima Demo 2', now() - interval '2 days'),
  ('33333333-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', '100078399812', 'regular', 'returned', 'Penerima Demo 3', null)
on conflict (user_id, tracking_number) do update set
  delivery_status = excluded.delivery_status,
  delivered_at = excluded.delivered_at,
  updated_at = now();

insert into public.settlements (
  id, user_id, reference, settlement_date, status
) values (
  '44444444-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'BANKA-SETTLE-1809',
  current_date - 1,
  'paid'
)
on conflict (user_id, reference) do update set
  settlement_date = excluded.settlement_date,
  status = case when public.settlements.status = 'reconciled' then 'reconciled' else excluded.status end,
  updated_at = now();

insert into public.settlement_items (
  id, user_id, settlement_id, shipment_id, cod_amount, shipping_fee, service_fee, return_amount
) values
  ('55555555-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 2800000, 0, 55000, 0),
  ('55555555-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', '44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000002', 1200000, 25000, 25000, 0)
on conflict (settlement_id, shipment_id) do update set
  cod_amount = excluded.cod_amount,
  shipping_fee = excluded.shipping_fee,
  service_fee = excluded.service_fee,
  return_amount = excluded.return_amount,
  updated_at = now();

commit;
