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
