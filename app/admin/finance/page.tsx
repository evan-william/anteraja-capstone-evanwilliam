import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';

// Keep old bookmarks valid while Finance remains a Seller-only workspace.
export default async function FormerAdminFinancePage() {
  await requireRole(['admin']);
  redirect('/admin');
}
