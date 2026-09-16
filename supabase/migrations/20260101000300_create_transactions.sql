-- Transaksi pemasukan dan pengeluaran.
-- amount selalu positif; jenisnya mengikuti categories.type.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  amount bigint not null check (amount > 0),
  description text check (char_length(description) <= 200),
  transaction_date date not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_id_transaction_date_idx
  on public.transactions (user_id, transaction_date desc);

create index if not exists transactions_user_id_is_deleted_idx
  on public.transactions (user_id, is_deleted);

drop trigger if exists transactions_set_updated_at on public.transactions;

create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);
