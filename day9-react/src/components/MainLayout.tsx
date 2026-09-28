import { Outlet } from 'react-router-dom';
import { TrackingHeader } from './TrackingHeader';

export function MainLayout() {
  return <>
    <TrackingHeader />
    <Outlet />
    <footer className="site-footer"><div className="footer-inner"><span>Anteraja · Latihan React</span><span>Data kiriman dan tarif pada latihan ini adalah contoh.</span></div></footer>
  </>;
}
