import { appFetch } from '@/http';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type MutableRefObject } from 'react';
import { bootstrapUrl } from './bootstrap';
import { clearSharedReads, sharedRead } from './shared-read';

export type Role = 'admin' | 'seller' | 'consumer';
export type User = { id: string; email: string; name: string; role: Role };
type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await appFetch(path, { credentials: 'same-origin', cache: 'no-store', ...options,
    headers: { ...Object.fromEntries(new Headers(options?.headers)), 'X-Requested-With': 'XMLHttpRequest' } });
  const body = await response.json() as Envelope<T>;
  if (!body.success) throw new Error(body.error.message);
  return body.data;
}

export async function post<T>(path: string, data: unknown): Promise<T> {
  return api<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

type Bootstrap = { user: User | null; resources: Array<{ path: string; envelope: Envelope<unknown> }> };
type AuthState = { user: User | null; loading: boolean; reload: () => Promise<void>; acceptUser: (user: User) => void; seeds: MutableRefObject<Map<string, Envelope<unknown>>> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const seeds = useRef(new Map<string, Envelope<unknown>>());
  const initial = useRef<Promise<Bootstrap> | null>(null);
  const initialUrl = useRef(bootstrapUrl(window.location.pathname, window.location.search));
  const authEpoch = useRef(0);
  function acceptUser(result: User) { authEpoch.current++; clearSharedReads(); seeds.current.clear(); setUser(result); setLoading(false); }
  async function reload() {
    const epoch = ++authEpoch.current;
    clearSharedReads();
    seeds.current.clear();
    try { const result = await api<User | null>('/api/v1/auth/me'); if (epoch === authEpoch.current) setUser(result); }
    catch { if (epoch === authEpoch.current) setUser(null); }
    finally { if (epoch === authEpoch.current) setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    const epoch = authEpoch.current;
    initial.current ??= api<Bootstrap>(initialUrl.current);
    initial.current
      .then((result) => { if (active && epoch === authEpoch.current) { seeds.current.clear(); for (const resource of result.resources) seeds.current.set(resource.path, resource.envelope); setUser(result.user); } })
      .catch(() => { if (active && epoch === authEpoch.current) setUser(null); })
      .finally(() => { if (active && epoch === authEpoch.current) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <AuthContext.Provider value={{ user, loading, reload, acceptUser, seeds }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider belum tersedia.');
  return value;
}

export function useData<T>(path: string): { data: T | null; error: string; loading: boolean; reload: () => void } {
  const auth = useContext(AuthContext);
  const seeds = auth?.seeds;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; data: T | null; error: string }>(() => {
    const seed = seeds?.current.get(path);
    return seed ? { key: `${path}:0`, data: seed.success ? seed.data as T : null, error: seed.success ? '' : seed.error.message } : { key: '', data: null, error: '' };
  });
  const key = `${path}:${revision}`;
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('anteraja:refresh', refresh);
    return () => window.removeEventListener('anteraja:refresh', refresh);
  }, []);
  useEffect(() => {
    seeds?.current.delete(path);
    if (state.key === key) return;
    let active = true;
    const read = sharedRead<Envelope<T>>(key, (signal) => appFetch(path, { signal, credentials: 'same-origin', cache: 'no-store' }).then((response) => response.json() as Promise<Envelope<T>>));
    read.promise
      .then((body) => { if (!active) return; if (body.success) setState({ key, data: body.data, error: '' }); else throw new Error(body.error.message); })
      .catch((caught) => { if (active) setState({ key, data: null, error: caught instanceof Error ? caught.message : 'Data belum dapat dimuat.' }); });
    return () => { active = false; read.release(); };
  }, [path, key, state.key, seeds]);
  return { data: state.key === key ? state.data : null, error: state.key === key ? state.error : '', loading: state.key !== key, reload: () => setRevision((value) => value + 1) };
}
