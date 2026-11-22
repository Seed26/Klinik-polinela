# ALUR BISNIS & SISTEM KLINIK POLINELA

Dokumen ini memetakan alur bisnis terpadu antara **Admin Klinik**, **Dokter**, dan **Pasien (Civitas Polinela)**.

---

## 1. ALUR PENDAFTARAN & PELAYANAN ANTREAN (END-TO-END)

```text
[ PASIEN ]                              [ ADMIN KLINIK ]                       [ DOKTER JAGA ]
    |                                           |                                     |
    |-- 1. Login menggunakan NIM/NIP/Email ---->|                                     |
    |-- 2. Pilih Poli & Jadwal Dokter --------->|                                     |
    |-- 3. Ajukan Antrean (Keluhan) ----------->|                                     |
    |   (Sistem memvalidasi: maks 1/hari)       |                                     |
    |   (Nomor dibuat: Misal A-004)             |                                     |
    |                                           |-- 4. Notifikasi Antrean Baru Masuk  |
    |                                           |-- 5. Konfirmasi data pasien ------->|
    |                                           |   (Status: 'Menunggu')              |
    |                                           |                                     |
    |<-- 6. Pasien Unduh Bukti Tiket PDF -------|                                     |
    |                                                                                 |
    |-- 7. Pasien datang ke klinik saat giliran ------------------------------------->|
    |                                                                                 |-- 8. Panggil Pasien
    |                                                                                 |   (Status: 'Diperiksa')
    |                                                                                 |-- 9. Anamnesa & Tanda Vital
    |                                                                                 |-- 10. Diagnosis & Tindakan
    |                                                                                 |-- 11. Buat Resep Obat Elektronik
    |                                                                                 |-- 12. Selesaikan Pemeriksaan
    |                                                                                 |   (Status: 'Selesai')
    |                                                                                 |   (Stok obat otomatis terpotong)
    |<-- 13. Pasien melihat Rekam Medis & Resep di portal ----------------------------|
```

---

## 2. ATURAN BISNIS SISTEM (BUSINESS RULES)

1. **Aturan Antrean Pasien**:
   - Satu pasien hanya diperbolehkan memiliki **maksimal 1 antrean aktif pada tanggal yang sama**.
   - Pasien hanya dapat membatalkan antrean apabila statusnya masih `Menunggu`. Jika status sudah `Diperiksa`, antrean tidak dapat dibatalkan.
   - Nomor antrean berformat prefiks huruf dan angka urut per hari (`A-001`, `A-002`, dst.) dan di-reset setiap pergantian tanggal.
2. **Aturan Dokter & Pemeriksaan**:
   - Penugasan dokter jaga pada hari tertentu diatur oleh Admin melalui menu *Jadwal Dokter*.
   - Dokter hanya berwenang memeriksa dan mengakses riwayat rekam medis pasien yang antreannya ditugaskan kepadanya.
   - Resep obat hanya dapat diterbitkan oleh Dokter terdaftar pada saat proses pemeriksaan berlangsung.
3. **Aturan Pengelolaan Obat & Stok**:
   - Setiap obat memiliki batas peringatan stok minimum (`min_stock_alert`).
   - Penyerahan obat resep memicu pencatatan mutasi di `medicine_transactions` dengan referensi ID resep.
   - Stok tidak boleh bernilai negatif; sistem backend menolak penyimpanan resep jika kuantitas melebihi stok yang tersedia.
4. **Aturan Notifikasi Siaran**:
   - Admin dapat menyiarkan informasi kesehatan atau pengumuman libur operasional klinik ke seluruh civitas akademika atau role tertentu.
   - Status baca (`is_read`) dicatat per pengguna di tabel `notification_recipients`.
