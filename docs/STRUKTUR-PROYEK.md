# Struktur Proyek Klinik Polinela

Dokumen ini menjelaskan struktur implementasi yang tersedia saat audit 20 November 2026.

```text
KLINIK-POLINELA/
├── backend/
│   ├── app/Http/Controllers/   # Auth, Admin, Doctor, Patient API
│   ├── app/Http/Middleware/   # Pemeriksaan role
│   ├── app/Models/            # Model akun, profil, antrean, rekam medis, resep, obat, notifikasi
│   ├── database/migrations/   # Skema aplikasi, Laravel, Sanctum
│   ├── database/seeders/     # Data fiktif pengembangan
│   ├── routes/api.php         # Route REST API
│   └── tests/Feature/         # Tes autentikasi, akses role, workflow dokter/admin
├── frontend/
│   ├── src/App.jsx            # Routing Landing, Login, Portal Admin/Dokter
│   ├── src/landing.css        # Styling khusus Landing Page
│   ├── src/components/layout/ # Shell dan guard role
│   ├── src/context/           # State autentikasi
│   ├── src/pages/             # Login serta dashboard awal
│   ├── src/services/          # Axios REST API
│   └── src/assets/            # Logo dan aset UI
├── docs/                      # Arsitektur, ERD, API, alur, audit, tes, bug
├── README.md                  # Petunjuk lokal
└── TODO.md                    # Checklist lokal pengembangan
```

Folder/file pribadi tooling agent dan TODO dicantumkan pada `.gitignore` sesuai preferensi pemilik proyek. Folder `docs/` menjelaskan sistem dan bukan file rahasia; keputusan melacaknya mengikuti kebijakan repository tim.
