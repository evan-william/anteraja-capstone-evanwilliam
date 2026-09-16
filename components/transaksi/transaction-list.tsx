'use client';

import { Pencil, Trash2, WalletCards } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { categoryStyle } from '@/lib/category-style';
import { formatJakartaDayGroup } from '@/lib/date';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';

import type { TransactionWithCategory } from './transaction-manager';

export type TransactionDayGroup = {
  /** Tanggal lokal Jakarta, format YYYY-MM-DD. */
  date: string;
  items: TransactionWithCategory[];
  /** Selisih pemasukan dan pengeluaran pada hari itu. */
  net: number;
};

type TransactionListProps = {
  groups: TransactionDayGroup[];
  pendingId: string | null;
  onEdit: (transaction: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
};

function DayHeader({ date, net }: { date: string; net: number }) {
  const { label, subLabel } = formatJakartaDayGroup(date);
  const isPositive = net >= 0;

  return (
    <div className="sticky top-0 z-10 flex items-baseline justify-between gap-3 border-b bg-background/95 py-2 backdrop-blur">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{subLabel}</span>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums',
          isPositive ? 'text-primary' : 'text-foreground',
        )}
      >
        <span aria-hidden="true">{isPositive ? '+' : '−'}</span>
        {formatRupiah(Math.abs(net))}
        <span className="sr-only">selisih hari ini</span>
      </span>
    </div>
  );
}

function TransactionRow({
  transaction,
  isPending,
  isConfirming,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  transaction: TransactionWithCategory;
  isPending: boolean;
  isConfirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const categoryName = transaction.categories?.name ?? 'Tanpa kategori';
  const isIncome = transaction.categories?.type === 'income';
  const { icon: Icon, hue } = categoryStyle(categoryName, isIncome ? 'income' : 'expense');

  return (
    <li
      className={cn(
        'group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors',
        isConfirming ? 'border-destructive/40 bg-destructive/5' : 'hover:bg-accent/50',
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${hue}1a`, color: hue }}
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description || categoryName}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {transaction.description ? (
            <>
              <span className="truncate">{categoryName}</span>
              <span aria-hidden="true">·</span>
            </>
          ) : null}
          <span className="rounded-sm bg-muted px-1.5 py-0.5 font-medium">
            {isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <p
          className={cn(
            'flex items-baseline gap-0.5 text-sm font-semibold tabular-nums sm:text-base',
            isIncome ? 'text-primary' : 'text-foreground',
          )}
        >
          <span aria-hidden="true">{isIncome ? '+' : '−'}</span>
          <span data-testid="transaction-amount">{formatRupiah(transaction.amount)}</span>
        </p>

        {isConfirming ? (
          <div className="flex items-center gap-1">
            <span className="hidden text-xs text-muted-foreground sm:inline">Hapus?</span>
            <Button type="button" size="sm" variant="ghost" onClick={onCancelDelete}>
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isPending}
              onClick={onConfirmDelete}
            >
              {isPending ? 'Menghapus…' : 'Hapus'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={onEdit}
              aria-label={`Ubah transaksi ${transaction.description || categoryName}`}
            >
              <Pencil />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 hover:bg-destructive/10 hover:text-destructive"
              onClick={onAskDelete}
              aria-label={`Hapus transaksi ${transaction.description || categoryName}`}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <WalletCards className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">Belum ada transaksi</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Catatan pemasukan dan pengeluaranmu akan muncul di sini. Mulai lewat form di atas.
      </p>
    </div>
  );
}

export function TransactionList({
  groups,
  pendingId,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (groups.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.date} className="space-y-2">
          <DayHeader date={group.date} net={group.net} />
          <ul className="space-y-2">
            {group.items.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                isPending={pendingId === transaction.id}
                isConfirming={confirmingId === transaction.id}
                onEdit={() => onEdit(transaction)}
                onAskDelete={() => setConfirmingId(transaction.id)}
                onCancelDelete={() => setConfirmingId(null)}
                onConfirmDelete={() => {
                  setConfirmingId(null);
                  onDelete(transaction.id);
                }}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
