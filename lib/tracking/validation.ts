import { z } from 'zod';

export const awbSchema = z.string().trim().toUpperCase().regex(/^ANT-[0-9]{6}$/, 'Nomor resi harus seperti ANT-100015.');
export const accessCodeSchema = z.string().trim().regex(/^[0-9]{6}$/, 'Kode akses harus terdiri dari 6 angka.');

export const resolutionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('update_address'),
    district: z.string().trim().min(2, 'Kecamatan wajib diisi.').max(80),
    street: z.string().trim().min(5, 'Nama jalan terlalu pendek.').max(180),
    landmark: z.string().trim().min(3, 'Petunjuk lokasi terlalu pendek.').max(150),
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, 'Nomor telepon tidak valid.'),
  }),
  z.object({
    type: z.literal('reschedule'),
    delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal pengiriman tidak valid.'),
    note: z.string().trim().max(150).optional().default(''),
  }),
  z.object({
    type: z.literal('safe_drop'),
    landmark: z.string().trim().min(3, 'Lokasi penitipan wajib diisi.').max(150),
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, 'Nomor telepon tidak valid.'),
  }),
]);

export const ticketSchema = z.object({ note: z.string().trim().max(500, 'Catatan maksimal 500 karakter.').default('') });
export const notificationSchema = z.object({
  whatsapp: z.boolean().default(false),
  email: z.boolean().default(false),
  push: z.boolean().default(false),
});

export function issueMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? 'Data tidak valid.';
}
