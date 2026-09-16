import { z } from 'zod';

const statusSchema = z.enum(['new', 'matched', 'error']);
const typeSchema = z.enum(['expense', 'income']).nullable();

export const importRowSchema = z.object({
  row_number: z.number().int().positive(),
  fingerprint: z.string().min(1).max(500),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  description: z.string().max(200).nullable(),
  amount: z.number().int().positive().nullable(),
  type: typeSchema,
  status: statusSchema,
  error_message: z.string().max(500).nullable(),
  category_id: z.uuid().nullable().optional(),
  matched_transaction_id: z.uuid().nullable().optional(),
});

export const previewImportSchema = z.object({
  rows: z.array(importRowSchema.omit({ category_id: true, matched_transaction_id: true })).max(50_000),
});

export const saveImportSchema = z.object({
  file_name: z.string().trim().min(1).max(255),
  bank: z.enum(['bank_a', 'bank_b']),
  rows: z.array(importRowSchema).min(1).max(50_000),
  rules: z
    .array(
      z.object({
        keyword: z.string().trim().min(2).max(100),
        category_id: z.uuid(),
        type: z.enum(['expense', 'income']),
      }),
    )
    .max(500)
    .default([]),
});
