-- Only signed-in Consumers and Sellers may open a support ticket.
-- Keep the original tracking implementation private and wrap it with a role check.
alter function public.create_tracking_ticket(text, text, text)
  rename to create_tracking_ticket_unrestricted;

revoke all on function public.create_tracking_ticket_unrestricted(text, text, text)
  from public, anon, authenticated;

create function public.create_tracking_ticket(
  p_awb text, p_access_code text, p_note text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role from public.account_roles where user_id = (select auth.uid());
  if coalesce(v_role, '') not in ('consumer', 'seller') then
    raise exception 'Ticket creation forbidden';
  end if;
  return public.create_tracking_ticket_unrestricted(p_awb, p_access_code, p_note);
end;
$$;

revoke all on function public.create_tracking_ticket(text, text, text) from public, anon, authenticated;
grant execute on function public.create_tracking_ticket(text, text, text) to authenticated;

-- A Seller can report a problem from a shipment they own without knowing
-- the recipient's six-digit tracking access code.
create function public.create_seller_ticket(p_shipment_id uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shipment public.shipments%rowtype;
  v_ticket text;
  v_ticket_id uuid;
  v_snapshot jsonb;
  v_role text;
begin
  select role into v_role from public.account_roles where user_id = (select auth.uid());
  if coalesce(v_role, '') <> 'seller' then raise exception 'Ticket creation forbidden'; end if;
  if char_length(coalesce(p_note, '')) > 500 then raise exception 'Note too long'; end if;

  select * into v_shipment from public.shipments
  where id = p_shipment_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'Shipment not found'; end if;

  v_ticket := 'AJ-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  select jsonb_build_object(
    'tracking_number', v_shipment.tracking_number,
    'risk_status', v_shipment.risk_status,
    'exception_code', v_shipment.exception_code,
    'exception_reason', v_shipment.exception_reason,
    'last_location', v_shipment.current_location,
    'landmark', v_shipment.destination_landmark,
    'source', 'seller',
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

revoke all on function public.create_seller_ticket(uuid, text) from public, anon, authenticated;
grant execute on function public.create_seller_ticket(uuid, text) to authenticated;
