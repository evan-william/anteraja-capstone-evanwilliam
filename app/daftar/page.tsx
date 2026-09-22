import Image from 'next/image';
import Link from 'next/link';

import { SignUpForm } from './sign-up-form';
import { AuthCarousel } from '@/components/ui/auth-carousel';

export const metadata = { title: 'Daftar — Anteraja Finance' };

export default function DaftarPage() {
  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-[.9fr_1.1fr]">
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="page-enter w-full max-w-md">
          <div className="mb-10 flex items-center gap-3"><Image src="/brand/anteraja-mark.png" alt="" width={42} height={42} className="size-9 scale-[1.65]" priority /><span className="text-2xl font-bold tracking-[-.045em] text-primary">anteraja</span></div>
          <p className="eyebrow">Akun operasional</p>
          <h1 className="page-title">Buat akun</h1>
          <p className="page-copy mb-7">Siapkan ruang kerja untuk pencatatan dan rekonsiliasi settlement.</p>
          <SignUpForm />
          <p className="mt-6 text-sm text-muted-foreground">Sudah punya akun? <Link href="/masuk" className="font-semibold text-primary underline-offset-4 hover:underline">Masuk</Link></p>
        </div>
      </section>
      <AuthCarousel className="lg:order-last" />
    </main>
  );
}
