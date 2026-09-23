-- Data contoh untuk satu user demo.
--
-- Jalankan setelah semua migrasi di supabase/migrations/ diterapkan.
-- Aman dijalankan berulang kali: seluruh data demo dihapus dulu di awal.
--
-- Akun demo:  demo@contoh.test
-- Password:   demo12345

begin;

-- crypt() dan gen_salt() berada di schema extensions pada project Supabase.
set local search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Reset data demo
-- ---------------------------------------------------------------------------

delete from public.integration_outbox where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.notification_preferences where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.support_tickets where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.shipment_resolutions where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.shipment_events where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.bank_import_rows where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.bank_imports where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.settlement_items where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.settlements where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.shipments where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.transactions where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.category_rules where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.categories   where user_id = '11111111-1111-4111-8111-111111111111';
delete from public.users        where id      = '11111111-1111-4111-8111-111111111111';
delete from auth.users          where id      = '11111111-1111-4111-8111-111111111111';

-- ---------------------------------------------------------------------------
-- User demo
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'demo@contoh.test',
  crypt('demo12345', gen_salt('bf')),
  '',
  '',
  '',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Peserta Demo"}'::jsonb,
  now(),
  now()
);

-- Login email/password butuh baris identity untuk provider email.
insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@contoh.test","email_verified":true,"phone_verified":false}'::jsonb,
  'email',
  now(),
  now(),
  now()
);

-- Trigger on_auth_user_created sudah mengisi public.users.
-- Baris di bawah jadi pengaman kalau seed dijalankan tanpa trigger tersebut.
insert into public.users (id, email, name)
values ('11111111-1111-4111-8111-111111111111', 'demo@contoh.test', 'Peserta Demo')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Kategori
-- ---------------------------------------------------------------------------

insert into public.categories (id, user_id, name, type, is_archived) values
  ('22222222-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Biaya pengiriman',   'expense', false),
  ('22222222-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Biaya layanan',      'expense', false),
  ('22222222-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Retur dan klaim',    'expense', false),
  ('22222222-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Biaya bank',         'expense', false),
  ('22222222-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Operasional hub',    'expense', false),
  ('22222222-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Kategori lama',      'expense', true),
  ('22222222-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Settlement COD',     'income',  false),
  ('22222222-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Koreksi settlement', 'income',  false);

-- ---------------------------------------------------------------------------
-- Transaksi (tersebar di ~3 bulan terakhir, relatif terhadap hari ini)
-- ---------------------------------------------------------------------------

insert into public.transactions (user_id, category_id, amount, description, transaction_date)
select
  '11111111-1111-4111-8111-111111111111',
  ('22222222-0000-4000-8000-0000000000' || seed.category)::uuid,
  seed.amount,
  seed.description,
  current_date - seed.days_ago
from (values
  ('07',  4825000, 'Settlement COD periode 16-20 September', 1),
  ('01',   640000, 'Potongan ongkir periode 16-20 September', 1),
  ('02',   125000, 'Biaya layanan settlement', 1),
  ('07',  3560000, 'Settlement COD periode 11-15 September', 6),
  ('03',   185000, 'Retur kiriman September', 7),
  ('04',    25000, 'Biaya transfer settlement', 7),
  ('07',  5175000, 'Settlement COD periode 6-10 September', 11),
  ('01',   720000, 'Potongan ongkir periode 6-10 September', 11),
  ('05',   340000, 'Operasional sortir tambahan', 14),
  ('08',   145000, 'Koreksi selisih COD', 16),
  ('07',  4290000, 'Settlement COD akhir Agustus', 25),
  ('03',   210000, 'Klaim paket retur Agustus', 27)
) as seed(category, amount, description, days_ago);

-- ---------------------------------------------------------------------------
-- Kiriman tracking. Seluruh contoh memakai kode akses 260926.
-- ---------------------------------------------------------------------------

