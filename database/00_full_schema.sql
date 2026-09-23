-- ANTERAJA TRACKING & OPERATIONS - FULL POSTGRESQL SCHEMA
-- Generated from supabase/migrations in timestamp order.
-- Run once on an empty Supabase project. Do not run after migrations.


-- ============================================================================
-- SOURCE: supabase/migrations/20260101000000_create_users.sql
-- ============================================================================

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

-- ============================================================================
-- SOURCE: supabase/migrations/20260101000100_create_updated_at_trigger.sql
-- ============================================================================

-- Function reusable untuk mengisi updated_at pada setiap update.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- SOURCE: supabase/migrations/20260101000200_create_categories.sql
-- ============================================================================

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

-- ============================================================================
-- SOURCE: supabase/migrations/20260101000300_create_transactions.sql
-- ============================================================================

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

-- ============================================================================
-- SOURCE: supabase/migrations/20260916000100_create_bank_imports.sql
-- ============================================================================

create table public.bank_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 255),
  bank text not null check (bank in ('bank_a', 'bank_b')),
  new_count integer not null default 0 check (new_count >= 0),
  matched_count integer not null default 0 check (matched_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  status text not null default 'completed' check (status in ('completed', 'cancelled')),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  keyword text not null check (char_length(trim(keyword)) between 2 and 100),
  type text not null check (type in ('expense', 'income')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index category_rules_user_type_keyword_unique
  on public.category_rules (user_id, type, lower(trim(keyword)));

create table public.bank_import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.bank_imports(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  fingerprint text not null check (char_length(fingerprint) between 1 and 500),
  transaction_date date,
  description text check (description is null or char_length(description) <= 200),
  amount bigint check (amount is null or amount > 0),
  type text check (type is null or type in ('expense', 'income')),
  status text not null check (status in ('new', 'matched', 'error')),
  category_id uuid references public.categories(id) on delete set null,
  matched_transaction_id uuid references public.transactions(id) on delete set null,
  created_transaction_id uuid references public.transactions(id) on delete set null,
  error_message text check (error_message is null or char_length(error_message) <= 500),
  created_at timestamptz not null default now(),
  unique (import_id, fingerprint)
);

create index bank_imports_user_created_idx
  on public.bank_imports (user_id, created_at desc);
create index category_rules_user_type_idx
  on public.category_rules (user_id, type, created_at);
create index category_rules_category_idx
  on public.category_rules (category_id);
create index bank_import_rows_user_import_idx
  on public.bank_import_rows (user_id, import_id);
create index bank_import_rows_created_transaction_idx
  on public.bank_import_rows (created_transaction_id)
  where created_transaction_id is not null;
create index bank_import_rows_matched_transaction_idx
  on public.bank_import_rows (matched_transaction_id)
  where matched_transaction_id is not null;

alter table public.bank_imports enable row level security;
alter table public.category_rules enable row level security;
alter table public.bank_import_rows enable row level security;

revoke all on public.bank_imports, public.category_rules, public.bank_import_rows from anon, authenticated;
grant select on public.bank_imports, public.category_rules, public.bank_import_rows to authenticated;

create policy "bank_imports_select_own"
  on public.bank_imports for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "category_rules_select_own"
  on public.category_rules for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "bank_import_rows_select_own"
  on public.bank_import_rows for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.save_bank_import(
  p_file_name text,
  p_bank text,
  p_rows jsonb,
  p_rules jsonb default '[]'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_import_id uuid;
  v_row jsonb;
  v_rule jsonb;
  v_transaction_id uuid;
  v_category_type text;
  v_transaction_type text;
  v_status text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_bank not in ('bank_a', 'bank_b') then raise exception 'Unsupported bank'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 or jsonb_array_length(p_rows) > 50000 then
    raise exception 'Rows must contain 1 to 50000 items';
  end if;

  insert into public.bank_imports (user_id, file_name, bank)
  values (v_user_id, trim(p_file_name), p_bank)
  returning id into v_import_id;

  for v_rule in select value from jsonb_array_elements(coalesce(p_rules, '[]'::jsonb)) loop
    select type into v_category_type
    from public.categories
    where id = (v_rule->>'category_id')::uuid
      and user_id = v_user_id
      and is_archived = false;

    if v_category_type is null or v_category_type <> v_rule->>'type' then
      raise exception 'Invalid category rule';
    end if;

    insert into public.category_rules (user_id, category_id, keyword, type)
    values (v_user_id, (v_rule->>'category_id')::uuid, trim(v_rule->>'keyword'), v_rule->>'type')
    on conflict (user_id, type, lower(trim(keyword))) do update
      set category_id = excluded.category_id, updated_at = now();
  end loop;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_status := v_row->>'status';
    v_transaction_id := null;

    if v_status = 'new' then
      select type into v_category_type
      from public.categories
      where id = (v_row->>'category_id')::uuid
        and user_id = v_user_id
        and is_archived = false;

      if v_category_type is null or v_category_type <> v_row->>'type' then
        raise exception 'Invalid category for row %', v_row->>'row_number';
      end if;

      insert into public.transactions (
        user_id, category_id, amount, description, transaction_date
      ) values (
        v_user_id,
        (v_row->>'category_id')::uuid,
        (v_row->>'amount')::bigint,
        nullif(v_row->>'description', ''),
        (v_row->>'transaction_date')::date
      ) returning id into v_transaction_id;
    elsif v_status = 'matched' then
      select c.type into v_transaction_type
      from public.transactions t
      join public.categories c on c.id = t.category_id
      where t.id = (v_row->>'matched_transaction_id')::uuid
        and t.user_id = v_user_id
        and t.is_deleted = false
        and t.transaction_date = (v_row->>'transaction_date')::date
        and t.amount = (v_row->>'amount')::bigint
        and c.type = v_row->>'type'
        and lower(regexp_replace(trim(coalesce(t.description, '')), '\s+', ' ', 'g')) =
            lower(regexp_replace(trim(coalesce(v_row->>'description', '')), '\s+', ' ', 'g'));

      if v_transaction_type is null then
        raise exception 'Matched transaction is no longer valid for row %', v_row->>'row_number';
      end if;
    elsif v_status <> 'error' then
      raise exception 'Invalid row status';
    end if;

    insert into public.bank_import_rows (
      import_id, user_id, row_number, fingerprint, transaction_date, description,
      amount, type, status, category_id, matched_transaction_id,
      created_transaction_id, error_message
    ) values (
      v_import_id,
      v_user_id,
      (v_row->>'row_number')::integer,
      v_row->>'fingerprint',
      nullif(v_row->>'transaction_date', '')::date,
      nullif(v_row->>'description', ''),
      nullif(v_row->>'amount', '')::bigint,
      nullif(v_row->>'type', ''),
      v_status,
      nullif(v_row->>'category_id', '')::uuid,
      nullif(v_row->>'matched_transaction_id', '')::uuid,
      v_transaction_id,
      nullif(v_row->>'error_message', '')
    );
  end loop;

  update public.bank_imports
  set new_count = (select count(*) from public.bank_import_rows where import_id = v_import_id and status = 'new'),
      matched_count = (select count(*) from public.bank_import_rows where import_id = v_import_id and status = 'matched'),
      error_count = (select count(*) from public.bank_import_rows where import_id = v_import_id and status = 'error'),
      updated_at = now()
  where id = v_import_id;

  return v_import_id;
end;
$$;

create or replace function public.cancel_bank_import(p_import_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_import public.bank_imports%rowtype;
  v_cancelled integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_import
  from public.bank_imports
  where id = p_import_id and user_id = v_user_id
  for update;

  if not found then raise exception 'Import not found'; end if;
  if v_import.status = 'cancelled' then
    return jsonb_build_object('import_id', p_import_id, 'cancelled_transactions', 0, 'already_cancelled', true);
  end if;

  update public.transactions t
  set is_deleted = true, updated_at = now()
  from public.bank_import_rows r
  where r.import_id = p_import_id
    and r.user_id = v_user_id
    and r.created_transaction_id = t.id
    and t.user_id = v_user_id
    and t.is_deleted = false;
  get diagnostics v_cancelled = row_count;

  update public.bank_imports
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = p_import_id and user_id = v_user_id;

  return jsonb_build_object(
    'import_id', p_import_id,
    'cancelled_transactions', v_cancelled,
    'already_cancelled', false
  );
end;
$$;

revoke all on function public.save_bank_import(text, text, jsonb, jsonb) from public, anon;
revoke all on function public.cancel_bank_import(uuid) from public, anon;
grant execute on function public.save_bank_import(text, text, jsonb, jsonb) to authenticated;
grant execute on function public.cancel_bank_import(uuid) to authenticated;

-- ============================================================================
-- SOURCE: supabase/migrations/20260917000100_harden_functions_and_indexes.sql
-- ============================================================================

-- Hardening berdasarkan Supabase security/performance advisors.
alter function public.set_updated_at() set search_path = '';

-- Fungsi ini hanya dipanggil trigger auth.users, bukan endpoint RPC aplikasi.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index if not exists transactions_category_id_idx
  on public.transactions (category_id);

create index if not exists bank_import_rows_category_id_idx
  on public.bank_import_rows (category_id);

-- ============================================================================
-- SOURCE: supabase/migrations/20260921000100_create_shipment_settlements.sql
-- ============================================================================

-- Shipment context for Anteraja Finance.
-- Financial reconciliation remains FRD-06; these tables make each payout
-- traceable to one or more shipment references.

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tracking_number text not null check (char_length(trim(tracking_number)) between 8 and 40),
  service_type text not null default 'regular'
    check (service_type in ('regular', 'next_day', 'same_day', 'economy', 'cargo')),
  delivery_status text not null default 'created'
    check (delivery_status in ('created', 'picked_up', 'in_transit', 'delivered', 'returned', 'cancelled')),
  recipient_name text check (recipient_name is null or char_length(recipient_name) <= 120),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipments_user_tracking_unique unique (user_id, tracking_number),
  constraint shipments_id_user_unique unique (id, user_id),
  constraint shipments_delivery_time_consistent check (
    delivery_status <> 'delivered' or delivered_at is not null
  )
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reference text not null check (char_length(trim(reference)) between 3 and 80),
  settlement_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'paid', 'reconciled', 'disputed', 'cancelled')),
  gross_amount bigint not null default 0 check (gross_amount >= 0),
  fee_amount bigint not null default 0 check (fee_amount >= 0),
  return_amount bigint not null default 0 check (return_amount >= 0),
  net_amount bigint generated always as (gross_amount - fee_amount - return_amount) stored,
  reconciled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settlements_amounts_consistent check (gross_amount >= fee_amount + return_amount),
  constraint settlements_user_reference_unique unique (user_id, reference),
  constraint settlements_id_user_unique unique (id, user_id),
  constraint settlements_reconciled_time_consistent check (
    status <> 'reconciled' or reconciled_at is not null
  )
);

create table public.settlement_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  settlement_id uuid not null,
  shipment_id uuid not null,
  cod_amount bigint not null default 0 check (cod_amount >= 0),
  shipping_fee bigint not null default 0 check (shipping_fee >= 0),
  service_fee bigint not null default 0 check (service_fee >= 0),
  return_amount bigint not null default 0 check (return_amount >= 0),
  net_amount bigint generated always as (
    cod_amount - shipping_fee - service_fee - return_amount
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint settlement_items_amounts_consistent check (
    cod_amount >= shipping_fee + service_fee + return_amount
  ),
  constraint settlement_items_settlement_user_fkey
    foreign key (settlement_id, user_id)
    references public.settlements(id, user_id) on delete cascade,
  constraint settlement_items_shipment_user_fkey
    foreign key (shipment_id, user_id)
    references public.shipments(id, user_id) on delete restrict,
  constraint settlement_items_settlement_shipment_unique unique (settlement_id, shipment_id)
);

alter table public.bank_import_rows
  add column settlement_id uuid;

alter table public.bank_import_rows
  add constraint bank_import_rows_settlement_user_fkey
  foreign key (settlement_id, user_id)
  references public.settlements(id, user_id) on delete restrict;

create index shipments_user_status_idx
  on public.shipments(user_id, delivery_status, created_at desc);
create index settlements_user_date_idx
  on public.settlements(user_id, settlement_date desc);
create index settlements_user_status_idx
  on public.settlements(user_id, status);
create index settlement_items_user_settlement_idx
  on public.settlement_items(user_id, settlement_id);
create index settlement_items_shipment_idx
  on public.settlement_items(shipment_id);
create index bank_import_rows_settlement_idx
  on public.bank_import_rows(settlement_id)
  where settlement_id is not null;

create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();
create trigger settlements_set_updated_at
  before update on public.settlements
  for each row execute function public.set_updated_at();
create trigger settlement_items_set_updated_at
  before update on public.settlement_items
  for each row execute function public.set_updated_at();

create or replace function public.recalculate_settlement_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.settlements s
    set gross_amount = totals.gross_amount,
        fee_amount = totals.fee_amount,
        return_amount = totals.return_amount,
        updated_at = now()
    from (
      select
        coalesce(sum(i.cod_amount), 0)::bigint as gross_amount,
        coalesce(sum(i.shipping_fee + i.service_fee), 0)::bigint as fee_amount,
        coalesce(sum(i.return_amount), 0)::bigint as return_amount
      from public.settlement_items i
      where i.settlement_id = old.settlement_id
    ) totals
    where s.id = old.settlement_id;
  end if;

  if tg_op = 'DELETE' then return old; end if;

  update public.settlements s
  set gross_amount = totals.gross_amount,
      fee_amount = totals.fee_amount,
      return_amount = totals.return_amount,
      updated_at = now()
  from (
    select
      coalesce(sum(i.cod_amount), 0)::bigint as gross_amount,
      coalesce(sum(i.shipping_fee + i.service_fee), 0)::bigint as fee_amount,
      coalesce(sum(i.return_amount), 0)::bigint as return_amount
    from public.settlement_items i
    where i.settlement_id = new.settlement_id
  ) totals
  where s.id = new.settlement_id;
  return new;
end;
$$;

create trigger settlement_items_recalculate_totals
  after insert or update or delete on public.settlement_items
  for each row execute function public.recalculate_settlement_totals();

create or replace function public.link_bank_row_to_settlement(
  p_import_row_id uuid,
  p_settlement_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.bank_import_rows%rowtype;
  v_settlement public.settlements%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;

  select * into v_row
  from public.bank_import_rows
  where id = p_import_row_id and user_id = v_user_id
  for update;
  if not found then raise exception 'Import row not found'; end if;
  if v_row.status = 'error' or v_row.amount is null then
    raise exception 'Error row cannot be linked';
  end if;

  select * into v_settlement
  from public.settlements
  where id = p_settlement_id and user_id = v_user_id
  for update;
  if not found then raise exception 'Settlement not found'; end if;
  if v_settlement.status in ('cancelled', 'disputed') then
    raise exception 'Settlement status cannot be reconciled';
  end if;
  if v_row.amount <> v_settlement.net_amount then
    raise exception 'Mutation amount does not match settlement net amount';
  end if;

  update public.bank_import_rows
  set settlement_id = p_settlement_id
  where id = p_import_row_id and user_id = v_user_id;

  update public.settlements
  set status = 'reconciled', reconciled_at = now(), updated_at = now()
  where id = p_settlement_id and user_id = v_user_id;

  return jsonb_build_object(
    'import_row_id', p_import_row_id,
    'settlement_id', p_settlement_id,
    'net_amount', v_settlement.net_amount,
    'status', 'reconciled'
  );
end;
$$;

alter table public.shipments enable row level security;
alter table public.settlements enable row level security;
alter table public.settlement_items enable row level security;

create policy "shipments_select_own" on public.shipments
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "shipments_insert_own" on public.shipments
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "shipments_update_own" on public.shipments
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "shipments_delete_own" on public.shipments
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "settlements_select_own" on public.settlements
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "settlements_insert_own" on public.settlements
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settlements_update_own" on public.settlements
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "settlement_items_select_own" on public.settlement_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "settlement_items_insert_own" on public.settlement_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "settlement_items_update_own" on public.settlement_items
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "settlement_items_delete_own" on public.settlement_items
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.shipments, public.settlements, public.settlement_items from anon, authenticated;
grant select, insert, update, delete on public.shipments to authenticated;
grant select on public.settlements to authenticated;
grant insert (user_id, reference, settlement_date, status, reconciled_at)
  on public.settlements to authenticated;
grant update (reference, settlement_date, status, reconciled_at)
  on public.settlements to authenticated;
grant select, insert, update, delete on public.settlement_items to authenticated;

revoke all on function public.recalculate_settlement_totals() from public, anon, authenticated;
revoke all on function public.link_bank_row_to_settlement(uuid, uuid) from public, anon;
grant execute on function public.link_bank_row_to_settlement(uuid, uuid) to authenticated;

-- ============================================================================
-- SOURCE: supabase/migrations/20260922000100_build_tracking_resolution.sql
-- ============================================================================

-- Anteraja Tracking & Resolution Platform
-- Additive migration: shipment tracking becomes the primary product while
-- settlement reconciliation remains connected through shipment_id.

alter table public.shipments drop constraint if exists shipments_delivery_status_check;
alter table public.shipments
  add constraint shipments_delivery_status_check check (
    delivery_status in (
      'created', 'picked_up', 'in_transit', 'out_for_delivery',
      'failed_delivery', 'delivered', 'returned', 'cancelled'
    )
  );

alter table public.shipments
  add column sender_name text,
  add column recipient_phone text,
  add column origin_city text,
  add column destination_city text,
  add column destination_district text,
  add column destination_street text,
  add column destination_landmark text,
  add column estimated_delivery_at timestamptz,
  add column last_scan_at timestamptz,
  add column risk_status text not null default 'on_track',
  add column exception_code text,
  add column exception_reason text,
  add column current_location text,
  add column current_lat numeric(9, 6),
  add column current_lng numeric(9, 6),
  add column access_code_hash text;

alter table public.shipments
  add constraint shipments_risk_status_check
    check (risk_status in ('on_track', 'at_risk', 'action_required', 'resolved')),
  add constraint shipments_location_coordinates_check check (
    (current_lat is null and current_lng is null) or
    (current_lat between -90 and 90 and current_lng between -180 and 180)
  ),
  add constraint shipments_landmark_length_check
    check (destination_landmark is null or char_length(destination_landmark) <= 150);

create table public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  shipment_id uuid not null,
  event_code text not null check (char_length(event_code) between 2 and 50),
  status_label text not null check (char_length(status_label) between 2 and 100),
  description text not null check (char_length(description) between 2 and 500),
  location text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint shipment_events_shipment_user_fkey foreign key (shipment_id, user_id)
    references public.shipments(id, user_id) on delete cascade,
  constraint shipment_events_coordinates_check check (
    (latitude is null and longitude is null) or
    (latitude between -90 and 90 and longitude between -180 and 180)
  )
);

create table public.shipment_resolutions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  shipment_id uuid not null,
  resolution_type text not null
    check (resolution_type in ('update_address', 'reschedule', 'safe_drop')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending_sync'
    check (status in ('pending_sync', 'synced', 'failed', 'cancelled')),
  submitted_at timestamptz not null default now(),
  synced_at timestamptz,
  constraint shipment_resolutions_shipment_user_fkey foreign key (shipment_id, user_id)
    references public.shipments(id, user_id) on delete cascade
);

create unique index shipment_resolutions_once_per_utc_day_idx
  on public.shipment_resolutions (
    shipment_id,
    (date(timezone('UTC', submitted_at)))
  ) where status <> 'cancelled';

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  shipment_id uuid not null,
  ticket_number text not null unique,
  customer_note text check (customer_note is null or char_length(customer_note) <= 500),
  context_snapshot jsonb not null check (jsonb_typeof(context_snapshot) = 'object'),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  response_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_shipment_user_fkey foreign key (shipment_id, user_id)
    references public.shipments(id, user_id) on delete cascade
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  shipment_id uuid not null,
  whatsapp_enabled boolean not null default false,
  email_enabled boolean not null default false,
  push_enabled boolean not null default false,
  meaningful_changes_only boolean not null default true,
  destination_masked text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_shipment_user_fkey foreign key (shipment_id, user_id)
    references public.shipments(id, user_id) on delete cascade,
  constraint notification_preferences_shipment_unique unique (shipment_id)
);

