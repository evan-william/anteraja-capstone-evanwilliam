-- Tambahan 300 kiriman demo (ANT-200001 s.d. ANT-200300).
-- Aman dijalankan berulang kali: tidak menghapus data atau mengubah kiriman lama.
-- Jalankan SETELAH supabase/seed.sql, pada project development/demo saja.
-- Semua resi tambahan memakai kode akses demo 260926.

begin;

do $$
begin
  if not exists (select 1 from public.users where id = '11111111-1111-4111-8111-111111111111') then
    raise exception 'Akun demo belum ada. Jalankan supabase/seed.sql terlebih dahulu pada database demo.';
  end if;
end;
$$;

create temp table demo_shipment_batch on commit drop as
with routes(route_no, origin_city, destination_city, district, final_hub, transit_hub) as (
  values
    (1, 'Jakarta', 'Bandung', 'Coblong', 'Hub Bandung', 'Hub Bekasi'),
    (2, 'Bandung', 'Jakarta Selatan', 'Cilandak', 'Hub Cilandak', 'Hub Bekasi'),
    (3, 'Jakarta', 'Tangerang Selatan', 'Serpong', 'Hub Serpong', 'Hub Serpong'),
    (4, 'Semarang', 'Surabaya', 'Wonokromo', 'Hub Surabaya', 'Hub Semarang'),
    (5, 'Surabaya', 'Malang', 'Klojen', 'Hub Malang Kota', 'Hub Malang Kota'),
    (6, 'Bandung', 'Depok', 'Beji', 'Hub Depok', 'Hub Bekasi'),
    (7, 'Jakarta', 'Bekasi', 'Bekasi Selatan', 'Hub Bekasi', 'Hub Bekasi'),
    (8, 'Yogyakarta', 'Semarang', 'Tembalang', 'Hub Semarang', 'Hub Semarang'),
    (9, 'Bekasi', 'Jakarta', 'Kebayoran Baru', 'Hub Jakarta', 'Hub Bekasi'),
    (10, 'Semarang', 'Yogyakarta', 'Umbulharjo', 'Hub Yogyakarta', 'Hub Semarang'),
    (11, 'Malang', 'Surabaya', 'Gubeng', 'Hub Surabaya', 'Hub Surabaya'),
    (12, 'Tangerang Selatan', 'Jakarta', 'Menteng', 'Hub Jakarta', 'Hub Cilandak'),
    (13, 'Jakarta', 'Yogyakarta', 'Gondokusuman', 'Hub Yogyakarta', 'Hub Semarang'),
    (14, 'Bandung', 'Semarang', 'Candisari', 'Hub Semarang', 'Hub Semarang'),
    (15, 'Surabaya', 'Jakarta', 'Tebet', 'Hub Jakarta', 'Hub Semarang')
), scenarios as (
  select
    n,
    r.origin_city, r.destination_city, r.district, r.final_hub, r.transit_hub,
    (array['regular','next_day','same_day','economy','cargo'])[(n % 5) + 1] as service_type,
    (array[
      'Alya Putri','Bagas Pratama','Citra Maharani','Dimas Saputra','Eka Wulandari',
      'Farhan Akbar','Gita Larasati','Hana Aulia','Irfan Ramadhan','Jihan Safitri',
      'Kevin Wijaya','Laras Ayuningtyas','Maya Kurnia','Nadia Amelia','Oki Nugraha',
      'Putri Anindya','Raka Permana','Sinta Maharani','Taufik Hidayat','Vina Lestari',
      'Wahyu Setiawan','Yasmin Rahma','Zaki Pratama','Nisa Febrianti'
    ])[(n % 24) + 1] as recipient_name,
    (array['Toko Nusantara','Kopi Timur','Ruang Rasa','Atelier Tiga','Studio Karsa','Bumi Buku','Pasar Pagi','Loka Craft'])[(n % 8) + 1] as sender_name,
    case n % 10
      when 0 then 'delivered'
      when 1 then 'failed_delivery'
      when 2 then 'failed_delivery'
      when 3 then 'in_transit'
      when 4 then 'picked_up'
      when 5 then 'out_for_delivery'
      when 6 then 'in_transit'
      when 7 then 'created'
      when 8 then 'out_for_delivery'
      else 'returned'
    end as delivery_status,
    case
      when n % 10 in (0, 9) then now() - make_interval(days => 1 + (n % 4))
      when n % 10 in (3, 4, 5) then now() - make_interval(hours => 7 + (n % 9))
      else now() - make_interval(mins => 10 + (n % 80))
    end as scan_at
  from generate_series(1, 300) as series(n)
  join routes r on r.route_no = ((n - 1) % 15) + 1
)
select
  ('55555555-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid as id,
  '11111111-1111-4111-8111-111111111111'::uuid as user_id,
  'ANT-' || (200000 + n)::text as tracking_number,
  service_type, delivery_status, recipient_name, sender_name,
  '0812' || lpad(n::text, 8, '0') as recipient_phone,
  origin_city, destination_city, final_hub, transit_hub,
  district as destination_district,
  'Jl. Merpati No. ' || ((n % 120) + 1)::text as destination_street,
  (array['Dekat minimarket','Pagar warna putih','Seberang taman','Samping apotek'])[(n % 4) + 1] as destination_landmark,
  case
    when delivery_status in ('delivered', 'returned') then scan_at + interval '2 hours'
    when delivery_status = 'failed_delivery' then now() + make_interval(hours => 2 + (n % 14))
    when n % 10 in (3, 4, 5) then now() + make_interval(hours => 8 + (n % 24))
    else now() + make_interval(hours => 4 + (n % 36))
  end as estimated_delivery_at,
  scan_at as last_scan_at,
  case when delivery_status = 'delivered' then scan_at else null end as delivered_at,
  case
    when delivery_status = 'created' then scan_at
    else scan_at - case service_type
      when 'same_day' then interval '6 hours'
      when 'next_day' then interval '18 hours'
      when 'regular' then interval '36 hours'
      when 'economy' then interval '3 days'
      else interval '4 days'
    end
  end as created_at,
  case
    when n % 10 = 1 then 'ADDRESS_INCOMPLETE'
    when n % 10 = 2 then 'RECIPIENT_ABSENT'
    when n % 10 in (3, 4, 5) then 'IDLE_OVER_6H'
    else null
  end as exception_code,
  case
    when n % 10 = 1 then 'Patokan alamat belum cukup jelas untuk kurir.'
    when n % 10 = 2 then 'Penerima belum dapat ditemui pada percobaan pertama.'
    when n % 10 in (3, 4, 5) then 'Belum ada pemindaian baru selama lebih dari 6 jam.'
    else null
  end as exception_reason,
  case
    when delivery_status in ('failed_delivery','out_for_delivery','delivered','returned') then final_hub
    when delivery_status = 'created' then origin_city
    else transit_hub
  end as current_location
from scenarios;

insert into public.shipments (
  id, user_id, tracking_number, service_type, delivery_status, recipient_name,
  sender_name, recipient_phone, origin_city, destination_city,
  destination_district, destination_street, destination_landmark,
  estimated_delivery_at, last_scan_at, delivered_at, created_at,
  exception_code, exception_reason, current_location, access_code_hash
)
select
  id, user_id, tracking_number, service_type, delivery_status, recipient_name,
  sender_name, recipient_phone, origin_city, destination_city,
  destination_district, destination_street, destination_landmark,
  estimated_delivery_at, last_scan_at, delivered_at, created_at,
  exception_code, exception_reason, current_location,
  encode(extensions.digest('260926', 'sha256'), 'hex')
from demo_shipment_batch
on conflict (user_id, tracking_number) do nothing;

-- Empat tahapan maksimum per resi. ID event deterministik mencegah duplikasi
-- ketika skrip dijalankan ulang; timeline tidak mengklaim data kurir sungguhan.
insert into public.shipment_events (
  id, user_id, shipment_id, event_code, status_label, description, location, occurred_at
)
select
  md5(s.id::text || ':' || e.step_no::text)::uuid,
  s.user_id, s.id, e.event_code, e.status_label, e.description, e.location, e.occurred_at
from demo_shipment_batch d
join public.shipments s on s.user_id = d.user_id and s.tracking_number = d.tracking_number
cross join lateral (
  values
    (1, 'created', 'Pesanan dibuat', 'Informasi pengiriman diterima dan paket menunggu proses berikutnya.', d.origin_city, d.created_at),
    (2, 'picked_up', 'Paket dijemput', 'Paket sudah diterima dari pengirim.', d.origin_city,
      case when d.delivery_status = 'picked_up' then d.last_scan_at else d.created_at + interval '2 hours' end),
    (3, 'in_transit', 'Dalam perjalanan', 'Paket sedang berpindah antar fasilitas pengiriman.', d.transit_hub,
      case when d.delivery_status = 'in_transit' then d.last_scan_at else d.last_scan_at - interval '2 hours' end),
    (4,
      case d.delivery_status
        when 'failed_delivery' then 'delivery_failed'
        when 'out_for_delivery' then 'out_for_delivery'
        when 'delivered' then 'delivered'
        else 'returned'
      end,
      case d.delivery_status
        when 'failed_delivery' then 'Pengantaran perlu bantuan'
        when 'out_for_delivery' then 'Sedang diantar'
        when 'delivered' then 'Paket diterima'
        else 'Paket dikembalikan'
      end,
      case d.delivery_status
        when 'failed_delivery' then 'Kurir membutuhkan petunjuk alamat atau jadwal penerima.'
        when 'out_for_delivery' then 'Kurir membawa paket menuju alamat penerima.'
        when 'delivered' then 'Paket telah sampai di tujuan.'
        else 'Paket diproses untuk kembali ke pengirim.'
      end,
      d.final_hub, d.last_scan_at)
) as e(step_no, event_code, status_label, description, location, occurred_at)
where e.step_no = 1
   or (e.step_no = 2 and d.delivery_status <> 'created')
   or (e.step_no = 3 and d.delivery_status not in ('created','picked_up'))
   or (e.step_no = 4 and d.delivery_status in ('failed_delivery','out_for_delivery','delivered','returned'))
on conflict (id) do nothing;

commit;

-- Verifikasi: 300 resi tambahan; 240 aktif, 30 delivered, 30 returned.
select delivery_status, risk_status, count(*) as jumlah
from public.shipments
where tracking_number between 'ANT-200001' and 'ANT-200300'
group by delivery_status, risk_status
order by delivery_status, risk_status;
