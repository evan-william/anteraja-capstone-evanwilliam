import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { SignUpForm } from './sign-up-form';

export const metadata = { title: 'Daftar — Expense Tracker' };

export default function DaftarPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daftar</CardTitle>
          <CardDescription>Buat akun baru untuk mulai mencatat transaksi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignUpForm />
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href="/masuk" className="font-medium text-primary underline-offset-4 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
