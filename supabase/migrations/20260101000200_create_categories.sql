-- Kategori transaksi milik user.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('expense', 'income')),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nama kategori unik per user, tidak peduli besar kecil huruf.
create unique index if not exists categories_user_id_name_unique
  on public.categories (user_id, lower(name));

create index if not exists categories_user_id_is_archived_idx
  on public.categories (user_id, is_archived);

drop trigger if exists categories_set_updated_at on public.categories;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);

create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);
