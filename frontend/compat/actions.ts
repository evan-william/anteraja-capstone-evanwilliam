export async function signOut() {
  await fetch('/api/v1/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  window.location.assign('/masuk');
}
