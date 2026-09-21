-- Inventory objek database. Query ini read-only.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users', 'categories', 'transactions', 'bank_imports', 'bank_import_rows',
    'category_rules', 'shipments', 'shipment_events', 'shipment_resolutions',
    'support_tickets', 'notification_preferences', 'integration_outbox',
    'tracking_rate_limits', 'settlements', 'settlement_items'
  )
order by table_name;

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'users', 'categories', 'transactions', 'bank_imports', 'bank_import_rows',
    'category_rules', 'shipments', 'shipment_events', 'shipment_resolutions',
    'support_tickets', 'notification_preferences', 'integration_outbox',
    'tracking_rate_limits', 'settlements', 'settlement_items'
  )
order by c.relname;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'handle_new_user', 'set_updated_at', 'save_bank_import',
    'cancel_bank_import', 'recalculate_settlement_totals',
    'link_bank_row_to_settlement', 'consume_tracking_rate_limit',
    'get_public_tracking', 'submit_tracking_resolution',
    'create_tracking_ticket', 'set_tracking_notifications'
  )
order by routine_name;

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
