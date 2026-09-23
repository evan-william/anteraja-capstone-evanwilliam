-- Ticket status must change only through the audited Admin RPC.
revoke update (status) on public.support_tickets from authenticated;
drop policy if exists support_tickets_update_own on public.support_tickets;
