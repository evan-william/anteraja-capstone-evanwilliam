-- Read-only assertions. Script melempar exception bila skema belum lengkap.
do $$
declare
  v_missing text[];
  v_rls_missing text[];
begin
  select array_agg(required.name order by required.name)
  into v_missing
  from (values
    ('users'), ('categories'), ('transactions'), ('bank_imports'),
    ('bank_import_rows'), ('category_rules'), ('shipments'),
    ('shipment_events'), ('shipment_resolutions'), ('support_tickets'),
    ('notification_preferences'), ('integration_outbox'), ('tracking_rate_limits'),
    ('settlements'), ('settlement_items')
  ) required(name)
  where to_regclass('public.' || required.name) is null;

  if v_missing is not null then
    raise exception 'Missing tables: %', array_to_string(v_missing, ', ');
  end if;

  select array_agg(c.relname order by c.relname)
  into v_rls_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[
      'users', 'categories', 'transactions', 'bank_imports', 'bank_import_rows',
      'category_rules', 'shipments', 'shipment_events', 'shipment_resolutions',
      'support_tickets', 'notification_preferences', 'integration_outbox',
      'tracking_rate_limits', 'settlements', 'settlement_items'
    ])
    and not c.relrowsecurity;

  if v_rls_missing is not null then
    raise exception 'RLS disabled: %', array_to_string(v_rls_missing, ', ');
  end if;

  if to_regprocedure('public.save_bank_import(text,text,jsonb,jsonb)') is null then
    raise exception 'save_bank_import RPC missing';
  end if;
  if to_regprocedure('public.cancel_bank_import(uuid)') is null then
    raise exception 'cancel_bank_import RPC missing';
  end if;
  if to_regprocedure('public.link_bank_row_to_settlement(uuid,uuid)') is null then
    raise exception 'link_bank_row_to_settlement RPC missing';
  end if;
  if to_regprocedure('public.get_public_tracking(text,text)') is null then
    raise exception 'get_public_tracking RPC missing';
  end if;
  if to_regprocedure('public.submit_tracking_resolution(text,text,text,jsonb)') is null then
    raise exception 'submit_tracking_resolution RPC missing';
  end if;
  if to_regprocedure('public.create_tracking_ticket(text,text,text)') is null then
    raise exception 'create_tracking_ticket RPC missing';
  end if;
  if to_regprocedure('public.set_tracking_notifications(text,text,boolean,boolean,boolean)') is null then
    raise exception 'set_tracking_notifications RPC missing';
  end if;

  raise notice 'DATABASE_SMOKE_TEST_OK';
end;
$$;
