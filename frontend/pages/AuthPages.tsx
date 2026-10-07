import { useState, type FormEvent } from 'react';
import Link from '@/compat/Link';
import { useNavigate } from 'react-router-dom';
import { AuthCarousel } from '@/components/ui/auth-carousel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { post, useAuth, type Role, type User } from '../api';

function roleHome(role: Role) { return role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/akun'; }

function AuthShell({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return <main id="main-content" className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
    <AuthCarousel />
    <section className="relative flex items-center justify-center px-5 py-16 sm:px-10">
      <nav aria-label="Navigasi akun" className="absolute right-5 top-5 text-sm font-semibold sm:right-10"><Link href="/lacak" className="underline decoration-primary/50 underline-offset-4">Lacak paket</Link></nav>
      <div className="page-enter w-full max-w-md"><p className="eyebrow">Akses ruang kerja</p><h1 className="page-title">{title}</h1><p className="page-copy mb-7">{copy}</p>{children}</div>
    </section>
  </main>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { acceptUser } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setPending(true);
    const fields = new FormData(event.currentTarget);
    try {
      const user = await post<User>('/api/v1/auth/login', { email: fields.get('email'), password: fields.get('password') });
      acceptUser(user); navigate(roleHome(user.role), { replace: true });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Gagal masuk.'); }
    finally { setPending(false); }
  }
  return <AuthShell title="Masuk" copy="Gunakan akun operasional yang sudah terdaftar.">
    <form id="sign-in-form" onSubmit={submit} className="space-y-4">
      {error && <p id="sign-in-error" role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required aria-describedby={error ? 'sign-in-error' : undefined} /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required aria-describedby={error ? 'sign-in-error' : undefined} /></div>
      <Button id="sign-in-submit" type="submit" className="w-full" disabled={pending}>{pending ? 'Memeriksa akun…' : 'Masuk'}</Button>
    </form>
    <p className="mt-6 text-sm text-muted-foreground">Belum punya akun? <Link href="/daftar" className="font-semibold text-primary">Buat akun</Link></p>
  </AuthShell>;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { reload } = useAuth();
  const [role, setRole] = useState<Role>('consumer');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setPending(true);
    const fields = new FormData(event.currentTarget);
    try {
      const result = await post<{ pending_confirmation?: boolean; pending_activation?: boolean; message?: string; user?: User }>('/api/v1/auth/register', {
        name: fields.get('name'), email: fields.get('email'), password: fields.get('password'), role, activation_code: fields.get('activation_code'),
      });
      if (result.message) setNotice(result.message);
      else { await reload(); navigate(roleHome(result.user?.role || role), { replace: true }); }
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Akun belum dapat dibuat.'); }
    finally { setPending(false); }
  }
  return <AuthShell title="Buat akun" copy="Pilih ruang kerja yang sesuai dengan kebutuhanmu.">
    <form id="sign-up-form" onSubmit={submit} className="space-y-4">
      {error && <p id="sign-up-error" role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm">{notice} {role === 'admin' && <Link href="/aktivasi-admin" className="text-primary underline">Buka Aktivasi Admin</Link>}</p>}
      <fieldset className="space-y-2"><legend className="text-sm font-semibold">Daftar sebagai</legend><div className="grid grid-cols-3 gap-2">{(['consumer', 'seller', 'admin'] as const).map((item) => <label key={item} className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm"><input type="radio" name="role" checked={role === item} onChange={() => setRole(item)} />{item === 'consumer' ? 'Konsumen' : item === 'seller' ? 'Seller' : 'Admin'}</label>)}</div><p className="field-help">Admin memerlukan kode aktivasi resmi.</p></fieldset>
      {role === 'admin' && <div className="space-y-2"><Label htmlFor="activation-code">Kode aktivasi Admin</Label><Input id="activation-code" name="activation_code" required autoComplete="off" /></div>}
      <div className="space-y-2"><Label htmlFor="name">Nama</Label><Input id="name" name="name" required autoComplete="name" maxLength={60} /></div>
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" /><p className="field-help">Minimal 8 karakter.</p></div>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Membuat akun…' : 'Buat akun'}</Button>
    </form>
    <p className="mt-6 text-sm text-muted-foreground">Sudah punya akun? <Link href="/masuk" className="font-semibold text-primary">Masuk</Link></p>
  </AuthShell>;
}

export function ActivatePage() {
  const navigate = useNavigate();
  const { user, reload } = useAuth();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setPending(true);
    try {
      await post('/api/v1/auth/activate-admin', { code: new FormData(event.currentTarget).get('code') });
      await reload(); navigate('/admin', { replace: true });
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Kode belum dapat diperiksa.'); }
    finally { setPending(false); }
  }
  return <><header className="border-b bg-white p-4"><Link href={user ? roleHome(user.role) : '/lacak'} className="font-bold text-primary">anteraja</Link></header><main id="main-content" className="app-main max-w-xl"><h1 className="page-title">Aktivasi Admin</h1><p className="page-copy">Masukkan kode sekali pakai dari pengelola operasional.</p><form onSubmit={submit} className="mt-6 space-y-4">{error && <p role="alert" className="text-destructive">{error}</p>}<Label htmlFor="code">Kode aktivasi</Label><Input id="code" name="code" autoComplete="off" required /><Button type="submit" disabled={pending}>{pending ? 'Memeriksa…' : 'Aktifkan Admin'}</Button></form></main></>;
}
