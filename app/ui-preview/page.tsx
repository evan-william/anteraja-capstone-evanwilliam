import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileSpreadsheet,
  History,
  RotateCcw,
  Search,
  Settings2,
  Truck,
  Upload,
  WalletCards,
} from 'lucide-react';
import Image from 'next/image';

type Screen = 'dashboard' | 'upload' | 'preview' | 'history' | 'shipment';

const money = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const settlements = [
  { awb: '100078421945', desc: 'COD Marketplace — batch 1809', amount: 2745000, type: 'Masuk', status: 'Cocok' },
  { awb: '100078415032', desc: 'Biaya kirim reguler', amount: 186500, type: 'Keluar', status: 'Baru' },
  { awb: '100078399812', desc: 'Pengembalian COD — retur', amount: 425000, type: 'Keluar', status: 'Perlu dicek' },
  { awb: '100078377201', desc: 'COD Marketplace — batch 1709', amount: 1380000, type: 'Masuk', status: 'Cocok' },
];

export const metadata = { title: 'UI Preview — Anteraja Finance' };

export default async function UiPreviewPage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const query = await searchParams;
  const screen = (['dashboard', 'upload', 'preview', 'history', 'shipment'].includes(query.screen ?? '') ? query.screen : 'dashboard') as Screen;
  return (
    <>
      <PreviewHeader screen={screen} />
      <main id="main-content" className="mx-auto max-w-[1180px] px-5 py-8 lg:px-8">
        {screen === 'dashboard' ? <Dashboard /> : null}
        {screen === 'upload' ? <UploadScreen /> : null}
        {screen === 'preview' ? <PreviewScreen /> : null}
        {screen === 'history' ? <HistoryScreen /> : null}
        {screen === 'shipment' ? <ShipmentScreen /> : null}
      </main>
    </>
  );
}

function PreviewHeader({ screen }: { screen: Screen }) {
  const items: { id: Screen; label: string }[] = [
    { id: 'dashboard', label: 'Ringkasan' },
    { id: 'preview', label: 'Arus dana' },
    { id: 'upload', label: 'Rekonsiliasi' },
    { id: 'history', label: 'Riwayat' },
  ];
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-[1180px] items-center justify-between gap-5 px-5 lg:px-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5"><Image src="/brand/anteraja-mark.png" alt="" width={40} height={40} className="size-9 scale-[1.65] object-contain" /><span className="leading-none"><span className="block text-[20px] font-bold tracking-[-.045em] text-primary">anteraja</span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[.15em] text-muted-foreground">Finance operations</span></span></div>
          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => <a key={item.id} href={`?screen=${item.id}`} aria-current={screen === item.id ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm font-semibold ${screen === item.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>{item.label}</a>)}
          </nav>
        </div>
        <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><strong className="block text-xs">Evan William</strong><span className="text-[11px] text-[#827674]">Finance Operations</span></span><span className="grid size-9 place-items-center rounded-full bg-[#2f2928] text-xs font-bold text-white">EW</span></div>
      </div>
    </header>
  );
}