insert into public.shipments (
  id, user_id, tracking_number, service_type, delivery_status, recipient_name,
  sender_name, recipient_phone, origin_city, destination_city, destination_district,
  destination_street, destination_landmark, estimated_delivery_at, last_scan_at,
  risk_status, exception_code, exception_reason, current_location, current_lat,
  current_lng, access_code_hash
) values
  ('33333333-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','ANT-100015','next_day','failed_delivery','Raka Pratama','Toko Nusa','081234567890','Jakarta','Jakarta Selatan','Cilandak','Jl. Terogong Raya No. 18',null,now() + interval '1 day',now() - interval '35 minutes','action_required','ADDRESS_INCOMPLETE','Alamat belum cukup jelas untuk menemukan titik penerima.','Hub Cilandak',-6.289112,106.795204,encode(digest('260926','sha256'),'hex')),
  ('33333333-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','ANT-100084','regular','in_transit','Nadia Aulia','Studio Karsa','081298765432','Bandung','Depok','Beji','Jl. Margonda Raya No. 51','Gedung bata merah',now() + interval '1 day',now() - interval '8 hours','at_risk','IDLE_OVER_6H','Belum ada pemindaian baru selama lebih dari 6 jam.','Hub Bekasi',-6.238269,106.975573,encode(digest('260926','sha256'),'hex')),
  ('33333333-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','ANT-100112','same_day','out_for_delivery','Dimas Saputra','Ruang Rasa','082112345678','Jakarta','Tangerang Selatan','Serpong','Jl. Pahlawan Seribu','Ruko nomor 12',now() + interval '4 hours',now() - interval '18 minutes','on_track',null,null,'Hub Serpong',-6.300654,106.669779,encode(digest('260926','sha256'),'hex')),
  ('33333333-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','ANT-100143','regular','failed_delivery','Sinta Maharani','Atelier Tiga','085678901234','Surabaya','Malang','Klojen','Jl. Ijen No. 7','Rumah sudut',now() + interval '1 day',now() - interval '1 hour','action_required','RECIPIENT_ABSENT','Penerima belum dapat ditemui pada percobaan pertama.','Hub Malang Kota',-7.977311,112.625109,encode(digest('260926','sha256'),'hex')),
  ('33333333-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','ANT-100157','economy','in_transit','Bagas Wibowo','Kopi Timur','087712341234','Semarang','Yogyakarta','Umbulharjo','Jl. Kusumanegara No. 20','Dekat kampus',now() + interval '2 days',now() - interval '7 hours','at_risk','IDLE_OVER_6H','Perjalanan antarkota lebih lambat dari pola normal.','Hub Semarang',-6.966667,110.416664,encode(digest('260926','sha256'),'hex'));

insert into public.shipment_events (user_id, shipment_id, event_code, status_label, description, location, occurred_at) values
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000001','delivery_failed','Alamat perlu diperjelas','Kurir belum menemukan titik penerima. Tambahkan patokan agar pengiriman dapat dilanjutkan.','Hub Cilandak',now() - interval '35 minutes'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000001','in_transit','Tiba di hub tujuan','Paket sudah tiba di fasilitas pengiriman terdekat.','Hub Cilandak',now() - interval '5 hours'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000001','picked_up','Paket dijemput','Paket diterima dari pengirim dan mulai diproses.','Jakarta Barat',now() - interval '1 day'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000001','created','Pesanan dibuat','Informasi pengiriman diterima Anteraja.','Jakarta',now() - interval '30 hours'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000002','in_transit','Dalam perjalanan ke kota tujuan','Belum ada pemindaian baru. Tim operasional sedang memantau perjalanan.','Hub Bekasi',now() - interval '8 hours'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000002','picked_up','Paket dijemput','Paket telah diterima dari pengirim.','Bandung',now() - interval '1 day'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000003','out_for_delivery','Sedang diantar','Kurir membawa paket menuju alamat penerima.','Serpong',now() - interval '18 minutes'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000003','in_transit','Tiba di hub tujuan','Paket selesai disortir dan masuk rute kurir.','Hub Serpong',now() - interval '2 hours'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000004','delivery_failed','Penerima belum ditemui','Kurir sudah mencoba menghubungi penerima. Pilih jadwal ulang atau lokasi penitipan.','Malang',now() - interval '1 hour'),
  ('11111111-1111-4111-8111-111111111111','33333333-0000-4000-8000-000000000005','in_transit','Dalam perjalanan antarkota','Paket bergerak menuju hub tujuan.','Hub Semarang',now() - interval '7 hours');

