-- Hardening berdasarkan Supabase security/performance advisors.
alter function public.set_updated_at() set search_path = '';

-- Fungsi ini hanya dipanggil trigger auth.users, bukan endpoint RPC aplikasi.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index if not exists transactions_category_id_idx
  on public.transactions (category_id);

create index if not exists bank_import_rows_category_id_idx
  on public.bank_import_rows (category_id);
