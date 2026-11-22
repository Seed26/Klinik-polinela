# ENTITY RELATIONSHIP DIAGRAM (ERD) & SKEMA DATABASE
**Sistem Informasi Klinik Polinela**

---

## 1. MERMAID DIAGRAM RELASI ENTITAS

```mermaid
erDiagram
    users ||--o| doctor_profiles : "has"
    users ||--o| patient_profiles : "has"
    users ||--o{ notifications : "creates (admin)"
    users ||--o{ notification_recipients : "receives"
    
    doctor_profiles ||--o{ doctor_schedules : "has"
    doctor_profiles ||--o{ queues : "serves"
    doctor_profiles ||--o{ medical_records : "examines"

    patient_profiles ||--o{ queues : "registers"
    patient_profiles ||--o{ medical_records : "owns"

    queues ||--o| medical_records : "generates"
    
    medical_records ||--o| prescriptions : "prescribes"
    prescriptions ||--o{ prescription_items : "contains"
    
    medicines ||--o{ prescription_items : "dispensed_as"
    medicines ||--o{ medicine_transactions : "logged_in"

    users {
        bigint id PK
        string name
        string email UK
        string password
        enum role "admin, doctor, patient"
        string phone
        string photo
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    doctor_profiles {
        bigint id PK
        bigint user_id FK
        string sip_number UK
        string specialization
        string clinic_type
        text bio
    }

    patient_profiles {
        bigint id PK
        bigint user_id FK
        string identifier_number UK "NIM atau NIP"
        enum civitas_type "mahasiswa, dosen, tendik"
        string study_program
        integer age
        text allergy_history
    }

    doctor_schedules {
        bigint id PK
        bigint doctor_profile_id FK
        enum day "Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu"
        time start_time
        time end_time
        boolean is_active
    }

    queues {
        bigint id PK
        string queue_number "Contoh: A-001"
        bigint patient_profile_id FK
        bigint doctor_profile_id FK
        date visit_date
        time estimated_time
        enum status "Menunggu, Diperiksa, Selesai, Dibatalkan"
        text complaint
        timestamp created_at
    }

    medical_records {
        bigint id PK
        bigint queue_id FK UK
        bigint patient_profile_id FK
        bigint doctor_profile_id FK
        date record_date
        text complaint
        string blood_pressure
        string body_temperature
        string body_weight
        text physical_examination
        string diagnosis
        text action_treatment
        text follow_up_notes
        timestamp created_at
    }

    prescriptions {
        bigint id PK
        string prescription_code UK "Contoh: RX-20261118-001"
        bigint medical_record_id FK UK
        enum status "Menunggu Pengambilan, Selesai, Dibatalkan"
        timestamp dispensed_at
    }

    prescription_items {
        bigint id PK
        bigint prescription_id FK
        bigint medicine_id FK
        integer quantity
        string dosage_instructions
    }

    medicines {
        bigint id PK
        string name
        string category
        string form "Tablet, Kapsul, Sirup, Salep, dll"
        integer stock
        integer min_stock_alert
        text description
        text dosage
        text side_effects
        string image_url
    }

    medicine_transactions {
        bigint id PK
        bigint medicine_id FK
        enum type "masuk, keluar, penyesuaian"
        integer quantity
        integer stock_before
        integer stock_after
        string reference_type "resep, pengadaan, expired"
        string reference_id
        text notes
        timestamp created_at
    }

    notifications {
        bigint id PK
        bigint created_by_user_id FK
        string title
        text message
        enum target_role "all, patient, doctor"
        timestamp created_at
    }

    notification_recipients {
        bigint id PK
        bigint notification_id FK
        bigint user_id FK
        boolean is_read
        timestamp read_at
    }
```

---

## 2. AUDIT SKEMA SAAT INI (20 NOVEMBER 2026)

