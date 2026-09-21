'use client';

import { useMemo, useState } from 'react';
import { Check, FileSpreadsheet, RotateCcw, Upload } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ApiResponse } from '@/lib/api';
import { parseBankStatementFile } from '@/lib/import/parser';
import type {
  BankFormat,
  ImportCategory,
  ImportHistory,
  PreviewImportRow,
} from '@/lib/import/types';

const PAGE_SIZE = 100;
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

type PreviewResponse = { rows: PreviewImportRow[]; categories: ImportCategory[] };

export function ImportManager({
  initialCategories,
  initialHistory,
}: {
  initialCategories: ImportCategory[];
  initialHistory: ImportHistory[];
}) {
  const [fileName, setFileName] = useState('');
  const [bank, setBank] = useState<BankFormat | null>(null);
  const [rows, setRows] = useState<PreviewImportRow[]>([]);
  const [categories, setCategories] = useState(initialCategories);
  const [history, setHistory] = useState(initialHistory);
  const [ruleRows, setRuleRows] = useState<Record<number, boolean>>({});
  const [ruleKeywords, setRuleKeywords] = useState<Record<number, string>>({});
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      new: rows.filter((row) => row.status === 'new').length,
      matched: rows.filter((row) => row.status === 'matched').length,
      error: rows.filter((row) => row.status === 'error').length,
    }),
    [rows],
  );
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
    return (await response.json()) as ApiResponse<T>;
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    setRows([]);
    try {
      const parsed = await parseBankStatementFile(file);
      const response = await fetch('/api/v1/imports/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed.rows }),
      });
      const body = await readResponse<PreviewResponse>(response);
      if (!body.success) throw new Error(body.error.message);
      setFileName(file.name);
      setBank(parsed.bank);
      setRows(body.data.rows);
      setCategories(body.data.categories);
      setPage(1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal membaca file CSV.');
    } finally {
      setBusy(false);
    }
  }

  function chooseCategory(rowNumber: number, categoryId: string) {
    setRows((current) =>
      current.map((row) =>
        row.row_number === rowNumber ? { ...row, category_id: categoryId || null } : row,
      ),
    );
  }

  async function refreshHistory() {
    const response = await fetch('/api/v1/imports');
    const body = await readResponse<ImportHistory[]>(response);
    if (body.success) setHistory(body.data);
  }

  async function saveImport() {
    if (!bank || !fileName || rows.length === 0) return;
    const incomplete = rows.find((row) => row.status === 'new' && !row.category_id);
    if (incomplete) {
      setError(`Pilih kategori untuk baris ${incomplete.row_number}.`);
      setPage(Math.ceil(rows.indexOf(incomplete) / PAGE_SIZE) + 1);
      return;
    }

    const rules = rows
      .filter((row) => row.status === 'new' && ruleRows[row.row_number])
      .map((row) => ({
        keyword: (ruleKeywords[row.row_number] ?? row.description ?? '').trim(),
        category_id: row.category_id,
        type: row.type,
      }));

    setBusy(true);
    setError(null);
    setMessage(null);
    const response = await fetch('/api/v1/imports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_name: fileName, bank, rows, rules }),
    });
    const body = await readResponse<{ id: string }>(response);
    setBusy(false);
    if (!body.success) {
      setError(body.error.message);
      return;
    }
    setRows([]);
    setFileName('');
    setBank(null);
    setRuleRows({});
    setRuleKeywords({});
    setMessage('Impor berhasil. Transaksi baru sudah ditambahkan.');
    await refreshHistory();
  }

  async function cancelImport(id: string) {
    if (!window.confirm('Batalkan impor ini? Hanya transaksi yang dibuat oleh impor akan dihapus.')) return;
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/v1/imports/${id}/cancel`, { method: 'POST' });
    const body = await readResponse<{ cancelled_transactions: number; already_cancelled: boolean }>(
      response,
    );
    setBusy(false);
    if (!body.success) {
      setError(body.error.message);
      return;
    }
    setMessage(
      body.data.already_cancelled
        ? 'Impor itu sebelumnya sudah dibatalkan.'
        : `${body.data.cancelled_transactions} transaksi hasil impor dibatalkan.`,
    );
    await refreshHistory();
  }

  return (
    <div className="page-enter reveal-1 space-y-5">
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {message ? <Alert>{message}</Alert> : null}

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">1</span>
            <div><CardTitle>Unggah mutasi bank</CardTitle><p className="mt-1 text-xs text-muted-foreground">Langkah 1 dari 3</p></div>
          </div>
          <CardDescription>
            Pilih CSV Bank A atau Bank B. Format dikenali dari isi file, bukan nama file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input bg-[#fbfaf9] px-6 py-10 text-center transition-colors hover:border-primary/60 hover:bg-accent/25">
            <span className="grid size-11 place-items-center text-primary"><FileSpreadsheet className="size-7" /></span>
            <span className="mt-3 text-sm font-semibold">Pilih file mutasi CSV</span>
            <span className="mt-1 text-xs leading-5 text-muted-foreground">Maksimum 10 MB atau 50.000 baris</span>
            <Input className="sr-only" aria-label="File mutasi bank" type="file" accept=".csv,text/csv" disabled={busy} onChange={(event) => void handleFile(event.target.files?.[0])} />
          </label>
          {busy ? <p className="mt-3 text-sm text-muted-foreground" role="status">Membaca dan memeriksa baris mutasi…</p> : null}
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-white">2</span>
              <div><CardTitle>Tinjau hasil pencocokan</CardTitle><p className="mt-1 text-xs text-muted-foreground">Langkah 2 dari 3</p></div>
            </div>
            <CardDescription>
              {fileName} · {bank === 'bank_a' ? 'Bank A' : 'Bank B'} · {rows.length} baris
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid divide-y rounded-lg border text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4"><strong className="block text-xl tabular">{counts.new}</strong><span className="status status-warning mt-1">Baru</span></div>
              <div className="p-4"><strong className="block text-xl tabular">{counts.matched}</strong><span className="status status-success mt-1">Cocok</span></div>
              <div className="p-4"><strong className="block text-xl tabular">{counts.error}</strong><span className="status status-danger mt-1">Error</span></div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <table className="data-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Baris</th><th>Tanggal</th><th>Keterangan</th><th>Nominal</th><th>Status</th><th>Kategori dan aturan</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.fingerprint}>
                      <td className="tabular">{row.row_number}</td>
                      <td className="whitespace-nowrap">{row.transaction_date ?? '—'}</td>
                      <td className="max-w-64 break-words font-medium">{row.description || '(tanpa keterangan)'}</td>
                      <td className="whitespace-nowrap font-semibold tabular">{row.amount ? rupiah.format(row.amount) : '—'}</td>
                      <td>
                        <span className={`status ${row.status === 'new' ? 'status-warning' : row.status === 'matched' ? 'status-success' : 'status-danger'}`}>{row.status === 'new' ? 'Baru' : row.status === 'matched' ? 'Cocok' : 'Error'}</span>
                        {row.error_message ? <p className="mt-1 text-xs text-destructive">{row.error_message}</p> : null}
                      </td>
                      <td>
                        {row.status === 'new' && row.type ? (
                          <div className="space-y-2">
                            <select
                              aria-label={`Kategori baris ${row.row_number}`}
                              className="h-9 w-full rounded-lg border border-input bg-white px-2 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
                              value={row.category_id ?? ''}
                              onChange={(event) => chooseCategory(row.row_number, event.target.value)}
                            >
                              <option value="">Pilih kategori</option>
                              {categories.filter((category) => category.type === row.type).map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                              ))}
                            </select>
                            {row.suggested_by_rule ? <p className="text-xs text-muted-foreground">Saran aturan: “{row.suggested_by_rule}”</p> : null}
                            <label className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={Boolean(ruleRows[row.row_number])}
                                onChange={(event) => setRuleRows((current) => ({ ...current, [row.row_number]: event.target.checked }))}
                              />
                              Pakai kategori ini untuk kata kunci serupa
                            </label>
                            {ruleRows[row.row_number] ? (
                              <Input
                                aria-label={`Kata kunci baris ${row.row_number}`}
                                value={ruleKeywords[row.row_number] ?? row.description ?? ''}
                                onChange={(event) => setRuleKeywords((current) => ({ ...current, [row.row_number]: event.target.value }))}
                                placeholder="Minimal 2 karakter"
                              />
                            ) : null}
                          </div>
                        ) : row.status === 'matched' ? 'Sudah ada di transaksi' : 'Tidak ikut disimpan'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button>
                <span className="text-sm">Halaman {page} dari {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button>
              </div>
              <Button type="button" disabled={busy} onClick={() => void saveImport()}><Check />{busy ? 'Menyimpan…' : 'Simpan rekonsiliasi'}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between gap-4"><div><CardTitle>Riwayat rekonsiliasi</CardTitle><CardDescription className="mt-1">Setiap proses tetap tercatat untuk pemeriksaan.</CardDescription></div><Upload className="size-5 text-muted-foreground" /></div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada rekonsiliasi. Unggah mutasi pertama untuk mulai.</p> : (
            <div className="divide-y">
              {history.map((item) => (
                <div key={item.id} className="flex flex-col justify-between gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium">{item.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('id-ID')} · {item.new_count} baru · {item.matched_count} cocok · {item.error_count} error
                    </p>
                  </div>
                  {item.status === 'completed' ? (
                    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void cancelImport(item.id)}><RotateCcw />Batalkan impor</Button>
                  ) : <span className="status text-muted-foreground">Dibatalkan</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
