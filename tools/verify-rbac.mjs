import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) throw new Error('Supabase URL/key belum tersedia');

const users = [
  { role: 'admin', email: 'admin.demo@contoh.test', password: process.env.RBAC_ADMIN_PASSWORD },
  { role: 'seller', email: 'demo@contoh.test', password: process.env.RBAC_SELLER_PASSWORD },
  { role: 'consumer', email: 'penerima.demo@contoh.test', password: process.env.RBAC_CONSUMER_PASSWORD },
];

for (const entry of users) {
  if (!entry.password) throw new Error(`Password demo ${entry.role} belum tersedia`);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: auth, error: loginError } = await client.auth.signInWithPassword({ email: entry.email, password: entry.password });
  assert.ifError(loginError);
  assert.ok(auth.user);
  const { data: account, error: accountError } = await client.from('account_roles').select('role').eq('user_id', auth.user.id).single();
  assert.ifError(accountError);
  assert.equal(account.role, entry.role);

  const { count: shipmentCount, error: shipmentError } = await client.from('shipments').select('id', { count: 'exact', head: true });
  assert.ifError(shipmentError);
  const { count: financeCount, error: financeError } = await client.from('transactions').select('id', { count: 'exact', head: true });
  assert.ifError(financeError);

  if (entry.role === 'admin') {
    assert.ok(shipmentCount >= 305);
    assert.ok(financeCount >= 30);
    const { error: writeError } = await client.from('categories').insert({ user_id: auth.user.id, name: 'RBAC test', type: 'expense' });
    assert.ok(writeError, 'Admin tidak boleh menulis kategori Seller');
    const { data: ticket } = await client.from('support_tickets').select('id').eq('status', 'in_progress').limit(1).maybeSingle();
    if (ticket) {
      const { data: accepted, error: triageError } = await client.rpc('admin_update_ticket_status', { p_ticket_id: ticket.id, p_status: 'in_progress' });
      assert.ifError(triageError);
      assert.equal(accepted, true);
    }
  } else if (entry.role === 'seller') {
    assert.ok(shipmentCount >= 305);
    assert.ok(financeCount >= 30);
    const { data: ticket } = await client.from('support_tickets').select('id').limit(1).maybeSingle();
    if (ticket) {
      const { error: directStatusError } = await client.from('support_tickets').update({ status: 'resolved' }).eq('id', ticket.id);
      assert.ok(directStatusError, 'Seller tidak boleh melewati audit Admin');
    }
  } else {
    assert.equal(shipmentCount, 0);
    assert.equal(financeCount, 0);
    const { data: own, error: ownError } = await client.rpc('get_my_shipments');
    assert.ifError(ownError);
    assert.equal(own.length, 3);
    const { error: writeError } = await client.from('categories').insert({ user_id: auth.user.id, name: 'RBAC test', type: 'expense' });
    assert.ok(writeError, 'Konsumen tidak boleh menulis kategori Finance');
  }
  console.log(`${entry.role}: login dan RLS valid; shipment=${shipmentCount}; finance=${financeCount}`);
  await client.auth.signOut();
}
