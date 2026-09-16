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

delete from public.transactions where user_id = '11111111-1111-4111-8111-111111111111';
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
  ('22222222-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Makanan & Minuman',  'expense', false),
  ('22222222-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Transportasi',       'expense', false),
  ('22222222-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'Belanja',            'expense', false),
  ('22222222-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'Tagihan & Utilitas', 'expense', false),
  ('22222222-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111', 'Hiburan',            'expense', false),
  ('22222222-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111', 'Kesehatan',          'expense', true),
  ('22222222-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111', 'Gaji',               'income',  false),
  ('22222222-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111', 'Bonus & Freelance',  'income',  false);

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
  ('07',  9500000, 'Gaji bulan ini',                   2),
  ('01',    45000, 'Sarapan bubur ayam',               1),
  ('02',    28000, 'Ojek online ke kantor',            1),
  ('01',    85000, 'Makan siang bareng tim',           3),
  ('05',    65000, 'Tiket bioskop',                    4),
  ('03',   320000, 'Belanja bulanan di supermarket',   5),
  ('02',    15000, 'Parkir motor mingguan',            6),
  ('01',    38000, 'Kopi susu dan roti',               7),
  ('04',   410000, 'Token listrik',                    8),
  ('08',  1750000, 'Proyek desain freelance',          9),
  ('01',    62000, 'Makan malam padang',              11),
  ('02',   120000, 'Isi bensin',                      12),
  ('03',   275000, 'Sepatu olahraga',                 14),
  ('05',    54000, 'Langganan streaming',             15),
  ('04',   180000, 'Paket internet rumah',            17),
  ('01',    47000, 'Jajan sore',                      18),
  ('02',    32000, 'Ojek online pulang',              20),
  ('06',   250000, 'Vitamin dan obat',                22),
  ('07',  9500000, 'Gaji bulan lalu',                 32),
  ('01',   105000, 'Makan keluarga akhir pekan',      33),
  ('03',   190000, 'Perlengkapan dapur',              35),
  ('04',   395000, 'Token listrik bulan lalu',        38),
  ('02',   135000, 'Isi bensin',                      40),
  ('05',   120000, 'Konser musik lokal',              43),
  ('01',    58000, 'Makan siang',                     45),
  ('08',   900000, 'Bonus proyek kecil',              47),
  ('03',   430000, 'Belanja bulanan',                 50),
  ('01',    72000, 'Makan malam ramen',               53),
  ('02',    26000, 'Ojek online',                     56),
  ('07',  9200000, 'Gaji dua bulan lalu',             62),
  ('04',   365000, 'Tagihan air dan listrik',         65),
  ('05',    54000, 'Langganan streaming',             68)
) as seed(category, amount, description, days_ago);

commit;
