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
    <header className="sticky top-[105px] z-10 flex items-baseline justify-between gap-3 border-b bg-white/95 py-2 backdrop-blur">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <span className="text-xs text-muted-foreground">{subLabel}</span>
      </div>
      <span
        className={cn(
          'shrink-0 text-xs font-semibold tabular-nums',
          isPositive ? 'text-primary' : 'text-foreground',
        )}
      >
        <span aria-hidden="true">{isPositive ? '+' : '−'}</span>
        {formatRupiah(Math.abs(net))}
        <span className="sr-only">selisih hari ini</span>
      </span>
    </header>
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
        'group relative flex items-center gap-3 border-b px-1 py-3.5 last:border-0',
        isConfirming ? 'bg-destructive/5' : 'hover:bg-[#fbfaf9]',
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center"
        style={{ color: hue }}
      >
        <Icon className="size-[18px]" />
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
          <span>{isIncome ? 'Pemasukan' : 'Pengeluaran'}</span>
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
            <span className="hidden text-xs text-muted-foreground sm:inline">Hapus transaksi?</span>
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
              {isPending ? 'Menghapus…' : 'Hapus transaksi'}
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
    <section aria-labelledby="empty-transactions-title" className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center text-muted-foreground">
        <WalletCards className="size-6" aria-hidden="true" />
      </span>
      <h3 id="empty-transactions-title" className="mt-4 text-sm font-semibold">Belum ada transaksi</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Catat transaksi pertama melalui formulir. Transaksi akan muncul berdasarkan tanggal.
      </p>
    </section>
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
    <section aria-label="Transaksi berdasarkan tanggal" className="space-y-5">
      {groups.map((group) => (
        <section key={group.date} className="space-y-2">
          <DayHeader date={group.date} net={group.net} />
          <ul>
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
    </section>
  );
}