create table public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  shipment_id uuid,
  destination text not null check (destination in ('courier', 'customer_service', 'whatsapp', 'email', 'push')),
  event_type text not null check (char_length(event_type) between 2 and 80),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 20),
  available_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint integration_outbox_shipment_user_fkey foreign key (shipment_id, user_id)
    references public.shipments(id, user_id) on delete cascade
);

create table public.tracking_rate_limits (
  client_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count between 1 and 1000)
);

create index shipment_events_timeline_idx on public.shipment_events(shipment_id, occurred_at desc);
create unique index shipments_tracking_number_unique on public.shipments(tracking_number);
create index shipments_user_risk_idx on public.shipments(user_id, risk_status, estimated_delivery_at);
create index support_tickets_shipment_idx on public.support_tickets(shipment_id, created_at desc);
create index integration_outbox_pending_idx on public.integration_outbox(status, available_at)
  where status in ('pending', 'failed');

create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create or replace function public.evaluate_shipment_risk()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Resolution is an explicit temporary state and must not be overwritten by
  -- the original failed-delivery event until a new operational scan arrives.
  if new.risk_status = 'resolved' then return new; end if;

  if new.delivery_status = 'failed_delivery'
     or new.exception_code in ('ADDRESS_INCOMPLETE', 'RECIPIENT_ABSENT') then
    new.risk_status := 'action_required';
  elsif new.delivery_status in ('picked_up', 'in_transit', 'out_for_delivery')
     and new.last_scan_at < now() - interval '6 hours' then
    new.risk_status := 'at_risk';
  else
    new.risk_status := 'on_track';
  end if;
  return new;
