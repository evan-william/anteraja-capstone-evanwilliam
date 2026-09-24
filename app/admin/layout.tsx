import type { ReactNode } from 'react';

import { OperationsAssistant } from '@/components/admin/operations-assistant';
import { requireRole } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(['admin']);

  return <>{children}<OperationsAssistant /></>;
}
