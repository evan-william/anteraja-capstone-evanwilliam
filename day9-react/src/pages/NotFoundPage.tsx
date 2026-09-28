import { Link } from 'react-router-dom';

export function NotFoundPage({ shipment = false }: { shipment?: boolean }) {
  return <main className="page-shell route-page" id="not-found">
    <section className="not-found"><p className="eyebrow">404 · TIDAK DITEMUKAN</p><h1>{shipment ? 'Resi tidak ditemukan.' : 'Halaman tidak ditemukan.'}</h1><p>{shipment ? 'Nomor resi ini tidak ada dalam data contoh. Periksa penulisannya atau kembali ke daftar kiriman.' : 'Alamat halaman mungkin salah atau sudah berubah. Kembali ke beranda untuk melanjutkan.'}</p><Link className="button-primary link-button" to={shipment ? '/shipments' : '/'}>{shipment ? 'Lihat daftar kiriman' : 'Kembali ke beranda'}</Link></section>
  </main>;
}
