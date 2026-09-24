import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthCarousel } from '@/components/ui/auth-carousel';
import { getCurrentUser, roleHome } from '@/lib/auth';

import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Masuk — Anteraja Tracking & Operations' };

export default async function MasukPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));
  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <AuthCarousel />
      <section className="relative flex items-center justify-center px-5 py-16 sm:px-10">
        <nav aria-label="Navigasi akun" className="absolute right-5 top-5 text-sm font-semibold sm:right-10"><Link href="/lacak" className="rounded-md text-foreground underline decoration-primary/50 underline-offset-4 hover:decoration-primary">Lacak paket</Link></nav>
        <div className="page-enter w-full max-w-md">
          <Link href="/lacak" aria-label="Anteraja — lacak paket" className="mb-8 flex w-fit items-center gap-3 rounded-md lg:hidden"><Image src="/brand/anteraja-mark-small.png" alt="" width={42} height={42} unoptimized className="size-9" priority /><span className="text-2xl font-bold tracking-[-.045em] text-primary">anteraja</span></Link>
          <p className="eyebrow">Akses ruang kerja</p>
          <h1 className="page-title">Masuk</h1>
          <p className="page-copy mb-7">Gunakan akun operasional yang sudah terdaftar.</p>
          <SignInForm />
          <p className="mt-6 text-sm text-muted-foreground">Belum punya akun? <Link href="/daftar" className="font-semibold text-primary underline-offset-4 hover:underline">Buat akun</Link></p>
          <nav aria-label="Akses tanpa akun" className="mt-12 border-t border-border/60 pt-5 text-sm text-muted-foreground">
            Ingin melihat perjalanan paket? <Link href="/lacak" className="font-semibold text-foreground underline decoration-primary/50 underline-offset-4 hover:decoration-primary">Lacak resi tanpa masuk →</Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
