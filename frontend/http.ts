// every API mutation carries a non-simple header; cross-site forms cannot forge it.
export function appFetch(input: RequestInfo | URL, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (typeof input === 'string' && input.startsWith('/api/')) headers.set('X-Requested-With', 'XMLHttpRequest');
  return fetch(input, { ...options, headers });
}