insert into public.settlements (id, user_id, reference, settlement_date, status)
values ('44444444-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','STL-2026-09-20',current_date - 1,'paid');
insert into public.settlement_items (user_id, settlement_id, shipment_id, cod_amount, shipping_fee, service_fee, return_amount)
values
  ('11111111-1111-4111-8111-111111111111','44444444-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000001',350000,22000,5000,0),
  ('11111111-1111-4111-8111-111111111111','44444444-0000-4000-8000-000000000001','33333333-0000-4000-8000-000000000003',275000,18000,5000,0);

commit;

-- ---------------------------------------------------------------------------
-- Contoh relasi tambahan untuk penilaian database
-- ---------------------------------------------------------------------------

begin;

insert into public.category_rules (id, user_id, category_id, keyword, type)
values (
  '55555555-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '22222222-0000-4000-8000-000000000007',
  'settlement cod',
  'income'
) on conflict (id) do update set keyword = excluded.keyword, updated_at = now();

insert into public.transactions (
  id, user_id, category_id, amount, description, transaction_date
) values (
  '66666666-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '22222222-0000-4000-8000-000000000007',
  600000,
  'Settlement COD contoh untuk rekonsiliasi',
  current_date - 1
) on conflict (id) do update set amount = excluded.amount, updated_at = now();

insert into public.bank_imports (
  id, user_id, file_name, bank, new_count, matched_count, error_count, status
) values (
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'mutasi-bank-demo.csv',
  'bank_a', 1, 1, 1, 'completed'
) on conflict (id) do update set updated_at = now();

insert into public.bank_import_rows (
  id, import_id, user_id, row_number, fingerprint, transaction_date,
  description, amount, type, status, category_id, created_transaction_id
) values (
  '88888888-0000-4000-8000-000000000001',
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  1, 'demo-new-row-001', current_date - 1,
  'Settlement COD contoh untuk rekonsiliasi', 600000, 'income', 'new',
  '22222222-0000-4000-8000-000000000007',
  '66666666-0000-4000-8000-000000000001'
) on conflict (id) do nothing;

insert into public.bank_import_rows (
  id, import_id, user_id, row_number, fingerprint, transaction_date,
  description, amount, type, status, matched_transaction_id, settlement_id
) values (
  '88888888-0000-4000-8000-000000000002',
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  2, 'demo-matched-row-002', current_date - 1,
  'Settlement COD contoh untuk rekonsiliasi', 600000, 'income', 'matched',
  '66666666-0000-4000-8000-000000000001',
  '44444444-0000-4000-8000-000000000001'
) on conflict (id) do nothing;

insert into public.bank_import_rows (
  id, import_id, user_id, row_number, fingerprint, status, error_message
) values (
  '88888888-0000-4000-8000-000000000003',
  '77777777-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  3, 'demo-error-row-003', 'error', 'Tanggal transaksi tidak valid'
) on conflict (id) do nothing;

insert into public.shipment_resolutions (
  id, user_id, shipment_id, resolution_type, payload, status, submitted_at
) values (
  '99999999-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000004',
  'reschedule', '{"date":"2026-09-25","note":"Penerima tersedia setelah pukul 13.00"}',
  'pending_sync', now() - interval '1 day'
) on conflict (id) do nothing;

insert into public.support_tickets (
  id, user_id, shipment_id, ticket_number, customer_note,
  context_snapshot, status, response_due_at
) values (
  'aaaaaaaa-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000002',
  'AJ-DEMO-001', 'Mohon periksa paket yang belum mendapat scan baru.',
  '{"tracking_number":"ANT-100084","risk_status":"at_risk","last_location":"Hub Bekasi"}',
  'open', now() + interval '2 hours'
) on conflict (id) do nothing;

insert into public.notification_preferences (
  id, user_id, shipment_id, whatsapp_enabled, email_enabled,
  push_enabled, meaningful_changes_only, destination_masked
) values (
  'bbbbbbbb-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000003',
  true, true, false, true, '081***678'
) on conflict (shipment_id) do update set
  whatsapp_enabled = excluded.whatsapp_enabled,
  email_enabled = excluded.email_enabled,
  updated_at = now();

insert into public.integration_outbox (
  id, user_id, shipment_id, destination, event_type, payload, status
) values (
  'cccccccc-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  '33333333-0000-4000-8000-000000000002',
  'customer_service', 'support.ticket_created',
  '{"ticket_number":"AJ-DEMO-001","tracking_number":"ANT-100084"}', 'pending'
) on conflict (id) do nothing;

commit;
