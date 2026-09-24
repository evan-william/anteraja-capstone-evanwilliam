import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, roleHome } from '@/lib/auth';

import { SignUpForm } from './sign-up-form';
import { AuthCarousel } from '@/components/ui/auth-carousel';

export const metadata = { title: 'Daftar — Anteraja Tracking & Operations' };

export default async function DaftarPage() {
  const user = await getCurrentUser();
  if (user) redirect(roleHome(user.role));
  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative flex items-center justify-center px-5 py-16 sm:px-10">
        <nav aria-label="Navigasi akun" className="absolute right-5 top-5 text-sm font-semibold sm:right-10"><Link href="/lacak" className="rounded-md text-foreground underline decoration-primary/50 underline-offset-4 hover:decoration-primary">Lacak paket</Link></nav>
        <div className="page-enter w-full max-w-md">
          <Link href="/lacak" aria-label="Anteraja — lacak paket" className="mb-10 flex w-fit items-center gap-3 rounded-md"><Image src="/brand/anteraja-mark-small.png" alt="" width={42} height={42} unoptimized className="size-9" priority /><span className="text-2xl font-bold tracking-[-.045em] text-primary">anteraja</span></Link>
          <p className="eyebrow">Akun Anteraja</p>
          <h1 className="page-title">Buat akun</h1>
          <p className="page-copy mb-7">Pilih akses yang sesuai: pantau paket sendiri, kelola kiriman toko, atau tangani operasi Anteraja.</p>
          <SignUpForm />
          <p className="mt-6 text-sm text-muted-foreground">Sudah punya akun? <Link href="/masuk" className="font-semibold text-primary underline-offset-4 hover:underline">Masuk</Link></p>
          <nav aria-label="Akses tanpa akun" className="mt-10 border-t border-border/60 pt-5 text-sm text-muted-foreground">
            Hanya ingin melihat status kiriman? <Link href="/lacak" className="font-semibold text-foreground underline decoration-primary/50 underline-offset-4 hover:decoration-primary">Lacak resi tanpa akun →</Link>
          </nav>
        </div>
      </section>
      <AuthCarousel className="lg:order-last" />
    </main>
  );
}
