'use client';

import { useMemo, useState } from 'react';

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
    <div className="space-y-6">
      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {message ? <Alert>{message}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>1. Pilih file mutasi</CardTitle>
          <CardDescription>
            CSV Bank A atau Bank B, maksimal 10 MB dan 50.000 baris. Format dikenali dari isi file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            aria-label="File mutasi bank"
            type="file"
            accept=".csv,text/csv"
            disabled={busy}
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          {busy ? <p className="text-sm text-muted-foreground">Memproses file…</p> : null}
        </CardContent>
      </Card>

      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Periksa dan kategorikan</CardTitle>
            <CardDescription>
              {fileName} · {bank === 'bank_a' ? 'Bank A' : 'Bank B'} · {rows.length} baris
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-3">
              <div className="rounded-md border p-3"><strong>{counts.new}</strong> Baru</div>
              <div className="rounded-md border p-3"><strong>{counts.matched}</strong> Cocok</div>
              <div className="rounded-md border p-3"><strong>{counts.error}</strong> Error</div>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3">Baris</th><th className="p-3">Tanggal</th>
                    <th className="p-3">Keterangan</th><th className="p-3">Nominal</th>
                    <th className="p-3">Status</th><th className="p-3">Kategori / aturan</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr key={row.fingerprint} className="border-t align-top">
                      <td className="p-3">{row.row_number}</td>
                      <td className="p-3 whitespace-nowrap">{row.transaction_date ?? '—'}</td>
                      <td className="max-w-64 p-3 break-words">{row.description || '(kosong)'}</td>
                      <td className="p-3 whitespace-nowrap">{row.amount ? rupiah.format(row.amount) : '—'}</td>
                      <td className="p-3">
                        <span className="font-medium">{row.status === 'new' ? 'Baru' : row.status === 'matched' ? 'Cocok' : 'Error'}</span>
                        {row.error_message ? <p className="mt-1 text-xs text-destructive">{row.error_message}</p> : null}
                      </td>
                      <td className="p-3">
                        {row.status === 'new' && row.type ? (
                          <div className="space-y-2">
                            <select
                              aria-label={`Kategori baris ${row.row_number}`}
                              className="h-9 w-full rounded-md border bg-background px-2"
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
                              Simpan sebagai aturan kata kunci
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
                        ) : row.status === 'matched' ? 'Transaksi lama' : 'Diabaikan saat simpan'}
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
              <Button type="button" disabled={busy} onClick={() => void saveImport()}>{busy ? 'Menyimpan…' : 'Simpan impor'}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Riwayat impor</CardTitle>
          <CardDescription>Pembatalan tidak menghapus transaksi lama yang hanya dicocokkan.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada impor.</p> : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium">{item.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString('id-ID')} · Baru {item.new_count}, Cocok {item.matched_count}, Error {item.error_count}
                    </p>
                  </div>
                  {item.status === 'completed' ? (
                    <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void cancelImport(item.id)}>Batalkan</Button>
                  ) : <span className="text-sm text-muted-foreground">Dibatalkan</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
