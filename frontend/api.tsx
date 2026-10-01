import { appFetch } from '@/frontend/http';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

type AuthState = { user: User | null; loading: boolean; reload: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  async function reload() {
    try { setUser(await api<User | null>('/api/v1/auth/me')); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    api<User | null>('/api/v1/auth/me')
      .then((result) => { if (active) setUser(result); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <AuthContext.Provider value={{ user, loading, reload }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider belum tersedia.');
  return value;
}

export function useData<T>(path: string): { data: T | null; error: string; loading: boolean; reload: () => void } {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; data: T | null; error: string }>({ key: '', data: null, error: '' });
  const key = `${path}:${revision}`;
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener('anteraja:refresh', refresh);
    return () => window.removeEventListener('anteraja:refresh', refresh);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    appFetch(path, { signal: controller.signal, credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.json() as Promise<Envelope<T>>)
      .then((body) => { if (body.success) setState({ key, data: body.data, error: '' }); else throw new Error(body.error.message); })
      .catch((caught) => { if (!controller.signal.aborted) setState({ key, data: null, error: caught instanceof Error ? caught.message : 'Data belum dapat dimuat.' }); });
    return () => controller.abort();
  }, [path, key]);
  return { data: state.key === key ? state.data : null, error: state.key === key ? state.error : '', loading: state.key !== key, reload: () => setRevision((value) => value + 1) };
}