Tidak ada migration perubahan schema untuk penyesuaian konsep akses website ini. Skema yang ada tetap mencakup akun `users` dengan role `admin`, `doctor`, dan `patient`; profil dokter dan pasien; jadwal dokter; antrean; rekam medis; resep dan item resep; obat dan mutasi stok; notifikasi dan penerimanya. Relasi foreign key yang melindungi data pasien dan riwayat tetap dipertahankan. Role pasien di database tetap dibutuhkan untuk data historis dan autentikasi API klien mobile mendatang. Migration perubahan skema sengaja tidak dibuat karena belum ada kebutuhan teknis/kolom baru yang terbukti. Database MySQL lokal saat audit berisi 21 tabel total (termasuk tabel bawaan framework), 20 user, 17 profil pasien, 2 profil dokter, 5 jadwal, 6 obat dan 6 transaksi stok. Tabel antrean dan rekam medis masih kosong pada saat pengamatan.

## 3. DETAIL STRUKTUR TABEL & INTEGRITAS RELASIONAL

### 1. `users`
Tabel akun sentral autentikasi.
- `id` (BIGINT, PK, Auto Increment)
- `name` (VARCHAR 255, NOT NULL)
- `email` (VARCHAR 255, UNIQUE, NOT NULL)
- `password` (VARCHAR 255, NOT NULL - Bcrypt Hash)
- `role` (ENUM: `'admin'`, `'doctor'`, `'patient'`, NOT NULL)
- `phone` (VARCHAR 50, NULLABLE)
- `photo` (VARCHAR 255, NULLABLE)
- `is_active` (BOOLEAN, DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMP)

### 2. `doctor_profiles`
Profil profesional dokter pemeriksa.
- `id` (BIGINT, PK, Auto Increment)
- `user_id` (BIGINT, FK -> `users.id`, ON DELETE CASCADE, UNIQUE)
- `sip_number` (VARCHAR 100, UNIQUE, NOT NULL - Surat Izin Praktik)
- `specialization` (VARCHAR 100, DEFAULT 'Dokter Umum')
- `clinic_type` (VARCHAR 100, DEFAULT 'Poli Umum')
- `bio` (TEXT, NULLABLE)

### 3. `patient_profiles`
Profil civitas akademika (Mahasiswa, Dosen, Tenaga Kependidikan).
- `id` (BIGINT, PK, Auto Increment)
- `user_id` (BIGINT, FK -> `users.id`, ON DELETE CASCADE, UNIQUE)
- `identifier_number` (VARCHAR 50, UNIQUE, NOT NULL - NIM / NIP)
- `civitas_type` (ENUM: `'mahasiswa'`, `'dosen'`, `'tendik'`, NOT NULL)
- `study_program` (VARCHAR 150, NULLABLE - Contoh: D3 Manajemen Informatika)
- `age` (INTEGER, NULLABLE)
- `allergy_history` (TEXT, NULLABLE - Riwayat alergi obat)

### 4. `doctor_schedules`
Jadwal piket klinik dokter.
- `id` (BIGINT, PK, Auto Increment)
- `doctor_profile_id` (BIGINT, FK -> `doctor_profiles.id`, ON DELETE CASCADE)
- `day` (ENUM: `'Senin'`, `'Selasa'`, `'Rabu'`, `'Kamis'`, `'Jumat'`, `'Sabtu'`, `'Minggu'`)
- `start_time` (TIME, NOT NULL)
- `end_time` (TIME, NOT NULL)
- `is_active` (BOOLEAN, DEFAULT TRUE)

### 5. `queues`
Pendaftaran antrean harian klinik.
- `id` (BIGINT, PK, Auto Increment)
- `queue_number` (VARCHAR 20, NOT NULL) - Format unik harian `A-001`
- `patient_profile_id` (BIGINT, FK -> `patient_profiles.id`, ON DELETE RESTRICT)
- `doctor_profile_id` (BIGINT, FK -> `doctor_profiles.id`, ON DELETE RESTRICT)
- `visit_date` (DATE, NOT NULL)
- `estimated_time` (TIME, NOT NULL)
- `status` (ENUM: `'Menunggu'`, `'Diperiksa'`, `'Selesai'`, `'Dibatalkan'`, DEFAULT `'Menunggu'`)
- `complaint` (TEXT, NULLABLE)
- `created_at`, `updated_at` (TIMESTAMP)

