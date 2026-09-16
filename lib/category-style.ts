import {
  Banknote,
  Bus,
  Clapperboard,
  Coffee,
  CreditCard,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Lightbulb,
  Plane,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Tag,
  Utensils,
  Wallet,
  Wifi,
  type LucideIcon,
} from 'lucide-react';

import type { CategoryType } from '@/lib/supabase/types';

/**
 * Warna identitas kategori.
 *
 * Delapan hue ini sudah lolos pemeriksaan keterbacaan (rentang lightness, chroma,
 * jarak antar-warna untuk color vision deficiency, dan kontras terhadap permukaan
 * terang). Jangan tambah hue baru begitu saja: hue ke-9 hampir pasti kembar dengan
 * salah satu yang sudah ada. Warna di sini hanya pelengkap — nama kategori selalu
 * ikut ditampilkan sebagai teks, jadi identitas tidak pernah bergantung pada warna saja.
 */
const CATEGORY_HUES = [
  '#059669',
  '#0284c7',
  '#d97706',
  '#e11d48',
  '#7c3aed',
  '#0d9488',
  '#ea580c',
  '#4f46e5',
] as const;

/** Kata kunci pertama yang cocok menentukan ikonnya. */
const ICON_KEYWORDS: Array<[RegExp, LucideIcon]> = [
  [/kopi|cafe|kafe|snack/, Coffee],
  [/makan|minum|kuliner|resto|jajan|dapur/, Utensils],
  [/belanja|supermarket|groceries/, ShoppingCart],
  [/baju|fashion|sepatu|pakaian/, ShoppingBag],
  [/transport|ojek|bensin|bus|kereta|parkir|grab|gojek/, Bus],
  [/pesawat|liburan|travel|wisata|tiket/, Plane],
  [/rumah|sewa|kos|kontrakan/, Home],
  [/listrik|token|air|utilitas|gas/, Lightbulb],
  [/internet|wifi|pulsa|kuota|data/, Wifi],
  [/telepon|gadget|elektronik/, Smartphone],
  [/tagihan|cicilan|angsuran|pajak/, Receipt],
  [/hiburan|film|bioskop|streaming|konser|musik|game/, Clapperboard],
  [/olahraga|gym|fitness/, Dumbbell],
  [/kesehatan|obat|dokter|vitamin|medis/, HeartPulse],
  [/pendidikan|sekolah|kuliah|kursus|buku/, GraduationCap],
  [/gaji|upah|pendapatan|salary/, Banknote],
  [/bonus|freelance|proyek|usaha|bisnis/, Laptop],
  [/hadiah|gift|donasi|thr/, Gift],
  [/tabungan|investasi|saham|reksa/, Wallet],
  [/kartu|kredit|pinjaman/, CreditCard],
];

/** Hash sederhana dan stabil supaya satu kategori selalu dapat warna yang sama. */
function hashName(name: string): number {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export type CategoryStyle = {
  icon: LucideIcon;
  hue: string;
};

/**
 * Ikon dan warna untuk sebuah kategori, diturunkan dari namanya.
 *
 * Tabel `categories` belum menyimpan ikon/warna, jadi keduanya dihitung di sisi
 * tampilan. Hasilnya deterministik: nama yang sama selalu menghasilkan tampilan
 * yang sama di seluruh halaman.
 */
export function categoryStyle(name: string, type: CategoryType): CategoryStyle {
  const normalized = name.toLowerCase();
  const matched = ICON_KEYWORDS.find(([pattern]) => pattern.test(normalized));

  return {
    icon: matched ? matched[1] : type === 'income' ? Banknote : Tag,
    hue: CATEGORY_HUES[hashName(normalized) % CATEGORY_HUES.length],
  };
}
