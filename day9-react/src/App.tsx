import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ShipmentDetailPage } from './pages/ShipmentDetailPage';
import { ShipmentListPage } from './pages/ShipmentListPage';
import { ShippingPage } from './pages/ShippingPage';

export function App() {
  return <Routes>
    <Route element={<MainLayout />}>
      <Route index element={<HomePage />} />
      <Route path="shipments" element={<ShipmentListPage />} />
      <Route path="shipments/:id" element={<ShipmentDetailPage />} />
      <Route path="ongkir" element={<ShippingPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>;
}
