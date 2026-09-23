-- Additive, repeatable seed for the Admin and Consumer demo accounts.
-- Existing Seller demo data is not reset or reassigned.
-- Before execution, set app.demo_admin_password and
-- app.demo_consumer_password in the SAME database session/transaction.

begin;
set local search_path = public, extensions;

do $$
begin
  if nullif(current_setting('app.demo_admin_password', true), '') is null
    or nullif(current_setting('app.demo_consumer_password', true), '') is null then
    raise exception 'Set both demo passwords in this session before running seed-rbac-demo.sql';
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   'authenticated', 'authenticated', 'admin.demo@contoh.test',
   crypt(current_setting('app.demo_admin_password'), gen_salt('bf')),
   '', '', '', '', now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Petugas Demo","requested_role":"consumer"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   'authenticated', 'authenticated', 'penerima.demo@contoh.test',
   crypt(current_setting('app.demo_consumer_password'), gen_salt('bf')),
   '', '', '', '', now(),
   '{"provider":"email","providers":["email"]}'::jsonb,
   '{"name":"Penerima Demo","requested_role":"consumer"}'::jsonb, now(), now())
on conflict (id) do nothing;

insert into auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
   '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","email":"admin.demo@contoh.test","email_verified":true,"phone_verified":false}'::jsonb,
   'email', now(), now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
   '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","email":"penerima.demo@contoh.test","email_verified":true,"phone_verified":false}'::jsonb,
   'email', now(), now(), now())
on conflict do nothing;

insert into public.users (id, email, name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin.demo@contoh.test', 'Petugas Demo'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'penerima.demo@contoh.test', 'Penerima Demo')
on conflict (id) do nothing;

insert into public.account_roles (user_id, role) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'admin'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'consumer')
on conflict (user_id) do update set role = excluded.role, updated_at = now();

insert into public.recipient_shipments (user_id, shipment_id)
select 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', id
from public.shipments
where tracking_number in ('ANT-100015', 'ANT-100084', 'ANT-100112')
  and user_id = '11111111-1111-4111-8111-111111111111'
on conflict do nothing;

commit;
