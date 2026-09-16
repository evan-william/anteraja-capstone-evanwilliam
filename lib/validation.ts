import { z } from 'zod';

import { isValidJakartaDateString } from './date';

export const categoryTypeSchema = z.enum(['expense', 'income'], {
  message: 'Jenis kategori harus pengeluaran atau pemasukan.',
});

const categoryNameSchema = z
  .string({ message: 'Nama kategori wajib diisi.' })
  .trim()
  .min(1, 'Nama kategori wajib diisi.')
  .max(30, 'Nama kategori maksimal 30 karakter.');

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  type: categoryTypeSchema,
});

export const updateCategorySchema = z
  .object({
    name: categoryNameSchema.optional(),
    is_archived: z.boolean().optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.is_archived !== undefined,
    'Tidak ada perubahan yang dikirim.',
  );

const amountSchema = z
  .number({ message: 'Nominal wajib diisi.' })
  .int('Nominal harus rupiah utuh, tanpa desimal.')
  .positive('Nominal harus lebih besar dari nol.')
  .max(Number.MAX_SAFE_INTEGER, 'Nominal terlalu besar.');

const descriptionSchema = z
  .string()
  .trim()
  .max(200, 'Deskripsi maksimal 200 karakter.')
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const transactionDateSchema = z
  .string({ message: 'Tanggal wajib diisi.' })
  .refine(isValidJakartaDateString, 'Format tanggal harus YYYY-MM-DD.');

export const createTransactionSchema = z.object({
  category_id: z.uuid('Kategori wajib dipilih.'),
  amount: amountSchema,
  description: descriptionSchema,
  transaction_date: transactionDateSchema,
});

export const updateTransactionSchema = z
  .object({
    category_id: z.uuid('Kategori tidak valid.').optional(),
    amount: amountSchema.optional(),
    description: descriptionSchema,
    transaction_date: transactionDateSchema.optional(),
    is_deleted: z.boolean().optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    'Tidak ada perubahan yang dikirim.',
  );

export const signUpSchema = z.object({
  name: z
    .string({ message: 'Nama wajib diisi.' })
    .trim()
    .min(1, 'Nama wajib diisi.')
    .max(60, 'Nama maksimal 60 karakter.'),
  email: z.email('Format email tidak valid.').transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'Password minimal 8 karakter.'),
});

export const signInSchema = z.object({
  email: z.email('Format email tidak valid.').transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password wajib diisi.'),
});

/** Ambil pesan error pertama dari hasil parse Zod. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Input tidak valid.';
}
