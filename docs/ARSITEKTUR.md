# ARSITEKTUR SISTEM KLINIK POLINELA

**Dokumen Versi:** 1.0  
**Tanggal:** 18 November 2026  
**Standar Arsitektur:** Decoupled Client-Server (SPA + Headless REST API)

---

## 1. PENDEKATAN ARSITEKTUR KESELURUHAN

Sistem Informasi Klinik Polinela menggunakan arsitektur **Decoupled Architecture** (Pemisahan Penuh Frontend & Backend):

```text
+----------------------------------------------------------------------------------+
|                                KLIEN BROWSER                                    |
|   (React 18/19 SPA + Vite + React Router DOM + Axios Interceptors + Context API)  |
+----------------------------------------+-----------------------------------------+
                                         |  HTTPS / JSON API
                                         |  Bearer Token (Sanctum)
                                         v
+----------------------------------------------------------------------------------+
|                                BACKEND SERVER                                    |
|   (Laravel 13 REST API + PHP 8.3 + Laravel Sanctum + FormRequest Validation)      |
+----------------------------------------+-----------------------------------------+
                                         |  TCP Connection
                                         |  Eloquent ORM
                                         v
+----------------------------------------------------------------------------------+
|                                DATABASE SERVER                                   |
|   (MySQL 8.0 / MariaDB 10.4+ dengan InnoDB Engine & Relational Constraints)       |
+----------------------------------------------------------------------------------+
```

### Konsep Akses Website (20 November 2026)
Website frontend menyajikan Landing Page publik di `/`, portal web Admin di `/admin`, dan portal web Dokter di `/doctor`. Rute `/patient/*` dialihkan ke Landing Page. Data pasien, profil, antrean, rekam medis, endpoint pasien, dan autentikasi API pasien tetap dipertahankan untuk klien mobile. Login website menandai permintaan dengan `client: web`, sehingga hanya Admin dan Dokter dapat login lewat website.

### Prinsip Utama:
1. **Stateless RESTful API**: Komunikasi antara frontend dan backend berbasis HTTP stateless dengan format data murni JSON.
2. **Token-based Authentication**: Menggunakan Laravel Sanctum (`personal_access_tokens`) dengan penyimpanan token di `localStorage` klien serta pembaruan otomatis header `Authorization: Bearer <token>`.
3. **Single Point of Business Logic**: Validasi masukan data, aturan antrean harian, integritas stok obat, dan kalkulasi nomor antrean ditangani secara terpusat di Backend Laravel.
4. **Single Page Application (SPA)**: Transisi antarhalaman di frontend berjalan cepat tanpa reload browser, mempertahankan tata letak visual proyek lama yang elegan.

---

## 2. STRUKTUR DIREKTORI PROYEK

### A. Frontend (`KLINIK-POLINELA/frontend/`)
```text
frontend/
├── public/                     # Aset publik statis (favicon, logo)
├── src/
│   ├── assets/                 # Gambar logo, ikon, gambar obat default
│   │   └── logo-klinik.png
│   ├── components/             # Komponen reusable antarmuka
│   │   ├── common/             # Tombol, input teks, badge status, modal, toast
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── SearchInput.jsx
│   │   └── layout/             # Header, sidebar navigasi, footer
│   │       ├── Sidebar.jsx
│   │       ├── Topbar.jsx
│   │       └── DashboardLayout.jsx
│   ├── context/                # Global State (AuthContext, NotificationContext)
│   │   └── AuthContext.jsx
│   ├── pages/                  # Halaman berdasarkan Peran (Role)
│   │   ├── auth/               # Login, Registrasi Pasien, Lupa Password
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── admin/              # Portal Administrator
│   │   │   ├── DashboardAdmin.jsx
│   │   │   ├── QueueManagement.jsx
│   │   │   ├── DoctorManagement.jsx
│   │   │   ├── MedicineManagement.jsx
│   │   │   └── NotificationManagement.jsx
│   │   ├── doctor/             # Portal Dokter
│   │   │   ├── DashboardDoctor.jsx
│   │   │   ├── PatientExamination.jsx
│   │   │   └── ExaminationHistory.jsx
│   │   ├── patient/            # Portal Pasien Civitas
│   │   │   ├── DashboardPatient.jsx
│   │   │   ├── QueueRegistration.jsx
│   │   │   ├── MedicalRecordsPatient.jsx
│   │   │   └── DoctorSchedulePatient.jsx
│   │   └── common/             # Profil, Ubah Password, 404 Not Found
│   │       ├── ProfilePage.jsx
│   │       ├── ChangePasswordPage.jsx
│   │       └── NotFoundPage.jsx
│   ├── services/               # HTTP client & endpoint wrapper
│   │   ├── api.js              # Axios instance dengan interceptor
│   │   ├── authService.js
│   │   ├── queueService.js
│   │   ├── doctorService.js
│   │   ├── medicineService.js
│   │   └── medicalRecordService.js
│   ├── styles/                 # Desain visual asli proyek lama
│   │   ├── variables.css       # Skema warna (#2A5D89, #21486B, #f6f8f9)
│   │   ├── global.css          # Reset, base typography DM Sans & Plus Jakarta Sans
│   │   ├── layout.css          # Grid sidebar & main viewport
│   │   └── components.css      # Card, badge, table styling
│   ├── App.jsx                 # Provider & Router utama
│   └── main.jsx                # Entry point React
├── package.json
└── vite.config.js
```

