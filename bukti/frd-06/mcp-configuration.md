# Konfigurasi MCP FRD-06

Ketiga server dipasang pada konfigurasi lokal client. Contoh `.vscode/mcp.json`
tersedia di workspace untuk dipakai langsung, tetapi sengaja diabaikan Git agar
metadata akun/project dan token OAuth tidak ikut ke repository:

| Server | Transport | Tujuan verifikasi |
|---|---|---|
| Context7 | HTTP | Dokumentasi Papa Parse; hasil query ada di folder bukti ini |
| Supabase | HTTP + OAuth | Migrasi, query sebelum/sesudah, dan pembatalan |
| Chrome DevTools | stdio melalui `cmd /c npx` | Profil parsing 50.000 baris pada Windows |

Autentikasi Supabase dilakukan melalui OAuth/CLI resmi pada mesin pengguna. Token
disimpan oleh client di luar repository. File `.env*` selain `.env.example` juga
diabaikan Git sesuai aturan repository.
