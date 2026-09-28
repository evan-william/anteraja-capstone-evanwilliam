import type { ShipmentStatus } from '../data/shipments';

export type StatusFilter = 'all' | ShipmentStatus;

type Props = {
  draft: string;
  status: StatusFilter;
  onDraftChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSearch: () => void;
  onReset: () => void;
};

export function ShipmentForm({ draft, status, onDraftChange, onStatusChange, onSearch, onReset }: Props) {
  return <form id="cari" className="search-panel" onSubmit={(event) => { event.preventDefault(); onSearch(); }}>
    <div className="field"><label htmlFor="resi">Nomor resi atau kota</label><input id="resi" name="resi" value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Contoh: ANT-100015" autoComplete="off" /></div>
    <div className="field"><label htmlFor="status">Status pengiriman</label><select id="status" value={status} onChange={(event) => onStatusChange(event.target.value as StatusFilter)}><option value="all">Semua status</option><option value="in_transit">Dalam perjalanan</option><option value="delivered">Terkirim</option><option value="action_required">Perlu tindakan</option></select></div>
    <button className="button-primary" type="submit">Cari kiriman</button>
    <button className="button-text" type="button" onClick={onReset}>Reset</button>
  </form>;
}