function PageIntro({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return <header className="page-enter mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">{eyebrow}</p><h1 className="page-title">{title}</h1><p className="page-copy">{copy}</p></div>{action}</header>;
}

function PrimaryButton({ children }: { children: React.ReactNode }) { return <button className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(233,0,127,.18)] transition-transform duration-150 active:scale-[.97]">{children}</button>; }
function SecondaryButton({ children }: { children: React.ReactNode }) { return <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d9cecb] bg-white px-4 text-sm font-semibold text-[#352d2c]">{children}</button>; }

function Dashboard() {
  return <>
    <PageIntro eyebrow="Operasional hari ini" title="Settlement lebih mudah ditelusuri" copy="Pantau dana masuk, biaya pengiriman, dan mutasi yang belum cocok tanpa berpindah spreadsheet." action={<PrimaryButton><Upload className="size-4" /> Rekonsiliasi mutasi</PrimaryButton>} />
    <section className="grid gap-4 md:grid-cols-3">
      <Metric icon={<WalletCards />} label="Settlement diterima" value="Rp18.420.000" note="+12,4% dari pekan lalu" positive />
      <Metric icon={<Truck />} label="Biaya pengiriman" value="Rp3.285.500" note="148 pengiriman selesai" />
      <Metric icon={<CircleAlert />} label="Perlu diperiksa" value="7 mutasi" note="Rp1.260.000 belum cocok" warning />
    </section>
    <section className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_.85fr]">
      <div className="panel overflow-hidden"><div className="flex items-center justify-between border-b p-5"><div><h2 className="font-semibold">Aktivitas settlement</h2><p className="mt-1 text-xs text-[#7b6f6d]">Mutasi terbaru beserta referensi pengiriman</p></div><SecondaryButton><Search className="size-4" /> Cari</SecondaryButton></div><SettlementTable /></div>
      <div className="panel p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Status rekonsiliasi</h2><span className="text-xs text-[#8b7d7b]">September 2026</span></div><div className="my-7 grid place-items-center"><div className="grid size-40 place-items-center rounded-full border-[18px] border-[#f3d7db] border-r-[#d92d3f] border-t-[#d92d3f]"><div className="text-center"><strong className="block text-3xl">82%</strong><span className="text-xs text-[#7a6e6c]">sudah cocok</span></div></div></div><div className="space-y-3"><StatusLine color="bg-[#d92d3f]" label="Cocok" value="126" /><StatusLine color="bg-[#f0a13a]" label="Baru" value="21" /><StatusLine color="bg-[#a9a09e]" label="Error" value="7" /></div></div>
    </section>
  </>;
}

function Metric({ icon, label, value, note, positive, warning }: { icon: React.ReactNode; label: string; value: string; note: string; positive?: boolean; warning?: boolean }) {
  return <article className="panel p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-[#746866]">{label}</p><p className="mt-3 text-2xl font-semibold tabular">{value}</p></div><span className={`grid size-10 place-items-center rounded-lg ${warning ? 'bg-[#fff1db] text-[#b46a0a]' : 'bg-[#fae9eb] text-[#bf2638]'}`}>{icon}</span></div><p className={`mt-4 flex items-center gap-1 text-xs ${positive ? 'text-[#24835a]' : 'text-[#817573]'}`}>{positive ? <ArrowUpRight className="size-3.5" /> : null}{note}</p></article>;
}

function StatusLine({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2"><i className={`size-2.5 rounded-full ${color}`} />{label}</span><strong>{value}</strong></div>; }

function SettlementTable() {
  return <section aria-label="Aktivitas settlement" className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">Aktivitas settlement dan referensi pengiriman</caption><thead className="bg-[#faf8f7] text-[11px] uppercase tracking-wider text-[#7e7270]"><tr><th scope="col" className="px-5 py-3">Referensi</th><th scope="col" className="px-4 py-3">Keterangan</th><th scope="col" className="px-4 py-3">Nominal</th><th scope="col" className="px-4 py-3">Status</th></tr></thead><tbody>{settlements.map((row) => <tr key={row.awb} className="border-t border-[#eee7e5]"><td className="px-5 py-4"><span className="font-medium">{row.awb}</span><span className="mt-1 block text-xs text-[#8a7d7b]">Resi pengiriman</span></td><td className="px-4 py-4">{row.desc}</td><td className="px-4 py-4 font-semibold tabular">{row.type === 'Keluar' ? '−' : '+'}{money.format(row.amount)}</td><td className="px-4 py-4"><StatusBadge status={row.status} /></td></tr>)}</tbody></table></section>;
}

function StatusBadge({ status }: { status: string }) { const cls = status === 'Cocok' ? 'status-success' : status === 'Baru' ? 'status-warning' : 'status-danger'; return <span className={`status ${cls}`}>{status}</span>; }

function UploadScreen() {
  return <>
    <PageIntro eyebrow="Rekonsiliasi / langkah 1 dari 3" title="Unggah mutasi settlement" copy="Sistem mengenali format Bank A atau Bank B dari isi file. Data belum disimpan pada tahap ini." />
    <section aria-label="Unggah mutasi" className="mx-auto max-w-3xl panel p-6 sm:p-8"><div className="mb-7 flex items-center gap-2"><Step active number="1" label="Unggah" /><Line /><Step number="2" label="Tinjau" /><Line /><Step number="3" label="Simpan" /></div><section className="rounded-xl border-2 border-dashed border-[#d8c9c6] bg-[#fcfaf9] px-6 py-14 text-center"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#fae8ea] text-[#c5293b]"><FileSpreadsheet className="size-6" /></span><h2 className="mt-4 text-lg font-semibold">Pilih file mutasi CSV</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#786b69]">Maksimal 10 MB atau 50.000 baris. Gunakan file asli dari rekening settlement agar deteksi format akurat.</p><div className="mt-5"><PrimaryButton><Upload className="size-4" /> Pilih file CSV</PrimaryButton></div></section><section aria-label="Ketentuan file" className="mt-5 grid gap-3 sm:grid-cols-2"><Info label="Format didukung" value="CSV Bank A dan Bank B" /><Info label="Privasi" value="Preview diproses sebelum penyimpanan" /></section></section>
  </>;
}

function Step({ active, number, label }: { active?: boolean; number: string; label: string }) { return <div className="flex items-center gap-2"><span className={`grid size-7 place-items-center rounded-full text-xs font-bold ${active ? 'bg-[#d92d3f] text-white' : 'bg-[#eee8e6] text-[#786d6b]'}`}>{number}</span><span className={`hidden text-xs font-semibold sm:block ${active ? 'text-[#b62032]' : 'text-[#7a6e6c]'}`}>{label}</span></div>; }
function Line() { return <span className="h-px flex-1 bg-[#e4dcd9]" />; }
function Info({ label, value }: { label: string; value: string }) { return <article className="rounded-lg bg-[#f7f3f2] p-4"><h2 className="text-xs font-normal text-[#857875]">{label}</h2><p className="mt-1 text-sm font-semibold">{value}</p></article>; }

function PreviewScreen() {
  return <>
    <PageIntro eyebrow="Rekonsiliasi / langkah 2 dari 3" title="Periksa kecocokan settlement" copy="Tinjau 154 baris dari mutasi-bank-a-september.csv. Baris error tidak ikut disimpan." action={<SecondaryButton><Settings2 className="size-4" /> Filter status</SecondaryButton>} />
    <section aria-label="Ringkasan pencocokan" className="grid gap-3 sm:grid-cols-3"><Summary label="Baru" value="21" sub="perlu kategori" tone="amber" /><Summary label="Cocok" value="126" sub="transaksi lama aman" tone="green" /><Summary label="Error" value="7" sub="diabaikan saat simpan" tone="red" /></section>
    <section aria-label="Pratinjau rekonsiliasi" className="panel mt-5 overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm"><caption className="sr-only">Pratinjau kecocokan settlement</caption><thead className="bg-[#f6f2f1] text-[11px] uppercase tracking-wider text-[#756967]"><tr><th scope="col" className="px-4 py-3">Tanggal</th><th scope="col" className="px-4 py-3">Keterangan bank</th><th scope="col" className="px-4 py-3">Referensi pengiriman</th><th scope="col" className="px-4 py-3">Nominal</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Kategori</th></tr></thead><tbody>{settlements.map((row, i) => <tr key={row.awb} className="border-t border-[#eee7e5]"><td className="px-4 py-4">{18 - i} Sep 2026</td><td className="px-4 py-4"><strong className="font-medium">{row.desc}</strong><span className="mt-1 block text-xs text-[#887b79]">{i % 2 ? 'BANKA-SETTLE-09' : 'TRANSFER ANTERAJA'}</span></td><td className="px-4 py-4 font-medium">{row.awb}</td><td className="px-4 py-4 font-semibold tabular">{money.format(row.amount)}</td><td className="px-4 py-4"><StatusBadge status={row.status} /></td><td className="px-4 py-4"><span className="inline-flex min-w-32 items-center justify-between rounded-lg border bg-white px-3 py-2 text-xs">{i === 0 ? 'Pendapatan COD' : i === 1 ? 'Ongkir' : i === 2 ? 'Retur' : 'Pencairan'}<ChevronRight className="size-3" /></span></td></tr>)}</tbody></table></div><footer className="flex flex-col items-start justify-between gap-3 border-t bg-[#fffdfc] p-4 sm:flex-row sm:items-center"><p className="text-xs text-[#746866]"><strong className="text-[#2e2726]">21 baris baru</strong> wajib memiliki kategori sebelum disimpan.</p><PrimaryButton><Check className="size-4" /> Simpan hasil rekonsiliasi</PrimaryButton></footer></section>
  </>;
}

function Summary({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) { const map: Record<string,string> = { amber: 'bg-[#fff2de] text-[#9b6517]', green: 'bg-[#e8f6ef] text-[#287050]', red: 'bg-[#fbe8ea] text-[#a92233]' }; return <article className="panel flex items-center gap-4 p-4"><span className={`grid size-10 place-items-center rounded-lg font-bold ${map[tone]}`}>{value}</span><div><h2 className="text-sm font-semibold">{label}</h2><p className="text-xs text-[#817472]">{sub}</p></div></article>; }

function HistoryScreen() {
  const history = [
    ['mutasi-bank-a-september.csv', '18 Sep 2026, 14.32', '126 cocok · 21 baru · 7 error', 'Selesai'],
    ['settlement-cod-1709.csv', '17 Sep 2026, 09.16', '84 cocok · 5 baru · 0 error', 'Selesai'],
    ['mutasi-bank-b-1609.csv', '16 Sep 2026, 17.45', '59 cocok · 12 baru · 2 error', 'Dibatalkan'],
  ];
  return <><PageIntro eyebrow="Audit dan pemulihan" title="Riwayat rekonsiliasi" copy="Lihat hasil setiap impor dan batalkan transaksi yang dibuat oleh impor tanpa menghapus transaksi lama yang hanya dicocokkan." action={<PrimaryButton><Upload className="size-4" /> Rekonsiliasi baru</PrimaryButton>} /><section aria-labelledby="history-month" className="panel overflow-hidden"><header className="border-b p-5"><h2 id="history-month" className="font-semibold">September 2026</h2><p className="mt-1 text-xs text-[#7d706e]">3 proses rekonsiliasi</p></header>{history.map((row, i) => <article key={row[0]} className="flex flex-col gap-4 border-b border-[#eee7e5] p-5 last:border-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className={`grid size-10 shrink-0 place-items-center rounded-lg ${i === 2 ? 'bg-[#eeeae9] text-[#6e6361]' : 'bg-[#e9f6ef] text-[#2f7d5b]'}`}>{i === 2 ? <RotateCcw className="size-5" /> : <CheckCircle2 className="size-5" />}</span><div><h3 className="font-semibold">{row[0]}</h3><p className="mt-1 text-xs text-[#7d706e]">{row[1]} · {row[2]}</p></div></div><footer className="flex items-center gap-3"><StatusBadge status={row[3] === 'Selesai' ? 'Cocok' : 'Perlu dicek'} /><button className="text-sm font-semibold text-[#b72032]">{i === 2 ? 'Lihat detail' : 'Batalkan impor'}</button></footer></article>)}</section><aside className="mt-4 rounded-lg border border-[#edc7cc] bg-[#fff5f6] p-4 text-sm text-[#76202c]"><strong>Pembatalan aman:</strong> hanya transaksi baru yang dibuat dalam proses impor dipindahkan ke status terhapus. Baris yang sebelumnya cocok tidak berubah.</aside></>;
}

function ShipmentScreen() {
  return <><PageIntro eyebrow="Jejak settlement" title="Rincian pengiriman 100078421945" copy="Satu tampilan untuk menelusuri hubungan antara resi, nilai COD, potongan biaya, dan mutasi rekening." action={<SecondaryButton><History className="size-4" /> Lihat riwayat</SecondaryButton>} /><section aria-label="Rincian settlement pengiriman" className="grid gap-5 lg:grid-cols-[1fr_.72fr]"><article className="panel p-6"><header className="flex items-center justify-between border-b pb-5"><div><p className="text-xs text-[#7c6f6d]">Status pengiriman</p><p className="mt-1 flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-[#2e825d]" /> Diterima penerima</p></div><span className="status status-success">Settlement cocok</span></header><dl className="grid gap-5 py-6 sm:grid-cols-2"><Detail label="Nomor resi" value="100078421945" /><Detail label="Tanggal diterima" value="17 Sep 2026, 16.42" /><Detail label="Nilai COD" value="Rp2.800.000" /><Detail label="Biaya layanan" value="Rp55.000" /></dl><section aria-label="Settlement bersih" className="rounded-xl bg-[#f6f2f1] p-5"><div className="flex items-center justify-between"><span className="text-sm text-[#6f6361]">Settlement bersih</span><strong className="text-xl tabular">Rp2.745.000</strong></div><div className="mt-3 flex items-center justify-between border-t border-[#e2d9d7] pt-3 text-xs"><span className="text-[#7b6e6c]">Mutasi 18 Sep 2026 · BANKA-SETTLE-09</span><span className="font-semibold text-[#287050]">Cocok otomatis</span></div></section></article><section className="panel p-6"><h2 className="font-semibold">Alur dana</h2><div className="mt-6 space-y-0"><Timeline icon={<Truck />} title="Paket diterima" meta="17 Sep · 16.42" done /><Timeline icon={<Banknote />} title="Settlement diproses" meta="18 Sep · 08.10" done /><Timeline icon={<ArrowDownRight />} title="Dana masuk rekening" meta="18 Sep · 14.31" done /><Timeline icon={<Check />} title="Mutasi direkonsiliasi" meta="18 Sep · 14.32" done last /></div></section></section></>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-[#817472]">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
function Timeline({ icon, title, meta, last }: { icon: React.ReactNode; title: string; meta: string; done?: boolean; last?: boolean }) { return <div className="flex gap-3"><div className="flex flex-col items-center"><span className="grid size-8 place-items-center rounded-full bg-[#fae8ea] text-[#bd2638]">{icon}</span>{!last ? <span className="h-10 w-px bg-[#dfd5d2]" /> : null}</div><div className="pt-1"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#817472]">{meta}</p></div></div>; }
