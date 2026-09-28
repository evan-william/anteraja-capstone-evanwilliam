import { Link, NavLink } from 'react-router-dom';

export function TrackingHeader() {
  return <header className="site-header">
    <div className="header-inner">
      <Link className="brand" to="/" aria-label="Anteraja, ke beranda" />
      <nav aria-label="Navigasi utama"><NavLink to="/" end>Beranda</NavLink><NavLink to="/shipments">Daftar kiriman</NavLink><NavLink to="/ongkir">Cek ongkir</NavLink></nav>
    </div>
  </header>;
}