### B. Backend (`KLINIK-POLINELA/backend/`)
```text
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── Admin/
│   │   │   │   ├── DashboardController.php
│   │   │   │   ├── QueueController.php
│   │   │   │   ├── DoctorController.php
│   │   │   │   ├── MedicineController.php
│   │   │   │   └── NotificationController.php
│   │   │   ├── Doctor/
│   │   │   │   ├── DoctorQueueController.php
│   │   │   │   └── ExaminationController.php
│   │   │   └── Patient/
│   │   │   │   ├── PatientQueueController.php
│   │   │   │   └── PatientRecordController.php
│   │   ├── Middleware/
│   │   │   └── CheckRole.php       # Proteksi hak akses role (admin, doctor, patient)
│   │   └── Requests/               # Validasi FormRequest ketat
│   │       ├── Auth/LoginRequest.php
│   │       ├── Queue/CreateQueueRequest.php
│   │       ├── Medicine/StoreMedicineRequest.php
│   │       └── Examination/StoreExaminationRequest.php
│   └── Models/
│       ├── User.php
│       ├── DoctorProfile.php
│       ├── PatientProfile.php
│       ├── DoctorSchedule.php
│       ├── Queue.php
│       ├── MedicalRecord.php
│       ├── Prescription.php
│       ├── PrescriptionItem.php
│       ├── Medicine.php
│       ├── MedicineTransaction.php
│       └── Notification.php
├── database/
│   ├── migrations/                 # Skema DDL tabel ternormalisasi
│   └── seeders/                    # Seed admin, dokter, civitas, obat, jadwal
├── routes/
│   ├── api.php                     # Rute REST API
│   └── web.php
└── config/
    ├── cors.php
    └── sanctum.php
```

---

## 3. IDENTITAS VISUAL & DESIGN TOKENS
Untuk menjamin kesinambungan visual dengan proyek lama:
- **Primary Brand Color**: `#2A5D89` (Deep Academic Teal)
- **Primary Dark (Hover/Active)**: `#21486B`
- **Primary Light (Tints/Badges)**: `#e8eff4`
- **Text Ink**: `#202938`
- **Text Muted**: `#7b8490`
- **Border Lines**: `#e8ecee`
- **Background App**: `#f6f8f9`
- **Status Colors**:
  - Menunggu (Waiting): Background `#fff3df`, Text `#c68b35`
  - Diperiksa (In-Progress): Background `#e9f0ff`, Text `#5f85d0`
  - Selesai (Completed): Background `#e3f5ee`, Text `#329779`
  - Batal/Bahaya (Cancelled): Background `#fef2f2`, Text `#dc2626`
- **Typography**: `Plus Jakarta Sans` untuk Headings & Logo Brand; `DM Sans` untuk body text dan formulir.

---

## 4. STANDAR RESPON API
Semua respon endpoint API diseragamkan dengan format JSON:

### Sukses:
```json
{
  "success": true,
  "message": "Operasi berhasil dilakukan.",
  "data": { ... }
}
```

### Gagal / Validasi:
```json
{
  "success": false,
  "message": "Data yang dikirimkan tidak valid.",
  "errors": {
    "field_name": ["Pesan error validasi."]
  }
}
```
