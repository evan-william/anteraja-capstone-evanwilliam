-- Audited status changes for customer-service tickets handled by operations.
create table public.admin_ticket_actions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_id uuid not null references public.users(id),
  old_status text not null,
  new_status text not null check (new_status in ('in_progress', 'resolved')),
  created_at timestamptz not null default now()
);

create index admin_ticket_actions_ticket_idx on public.admin_ticket_actions(ticket_id, created_at desc);
alter table public.admin_ticket_actions enable row level security;
create policy admin_ticket_actions_read on public.admin_ticket_actions
  for select to authenticated using ((select public.is_admin()));
revoke all on public.admin_ticket_actions from anon, authenticated;
grant select on public.admin_ticket_actions to authenticated;

create or replace function public.admin_update_ticket_status(p_ticket_id uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_old_status text;
begin
  if v_actor is null or not (select public.is_admin()) then
    raise exception 'Akses Admin diperlukan.' using errcode = '42501';
  end if;
  if p_status not in ('in_progress', 'resolved') then
    raise exception 'Status tidak valid.' using errcode = '22023';
  end if;

  select status into v_old_status from public.support_tickets
  where id = p_ticket_id for update;
  if not found then return false; end if;
  if v_old_status = p_status then return true; end if;
  if (v_old_status = 'open' and p_status <> 'in_progress')
     or (v_old_status = 'in_progress' and p_status <> 'resolved')
     or v_old_status in ('resolved', 'closed') then
    raise exception 'Transisi status tidak diperbolehkan.' using errcode = '22023';
  end if;

  update public.support_tickets set status = p_status where id = p_ticket_id;
  insert into public.admin_ticket_actions(ticket_id, actor_id, old_status, new_status)
  values (p_ticket_id, v_actor, v_old_status, p_status);
  return true;
end;
$$;
revoke all on function public.admin_update_ticket_status(uuid, text) from public;
grant execute on function public.admin_update_ticket_status(uuid, text) to authenticated;
