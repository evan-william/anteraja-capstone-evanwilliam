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
