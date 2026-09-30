import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth, type Role } from './api';
import { SiteHeader } from '@/components/ui/site-header';

const LoginPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.RegisterPage })));
const ActivatePage = lazy(() => import('./pages/AuthPages').then((m) => ({ default: m.ActivatePage })));
const TrackingLanding = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.TrackingLanding })));
const TrackingDetail = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.TrackingDetail })));
const ConsumerPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.ConsumerPage })));
const SellerPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.SellerPage })));
const SellerShipmentsPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.SellerShipmentsPage })));
const SellerShipmentPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.SellerShipmentPage })));
const AdminPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.AdminPage })));
const AdminShipmentsPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.AdminShipmentsPage })));
const AdminShipmentPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.AdminShipmentPage })));
const AdminTicketsPage = lazy(() => import('./pages/RolePages').then((m) => ({ default: m.AdminTicketsPage })));
const TransactionsPage = lazy(() => import('./pages/FinancePages').then((m) => ({ default: m.TransactionsPage })));
const CategoriesPage = lazy(() => import('./pages/FinancePages').then((m) => ({ default: m.CategoriesPage })));
const ImportsPage = lazy(() => import('./pages/FinancePages').then((m) => ({ default: m.ImportsPage })));
const UiPreviewPage = lazy(() => import('./pages/UiPreviewPage'));
const OperationsAssistant = lazy(() => import('@/components/admin/operations-assistant').then((m) => ({ default: m.OperationsAssistant })));

function home(role: Role) { return role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/akun'; }

function Private({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="app-main" aria-live="polite">Memuat ruang kerja…</main>;
  if (!user) return <Navigate to="/masuk" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/akses-ditolak" replace />;
  return <>{children}</>;
}

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <main className="app-main">Memuat…</main>;
  return <Navigate to={user ? home(user.role) : '/lacak'} replace />;
}

function Denied() {
  const { user } = useAuth();
  return <><SiteHeader userName={user?.name || user?.email || ''} role={user?.role || 'consumer'} /><main className="app-main"><h1 className="page-title">Akses terbatas</h1><p className="page-copy">Halaman ini tidak tersedia untuk peran akunmu.</p><Link to={user ? home(user.role) : '/masuk'} className="mt-5 inline-block font-semibold text-primary">Kembali ke ruang kerja</Link></main></>;
}

function NotFound() { return <main className="app-main"><h1 className="page-title">Halaman tidak ditemukan</h1><a href="/lacak" className="text-primary underline">Kembali ke lacak paket</a></main>; }

function LegacyAdminFinance() { return <Navigate to="/admin" replace />; }
function AdminShell() { return <Private roles={['admin']}><Outlet /><OperationsAssistant /></Private>; }

export function App() {
  return <AuthProvider><Suspense fallback={<main className="app-main" role="status">Memuat halaman…</main>}><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/lacak" element={<TrackingLanding />} />
    <Route path="/lacak/:awb" element={<TrackingDetail />} />
    <Route path="/masuk" element={<LoginPage />} />
    <Route path="/daftar" element={<RegisterPage />} />
    <Route path="/aktivasi-admin" element={<Private roles={['consumer', 'seller', 'admin']}><ActivatePage /></Private>} />
    <Route path="/akses-ditolak" element={<Denied />} />
    <Route path="/akun" element={<Private roles={['consumer']}><ConsumerPage /></Private>} />
    <Route path="/seller" element={<Private roles={['seller']}><SellerPage /></Private>} />
    <Route path="/pengiriman" element={<Private roles={['seller']}><SellerShipmentsPage /></Private>} />
    <Route path="/pengiriman/:awb" element={<Private roles={['seller']}><SellerShipmentPage /></Private>} />
    <Route path="/transaksi" element={<Private roles={['seller']}><TransactionsPage /></Private>} />
    <Route path="/kategori" element={<Private roles={['seller']}><CategoriesPage /></Private>} />
    <Route path="/import" element={<Private roles={['seller']}><ImportsPage /></Private>} />
    <Route element={<AdminShell />}>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/kiriman" element={<AdminShipmentsPage />} />
      <Route path="/admin/pengiriman/:awb" element={<AdminShipmentPage />} />
      <Route path="/admin/tiket" element={<AdminTicketsPage />} />
      <Route path="/admin/finance" element={<LegacyAdminFinance />} />
    </Route>
    <Route path="/ui-preview" element={<UiPreviewPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense></AuthProvider>;
}
