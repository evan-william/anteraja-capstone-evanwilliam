-- Three workspaces: Anteraja operations, seller, and recipient.
-- Roles are owned by the database. Client-editable profile metadata never grants Admin.

create table public.account_roles (
  user_id uuid primary key references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'seller', 'consumer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.account_roles enable row level security;
create policy account_roles_select_self on public.account_roles
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.account_roles from anon, authenticated;
grant select on public.account_roles to authenticated;

insert into public.account_roles (user_id, role)
select id, 'seller' from public.users
on conflict (user_id) do nothing;

-- Existing demo accounts stay Seller so their shipments and Finance still work.
-- Provision a separate Admin demo account after the migration is verified.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;

  -- Only Seller can be self-selected. Admin is never granted from user metadata.
  insert into public.account_roles (user_id, role)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'requested_role' = 'seller'
      then 'seller' else 'consumer' end
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.account_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.account_roles
    where user_id = (select auth.uid()) and role = 'seller'
  );
$$;
revoke all on function public.is_seller() from public;
grant execute on function public.is_seller() to authenticated;

-- A second SELECT policy composes with the original owner policy using OR.
-- Admin receives read access, not cross-account write access.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users', 'categories', 'transactions', 'category_rules',
    'bank_imports', 'bank_import_rows', 'shipments', 'shipment_events',
    'shipment_resolutions', 'support_tickets', 'notification_preferences',
    'integration_outbox', 'settlements', 'settlement_items'
  ] loop
    execute format(
      'create policy admin_select_all on public.%I for select to authenticated using ((select public.is_admin()))',
      table_name
    );
  end loop;
end;
$$;

drop policy shipments_insert_own on public.shipments;
create policy shipments_insert_own on public.shipments
  for insert to authenticated with check (
    (select auth.uid()) = user_id and (select public.is_seller())
  );
drop policy shipments_update_own on public.shipments;
create policy shipments_update_own on public.shipments
  for update to authenticated using (
    (select auth.uid()) = user_id and (select public.is_seller())
  ) with check (
    (select auth.uid()) = user_id and (select public.is_seller())
  );
drop policy shipments_delete_own on public.shipments;
create policy shipments_delete_own on public.shipments
  for delete to authenticated using (
    (select auth.uid()) = user_id and (select public.is_seller())
  );

-- Finance RPCs use SECURITY DEFINER, so table RLS alone cannot prevent a
-- Consumer or Admin from calling them. Guard writes at the table boundary.
create or replace function public.enforce_seller_finance_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not (select public.is_seller()) then
    raise exception 'Akses Finance hanya untuk akun Seller.' using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'categories', 'transactions', 'category_rules', 'bank_imports',
    'bank_import_rows', 'settlements', 'settlement_items'
  ] loop
    execute format(
      'create trigger enforce_seller_finance_write before insert or update or delete on public.%I for each row execute function public.enforce_seller_finance_write()',
      table_name
    );
  end loop;
end;
$$;

create table public.admin_activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (char_length(code_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  constraint admin_activation_use_consistent check (
    (used_at is null and used_by is null) or
    (used_at is not null and used_by is not null)
  )
);
alter table public.admin_activation_codes enable row level security;
revoke all on public.admin_activation_codes from anon, authenticated;

create table public.admin_activation_attempts (
  user_id uuid primary key references public.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0
);
alter table public.admin_activation_attempts enable row level security;
revoke all on public.admin_activation_attempts from anon, authenticated;

create or replace function public.redeem_admin_activation_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_attempts integer;
  v_code_id uuid;
begin
  if v_user_id is null then return false; end if;

  insert into public.admin_activation_attempts (user_id, attempt_count)
  values (v_user_id, 1)
  on conflict (user_id) do update set
    window_started_at = case
      when public.admin_activation_attempts.window_started_at < now() - interval '1 hour'
        then now() else public.admin_activation_attempts.window_started_at end,
    attempt_count = case
      when public.admin_activation_attempts.window_started_at < now() - interval '1 hour'
        then 1 else least(public.admin_activation_attempts.attempt_count + 1, 6) end
  returning attempt_count into v_attempts;

  if v_attempts > 5 or p_code is null or char_length(p_code) > 100 then
    return false;
  end if;

  if not exists (
    select 1 from public.account_roles
    where user_id = v_user_id and role = 'consumer'
  ) then return false; end if;

  select id into v_code_id
  from public.admin_activation_codes
  where code_hash = encode(extensions.digest(upper(trim(p_code)), 'sha256'), 'hex')
    and used_at is null and expires_at > now()
  for update;

  if v_code_id is null then return false; end if;

  update public.admin_activation_codes
  set used_at = now(), used_by = v_user_id
  where id = v_code_id;

  update public.account_roles
  set role = 'admin', updated_at = now()
  where user_id = v_user_id and role = 'consumer';

  if not found then
    raise exception 'Akun tidak dapat diaktivasi sebagai Admin.';
  end if;

  return true;
end;
$$;
revoke all on function public.redeem_admin_activation_code(text) from public;
grant execute on function public.redeem_admin_activation_code(text) to authenticated;

-- A recipient link is provisioned only after recipient identity is verified.
-- Demo links may be seeded explicitly; AWB + the shared demo code is not proof.
create table public.recipient_shipments (
  user_id uuid not null references public.users(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (user_id, shipment_id)
);
create index recipient_shipments_shipment_idx on public.recipient_shipments(shipment_id);
alter table public.recipient_shipments enable row level security;
create policy recipient_shipments_select_self on public.recipient_shipments
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.recipient_shipments from anon, authenticated;
grant select on public.recipient_shipments to authenticated;

create or replace function public.get_my_shipments()
returns table (
  tracking_number text,
  service_type text,
  delivery_status text,
  risk_status text,
  origin_city text,
  destination_city text,
  estimated_delivery_at timestamptz,
  last_scan_at timestamptz,
  current_location text,
  exception_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.tracking_number, s.service_type, s.delivery_status,
    s.risk_status, s.origin_city, s.destination_city,
    s.estimated_delivery_at, s.last_scan_at,
    s.current_location, s.exception_reason
  from public.recipient_shipments r
  join public.shipments s on s.id = r.shipment_id
  where r.user_id = (select auth.uid())
  order by s.estimated_delivery_at nulls last, s.created_at desc;
$$;
revoke all on function public.get_my_shipments() from public;
grant execute on function public.get_my_shipments() to authenticated;