### 6. `medical_records`
Rekam medis klinis resmi yang dibuat oleh dokter.
- `id` (BIGINT, PK, Auto Increment)
- `queue_id` (BIGINT, FK -> `queues.id`, ON DELETE RESTRICT, UNIQUE)
- `patient_profile_id` (BIGINT, FK -> `patient_profiles.id`, ON DELETE RESTRICT)
- `doctor_profile_id` (BIGINT, FK -> `doctor_profiles.id`, ON DELETE RESTRICT)
- `record_date` (DATE, NOT NULL)
- `complaint` (TEXT, NOT NULL)
- `blood_pressure` (VARCHAR 20, NULLABLE) - misal: 120/80 mmHg
- `body_temperature` (VARCHAR 20, NULLABLE) - misal: 36.5 C
- `body_weight` (VARCHAR 20, NULLABLE) - misal: 65 kg
- `physical_examination` (TEXT, NOT NULL)
- `diagnosis` (VARCHAR 255, NOT NULL)
- `action_treatment` (TEXT, NOT NULL)
- `follow_up_notes` (TEXT, NULLABLE)
- `created_at`, `updated_at` (TIMESTAMP)

### 7. `prescriptions` & `prescription_items`
Resep obat dokter dan detail obat.
- `prescriptions`:
  - `id` (BIGINT, PK)
  - `prescription_code` (VARCHAR 50, UNIQUE, NOT NULL - Contoh: RX-20261118-001)
  - `medical_record_id` (BIGINT, FK -> `medical_records.id`, ON DELETE CASCADE, UNIQUE)
  - `status` (ENUM: `'Menunggu Pengambilan'`, `'Selesai'`, `'Dibatalkan'`)
  - `dispensed_at` (TIMESTAMP, NULLABLE)
- `prescription_items`:
  - `id` (BIGINT, PK)
  - `prescription_id` (BIGINT, FK -> `prescriptions.id`, ON DELETE CASCADE)
  - `medicine_id` (BIGINT, FK -> `medicines.id`, ON DELETE RESTRICT)
  - `quantity` (INTEGER, NOT NULL)
  - `dosage_instructions` (VARCHAR 255, NOT NULL - Misal: 3x1 setelah makan)

### 8. `medicines` & `medicine_transactions`
Inventaris farmasi klinik dan audit log pergerakan stok.
- `medicines`:
  - `id` (BIGINT, PK)
  - `name` (VARCHAR 150, NOT NULL)
  - `category` (VARCHAR 100, NOT NULL)
  - `form` (VARCHAR 50, NOT NULL - Tablet, Sirup, Salep)
  - `stock` (INTEGER, NOT NULL, DEFAULT 0)
  - `min_stock_alert` (INTEGER, DEFAULT 10)
  - `description`, `dosage`, `side_effects` (TEXT, NULLABLE)
  - `image_url` (VARCHAR 255, NULLABLE)
- `medicine_transactions`:
  - `id` (BIGINT, PK)
  - `medicine_id` (BIGINT, FK -> `medicines.id`, ON DELETE CASCADE)
  - `type` (ENUM: `'masuk'`, `'keluar'`, `'penyesuaian'`)
  - `quantity` (INTEGER, NOT NULL)
  - `stock_before` (INTEGER, NOT NULL)
  - `stock_after` (INTEGER, NOT NULL)
  - `reference_type` (VARCHAR 50)
  - `reference_id` (VARCHAR 50)
  - `notes` (TEXT, NULLABLE)
  - `created_at` (TIMESTAMP)
