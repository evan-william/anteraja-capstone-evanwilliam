import { redirect } from 'next/navigation';

import { getCurrentUser, roleHome } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? roleHome(user.role) : '/lacak');
}
