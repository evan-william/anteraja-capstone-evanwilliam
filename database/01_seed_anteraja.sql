-- Seed tambahan opsional. Jalankan SETELAH supabase/seed.sql.
-- Kode akses seluruh resi demo: 260926.
begin;
set local search_path = public, extensions;

insert into public.shipments (
  id, user_id, tracking_number, service_type, delivery_status, recipient_name,
  sender_name, recipient_phone, origin_city, destination_city,
  delivered_at, estimated_delivery_at, last_scan_at, risk_status, current_location, access_code_hash
) values
  ('33333333-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','ANT-100201','regular','delivered','Alya Putri','Toko Nusa','081355501201','Jakarta','Bogor',now() - interval '1 day',now() - interval '1 day',now() - interval '1 day','on_track','Bogor',encode(digest('260926','sha256'),'hex')),
  ('33333333-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','ANT-100202','regular','returned','Reno Yusuf','Toko Nusa','081355501202','Jakarta','Bekasi',null,now() - interval '2 days',now() - interval '18 hours','resolved','Hub Bekasi',encode(digest('260926','sha256'),'hex'))
on conflict (user_id, tracking_number) do update set
  delivery_status = excluded.delivery_status, risk_status = excluded.risk_status,
  last_scan_at = excluded.last_scan_at, updated_at = now();

insert into public.shipment_events(user_id, shipment_id, event_code, status_label, description, location, occurred_at)
select '11111111-1111-4111-8111-111111111111', s.id, 'delivered', 'Paket diterima', 'Paket diterima oleh penerima.', 'Bogor', now() - interval '1 day'
from public.shipments s where s.tracking_number = 'ANT-100201'
  and not exists (select 1 from public.shipment_events e where e.shipment_id = s.id and e.event_code = 'delivered');
commit;
