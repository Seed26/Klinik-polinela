# Klinik Polinela

Aplikasi informasi Klinik Polinela dengan frontend React + Vite dan backend Laravel REST API. Website menyediakan Landing Page publik serta portal Admin dan Dokter. API/data pasien dipertahankan untuk kompatibilitas klien, tetapi portal pasien tidak disediakan di website.

## Teknologi

- Frontend: React, Vite, React Router, Axios.
- Backend: Laravel 13, PHP 8.3+, Laravel Sanctum.
- Database: MySQL atau MariaDB.

## Prasyarat

- Git.
- PHP 8.3+ beserta ekstensi yang dibutuhkan Laravel.
- Composer.
- Node.js dan npm.
- MySQL/MariaDB.

## Clone project

```bash
git clone <URL-REPOSITORY>
cd <FOLDER-REPOSITORY>
```

## Menjalankan backend Laravel

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Pada Windows PowerShell, gunakan `Copy-Item .env.example .env` sebagai pengganti `cp`.

Buat database kosong untuk development. Isi konfigurasi koneksi MySQL/MariaDB lokal di `backend/.env` (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`). Jangan mengunggah atau membagikan `.env`.

```bash
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

Migration membuat struktur tabel, bukan data klinis. Hindari `migrate:fresh` pada database berisi data penting. **Seeder saat ini belum aman untuk dibagikan/dijalankan** karena memuat akun berkredensial tetap dan data contoh; jangan jalankan `db:seed` sebelum data tersebut ditinjau dan diganti dengan data uji aman yang disepakati tim.

## Menjalankan frontend React + Vite

Di terminal lain dari root project:

```bash
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Buka `http://127.0.0.1:5173`. API default frontend menunjuk ke `http://127.0.0.1:8000/api`. Untuk alamat lain, buat `frontend/.env.local` dengan `VITE_API_BASE_URL=http://HOST:PORT/api`. File `.env.local` bersifat lokal dan tidak boleh dikomit.

## Akun pengujian

Belum ada akun uji yang disetujui untuk dibagikan. Jangan gunakan kredensial seeder default di lingkungan bersama atau produksi. Buat akun development lokal dengan cara yang disetujui tim.

## Pengujian

Backend:

```bash
cd backend
php artisan test --compact
```

Frontend:

```bash
cd frontend
npm run build
npm run lint
```

## Struktur repository

- `backend/` — Laravel API, routes, controller, model, migration, seeder, factory, dan tests.
- `frontend/` — React/Vite, routing, komponen, halaman, CSS, dan assets.
- `docs/` — dokumentasi arsitektur, API, alur, dan database.

Dokumentasi lanjutan: `docs/ARSITEKTUR.md`, `docs/ERD.md`, dan `docs/API-DOCUMENTATION.md`.

## Kolaborasi Git

- Gunakan `main` sebagai branch utama; hindari commit langsung ke `main`.
- Pull perubahan terbaru sebelum mulai bekerja.
- Buat branch untuk setiap fitur/perbaikan, misalnya `feat/nama-fitur` atau `fix/nama-bug`.
- Gunakan commit message deskriptif dan Pull Request untuk review.
- Hindari force push ke `main`.

> **Catatan sebelum publikasi:** repository lokal saat audit tidak memiliki `.git` di folder project dan Git mendeteksi root pada direktori induk `C:\Users\Latitude`. Pastikan root repository sudah benar sebelum menambahkan remote atau mengunggah file.

## Akses aplikasi

- `/` — Landing Page publik.
- `/login` — login Admin/Dokter; setelah autentikasi diarahkan sesuai role akun.
- `/admin/*` — portal Admin (dilindungi role).
- `/doctor/*` — portal Dokter (dilindungi role).
- `/patient/*` — diarahkan ke Landing Page; portal pasien web tidak tersedia.
"# Klinik-polinela" 