end;
$$;

create trigger shipments_evaluate_risk
  before insert or update of delivery_status, last_scan_at, exception_code, risk_status
  on public.shipments for each row execute function public.evaluate_shipment_risk();

alter table public.shipment_events enable row level security;
alter table public.shipment_resolutions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.tracking_rate_limits enable row level security;

create policy "shipment_events_select_own" on public.shipment_events
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "shipment_resolutions_select_own" on public.shipment_resolutions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "support_tickets_select_own" on public.support_tickets
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "support_tickets_update_own" on public.support_tickets
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "notification_preferences_select_own" on public.notification_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "integration_outbox_select_own" on public.integration_outbox
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.shipment_events, public.shipment_resolutions,
  public.support_tickets, public.notification_preferences,
  public.integration_outbox, public.tracking_rate_limits from anon, authenticated;
grant select on public.shipment_events, public.shipment_resolutions,
  public.support_tickets, public.notification_preferences,
  public.integration_outbox to authenticated;
grant update (status) on public.support_tickets to authenticated;

create or replace function public.consume_tracking_rate_limit(p_client_key text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_client_key is null or char_length(p_client_key) < 8 then return false; end if;

  insert into public.tracking_rate_limits(client_key, window_started_at, request_count)
  values (p_client_key, now(), 1)
  on conflict (client_key) do update set
    window_started_at = case
      when public.tracking_rate_limits.window_started_at <= now() - interval '1 minute' then now()
      else public.tracking_rate_limits.window_started_at
    end,
    request_count = case
      when public.tracking_rate_limits.window_started_at <= now() - interval '1 minute' then 1
      else public.tracking_rate_limits.request_count + 1
    end
  returning request_count into v_count;

  return v_count <= 10;
end;
$$;

create or replace function public.get_public_tracking(p_awb text, p_access_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shipment public.shipments%rowtype;
  v_events jsonb;
  v_name text;
  v_phone text;
begin
  select * into v_shipment from public.shipments
  where tracking_number = upper(trim(p_awb))
    and access_code_hash = encode(extensions.digest(p_access_code, 'sha256'), 'hex');
  if not found then return null; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'event_code', e.event_code,
    'status_label', e.status_label,
    'description', e.description,
    'location', e.location,
    'occurred_at', e.occurred_at
  ) order by e.occurred_at desc), '[]'::jsonb)
  into v_events from public.shipment_events e where e.shipment_id = v_shipment.id;

  v_name := case
    when v_shipment.recipient_name is null then null
    when char_length(v_shipment.recipient_name) <= 2 then left(v_shipment.recipient_name, 1) || '*'
    else left(v_shipment.recipient_name, 1) || repeat('*', least(char_length(v_shipment.recipient_name) - 2, 8)) || right(v_shipment.recipient_name, 1)
  end;
  v_phone := case
    when v_shipment.recipient_phone is null then null
    else left(v_shipment.recipient_phone, 3) || repeat('*', greatest(char_length(v_shipment.recipient_phone) - 6, 3)) || right(v_shipment.recipient_phone, 3)
  end;

  return jsonb_build_object(
    'id', v_shipment.id,
    'tracking_number', v_shipment.tracking_number,
    'service_type', v_shipment.service_type,
    'delivery_status', v_shipment.delivery_status,
    'risk_status', v_shipment.risk_status,
    'recipient_name', v_name,
    'recipient_phone', v_phone,
    'origin_city', v_shipment.origin_city,
    'destination_city', v_shipment.destination_city,
    'destination_district', v_shipment.destination_district,
    'estimated_delivery_at', v_shipment.estimated_delivery_at,
    'last_scan_at', v_shipment.last_scan_at,
    'exception_code', v_shipment.exception_code,
    'exception_reason', v_shipment.exception_reason,
    'current_location', v_shipment.current_location,
    'events', v_events,
    'available_actions', case
      when v_shipment.risk_status = 'action_required' then jsonb_build_array('update_address', 'reschedule', 'safe_drop', 'contact_support')
      when v_shipment.risk_status = 'at_risk' then jsonb_build_array('contact_support', 'notifications')
      else jsonb_build_array('notifications')
    end
  );
