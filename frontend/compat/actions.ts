import { appFetch } from '@/frontend/http';
export async function signOut() {
  await appFetch('/api/v1/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  window.location.assign('/masuk');
}
