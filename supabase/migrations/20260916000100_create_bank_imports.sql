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
