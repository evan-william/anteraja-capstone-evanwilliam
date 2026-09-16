-- Tabel users: cerminan auth.users yang bisa dibaca dari aplikasi.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

-- Email selalu disimpan lowercase.
alter table public.users
  add constraint users_email_lowercase check (email = lower(email));

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users_delete_own" on public.users
  for delete using (auth.uid() = id);

-- Salin user baru dari auth.users ke public.users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
