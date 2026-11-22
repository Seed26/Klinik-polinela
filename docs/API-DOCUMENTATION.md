# DOKUMENTASI REST API KLINIK POLINELA

**Base URL:** `http://localhost:8000/api`  
**Akses Web:**
- `POST /auth/login` dari frontend web mengirim `client: "web"`; hanya role `admin` dan `doctor` yang dapat login ke portal web.
- Login API untuk klien non-web tetap dapat menerima pasien untuk menjaga kesiapan integrasi mobile; pendaftaran pasien dan endpoint data pasien tetap tersedia.
- Frontend website menyediakan Landing Page publik `/`, Portal Admin, dan Portal Dokter; tidak menyediakan portal pasien web.

**Headers Standar:**
- `Accept: application/json`
- `Content-Type: application/json`
- `Authorization: Bearer <sanctum_token>` (untuk endpoint terproteksi)

---

## 1. ENDPOINT AUTENTIKASI (PUBLIC & PROTECTED)

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Public | Login multi-identifier (NIM / NIP / Email + Password). Mengembalikan user data & token. |
| `POST` | `/auth/register` | Public | Registrasi akun baru khusus Pasien Civitas Polinela. |
| `POST` | `/auth/logout` | Auth | Menghapus personal access token aktif. |
| `GET` | `/auth/me` | Auth | Mengambil data profil pengguna yang sedang login. |
| `PUT` | `/auth/profile` | Auth | Memperbarui nama, telepon, riwayat alergi, foto profil. |
| `PUT` | `/auth/change-password` | Auth | Memperbarui kata sandi pengguna. |

---

## 2. ENDPOINT MODUL ADMIN (`role: admin`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/admin/dashboard/stats` | Statistik kartu (Pasien dilayani, antrean hari ini, antrean menunggu, stok obat menipis). |
| `GET` | `/admin/queues` | Menampilkan seluruh antrean (filter: date, status, search). |
| `POST` | `/admin/queues` | Pendaftaran antrean manual langsung oleh admin di klinik. |
| `PATCH` | `/admin/queues/{id}/status` | Mengubah status antrean (`Menunggu`, `Diperiksa`, `Selesai`, `Dibatalkan`). |
| `DELETE`| `/admin/queues/{id}` | Menghapus data antrean. |
| `GET` | `/admin/doctors` | Daftar seluruh dokter (nama, SIP, spesialisasi, status akun). |
| `POST` | `/admin/doctors` | Menambahkan data dokter baru + akun login dokter. |
| `PUT` | `/admin/doctors/{id}` | Memperbarui data profil dokter. |
| `PATCH`| `/admin/doctors/{id}/status` | Mengaktifkan / menonaktifkan akun dokter. |
| `GET` | `/admin/schedules` | Mengambil seluruh jadwal dokter. |
| `POST` | `/admin/schedules` | Menambah jadwal praktik dokter. |
| `PUT` | `/admin/schedules/{id}` | Memperbarui jadwal dokter. |
| `DELETE`| `/admin/schedules/{id}` | Menghapus jadwal dokter. |
| `GET` | `/admin/medicines` | Menampilkan inventaris obat klinik. |
| `POST` | `/admin/medicines` | Menambahkan obat baru (mendukung upload gambar). |
| `PUT` | `/admin/medicines/{id}` | Mengubah informasi & stok obat. |
| `DELETE`| `/admin/medicines/{id}` | Menghapus / mengarsipkan obat. |
| `GET` | `/admin/notifications` | Riwayat pengumuman/notifikasi siaran. |
| `POST` | `/admin/notifications` | Mengirim notifikasi siaran baru ke pasien. |

---

## 3. ENDPOINT MODUL DOKTER (`role: doctor`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/doctor/dashboard` | Ringkasan pasien antrean dokter jaga hari ini. |
| `GET` | `/doctor/queues` | Daftar antrean pasien yang ditugaskan ke dokter ini. |
| `POST` | `/doctor/queues/{id}/call` | Memanggil pasien (ubah status antrean ke `Diperiksa`). |
| `POST` | `/doctor/examinations` | Menyimpan rekam medis (anamnesa, vital signs, diagnosis, tindakan). |
| `POST` | `/doctor/prescriptions` | Menerbitkan resep obat elektronik untuk rekam medis tertentu. |
| `POST` | `/doctor/queues/{id}/complete` | Menyelesaikan pemeriksaan & penyerahan obat (auto update status antrean ke `Selesai`). |
| `GET` | `/doctor/patient-history/{patientId}` | Melihat rekam medis terdahulu milik pasien yang sedang diperiksa. |
| `GET` | `/doctor/medicines/available` | Katalog obat dengan stok tersedia untuk bahan pertimbangan resep. |

---

## 4. ENDPOINT MODUL PASIEN (`role: patient`)

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/patient/dashboard` | Info antrean aktif pasien, dokter jaga hari ini, ringkasan notifikasi. |
| `GET` | `/patient/schedules` | Melihat jadwal dokter yang sedang aktif. |
| `GET` | `/patient/queues/active` | Mendapatkan nomor antrean aktif hari ini (jika ada). |
| `POST` | `/patient/queues` | Mendaftar antrean baru (validasi maks 1 antrean per tanggal kunjungan). |
| `GET` | `/patient/queues/{id}/ticket`| Mengambil data detail tiket antrean digital untuk cetak PDF. |
| `DELETE`| `/patient/queues/{id}` | Membatalkan antrean (hanya jika status masih `Menunggu`). |
| `GET` | `/patient/medical-records` | Riwayat pemeriksaan kesehatan & resep milik pasien sendiri. |
| `GET` | `/patient/notifications` | Daftar pengumuman klinik yang ditujukan untuk pasien. |
| `PATCH` | `/patient/notifications/{id}/read` | Menandai notifikasi telah dibaca. |
