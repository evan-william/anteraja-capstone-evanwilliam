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
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="page-enter w-full max-w-md">
          <div className="mb-10 flex items-center gap-3"><Image src="/brand/anteraja-mark.png" alt="" width={42} height={42} className="size-9 scale-[1.65]" priority /><span className="text-2xl font-bold tracking-[-.045em] text-primary">anteraja</span></div>
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
