import { SiteHeader } from '@/components/ui/site-header';
import { PageHeader } from '@/components/ui/page-header';
import { TransactionManager, type TransactionWithCategory } from '@/components/transaksi/transaction-manager';
import { CategoryManager } from '@/components/kategori/category-manager';
import { ImportManager } from '@/components/import/import-manager';
import type { CategoryRow } from '@/lib/database-types';
import type { ImportCategory, ImportHistory } from '@/lib/import/types';
import { useAuth, useData } from '../api';

function Header() { const { user } = useAuth(); return <SiteHeader userName={user?.name || user?.email || ''} role="seller" />; }
function State({ loading, error }: { loading: boolean; error: string }) { return loading ? <p role="status" className="text-sm text-muted-foreground">Memuat data keuangan…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null; }

export function TransactionsPage() {
  const transactions = useData<TransactionWithCategory[]>('/api/v1/transactions?limit=100');
  const categories = useData<CategoryRow[]>('/api/v1/categories?status=active');
  return <><Header /><main id="main-content" className="app-main max-w-5xl"><PageHeader eyebrow="Keuangan operasional" title="Arus dana" description="Catat settlement masuk dan biaya pengiriman. Data terbaru ditampilkan lebih dahulu." /><State loading={transactions.loading || categories.loading} error={transactions.error || categories.error} />{transactions.data && categories.data && <TransactionManager transactions={transactions.data} categories={categories.data} />}</main></>;
}

export function CategoriesPage() {
  const state = useData<CategoryRow[]>('/api/v1/categories');
  return <><Header /><main id="main-content" className="app-main max-w-5xl"><PageHeader eyebrow="Aturan pencatatan" title="Kelola kategori" description="Pisahkan COD, ongkir, retur, dan biaya layanan agar setiap settlement mudah ditelusuri." /><State {...state} />{state.data && <CategoryManager categories={state.data} />}</main></>;
}

export function ImportsPage() {
  const state = useData<{ categories: ImportCategory[]; history: ImportHistory[] }>('/api/v1/view/import');
  return <><Header /><main id="main-content" className="app-main"><PageHeader eyebrow="Mutasi dan settlement" title="Rekonsiliasi bank" description="Cocokkan mutasi rekening dengan settlement pengiriman. Tidak ada data disimpan sebelum hasilnya ditinjau." /><State {...state} />{state.data && <ImportManager initialCategories={state.data.categories} initialHistory={state.data.history} />}</main></>;
}
