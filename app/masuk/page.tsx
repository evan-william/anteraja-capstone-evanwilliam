import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { SignInForm } from './sign-in-form';

export const metadata = { title: 'Masuk — Expense Tracker' };

export default function MasukPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Masuk</CardTitle>
          <CardDescription>Masuk pakai email dan password kamu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInForm />
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <Link href="/daftar" className="font-medium text-primary underline-offset-4 hover:underline">
              Daftar dulu
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
