// Nilai env dibaca sebagai `process.env.NAMA_LITERAL`, bukan `process.env[key]`.
// Next.js hanya meng-inline env NEXT_PUBLIC_* ke bundle browser lewat penggantian
// teks literal, jadi akses lewat variabel selalu undefined di client.
function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Environment variable ${key} belum diisi. Salin .env.example ke .env.local lalu isi kredensial Supabase kamu.`,
    );
  }
  return value;
}

export const supabaseUrl = () =>
  requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);

export const supabasePublishableKey = () =>
  requireEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