end;
$$;

create or replace function public.submit_tracking_resolution(
  p_awb text,
  p_access_code text,
  p_resolution_type text,
  p_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shipment public.shipments%rowtype;
  v_resolution_id uuid;
begin
  if p_resolution_type not in ('update_address', 'reschedule', 'safe_drop') then
    raise exception 'Unsupported resolution type';
  end if;
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'Invalid payload'; end if;
  if char_length(coalesce(p_payload->>'landmark', '')) > 150 then raise exception 'Landmark too long'; end if;

  select * into v_shipment from public.shipments
  where tracking_number = upper(trim(p_awb))
    and access_code_hash = encode(extensions.digest(p_access_code, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'Tracking access invalid'; end if;
  if v_shipment.risk_status not in ('action_required', 'at_risk') then
    raise exception 'Shipment does not require a resolution';
  end if;
  if exists (
    select 1 from public.shipment_resolutions
    where shipment_id = v_shipment.id
      and submitted_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'
      and status <> 'cancelled'
  ) then raise exception 'Resolution already submitted today'; end if;

  insert into public.shipment_resolutions(user_id, shipment_id, resolution_type, payload)
  values (v_shipment.user_id, v_shipment.id, p_resolution_type, p_payload)
  returning id into v_resolution_id;

  update public.shipments set
    destination_district = coalesce(nullif(trim(p_payload->>'district'), ''), destination_district),
    destination_street = coalesce(nullif(trim(p_payload->>'street'), ''), destination_street),
    destination_landmark = coalesce(nullif(trim(p_payload->>'landmark'), ''), destination_landmark),
    recipient_phone = coalesce(nullif(trim(p_payload->>'phone'), ''), recipient_phone),
    risk_status = 'resolved',
    exception_reason = 'Informasi penerima diterima dan menunggu sinkronisasi kurir.',
    updated_at = now()
  where id = v_shipment.id;

  insert into public.shipment_events(user_id, shipment_id, event_code, status_label, description, location, occurred_at)
  values (v_shipment.user_id, v_shipment.id, 'resolution_received', 'Instruksi diterima',
    'Instruksi penerima sudah diterima dan diteruskan ke tim operasional.', v_shipment.current_location, now());

  insert into public.integration_outbox(user_id, shipment_id, destination, event_type, payload)
  values (v_shipment.user_id, v_shipment.id, 'courier', 'shipment.resolution_submitted',
    jsonb_build_object('resolution_id', v_resolution_id, 'type', p_resolution_type, 'data', p_payload));

  return jsonb_build_object('resolution_id', v_resolution_id, 'status', 'pending_sync',
    'message', 'Instruksi sudah diterima. Tim operasional akan menindaklanjuti.');
end;
$$;

create or replace function public.create_tracking_ticket(
  p_awb text,
  p_access_code text,
  p_note text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shipment public.shipments%rowtype;
  v_ticket text;
  v_ticket_id uuid;
  v_snapshot jsonb;
begin
  if char_length(coalesce(p_note, '')) > 500 then raise exception 'Note too long'; end if;
  select * into v_shipment from public.shipments
  where tracking_number = upper(trim(p_awb))
    and access_code_hash = encode(extensions.digest(p_access_code, 'sha256'), 'hex')
  for update;
  if not found then raise exception 'Tracking access invalid'; end if;

  v_ticket := 'AJ-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  select jsonb_build_object(
    'tracking_number', v_shipment.tracking_number,
    'risk_status', v_shipment.risk_status,
    'exception_code', v_shipment.exception_code,
    'exception_reason', v_shipment.exception_reason,
    'last_location', v_shipment.current_location,
    'landmark', v_shipment.destination_landmark,
    'recent_events', coalesce((select jsonb_agg(x) from (
      select status_label, description, location, occurred_at
      from public.shipment_events where shipment_id = v_shipment.id
      order by occurred_at desc limit 5
    ) x), '[]'::jsonb)
  ) into v_snapshot;

  insert into public.support_tickets(user_id, shipment_id, ticket_number, customer_note, context_snapshot, response_due_at)
  values (v_shipment.user_id, v_shipment.id, v_ticket, nullif(trim(p_note), ''), v_snapshot, now() + interval '2 hours')
  returning id into v_ticket_id;

  insert into public.integration_outbox(user_id, shipment_id, destination, event_type, payload)
  values (v_shipment.user_id, v_shipment.id, 'customer_service', 'support.ticket_created',
    jsonb_build_object('ticket_id', v_ticket_id, 'ticket_number', v_ticket, 'context', v_snapshot));

  return jsonb_build_object('ticket_id', v_ticket_id, 'ticket_number', v_ticket,
    'status', 'open', 'response_due_at', now() + interval '2 hours');
end;
$$;

create or replace function public.set_tracking_notifications(
  p_awb text,
  p_access_code text,
  p_whatsapp boolean,
  p_email boolean,
  p_push boolean
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shipment public.shipments%rowtype;
begin
  select * into v_shipment from public.shipments
  where tracking_number = upper(trim(p_awb))
    and access_code_hash = encode(extensions.digest(p_access_code, 'sha256'), 'hex');
  if not found then raise exception 'Tracking access invalid'; end if;

  insert into public.notification_preferences(
    user_id, shipment_id, whatsapp_enabled, email_enabled, push_enabled, destination_masked
  ) values (
    v_shipment.user_id, v_shipment.id, p_whatsapp, p_email, p_push,
    case when v_shipment.recipient_phone is null then null
      else left(v_shipment.recipient_phone, 3) || '***' || right(v_shipment.recipient_phone, 3) end
  ) on conflict (shipment_id) do update set
    whatsapp_enabled = excluded.whatsapp_enabled,
    email_enabled = excluded.email_enabled,
    push_enabled = excluded.push_enabled,
    updated_at = now();

  return jsonb_build_object('whatsapp', p_whatsapp, 'email', p_email, 'push', p_push,
    'meaningful_changes_only', true);
end;
$$;

revoke all on function public.consume_tracking_rate_limit(text) from public;
revoke all on function public.get_public_tracking(text, text) from public;
revoke all on function public.submit_tracking_resolution(text, text, text, jsonb) from public;
revoke all on function public.create_tracking_ticket(text, text, text) from public;
revoke all on function public.set_tracking_notifications(text, text, boolean, boolean, boolean) from public;
revoke all on function public.evaluate_shipment_risk() from public, anon, authenticated;
grant execute on function public.consume_tracking_rate_limit(text) to anon, authenticated;
grant execute on function public.get_public_tracking(text, text) to anon, authenticated;
grant execute on function public.submit_tracking_resolution(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.create_tracking_ticket(text, text, text) to anon, authenticated;
grant execute on function public.set_tracking_notifications(text, text, boolean, boolean, boolean) to anon, authenticated;
