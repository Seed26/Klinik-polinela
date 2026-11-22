<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Profil Dokter
        Schema::create('profil_dokter', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('sip_number')->unique();
            $table->string('specialization')->default('Dokter Umum');
            $table->string('clinic_type')->default('Poli Umum');
            $table->text('bio')->nullable();
            $table->timestamps();
        });

        // 2. Profil Pasien Civitas
        Schema::create('profil_pasien', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('identifier_number')->unique(); // NIM atau NIP
            $table->enum('civitas_type', ['mahasiswa', 'dosen', 'tendik'])->default('mahasiswa');
            $table->string('study_program')->nullable();
            $table->integer('age')->nullable();
            $table->text('allergy_history')->nullable();
            $table->timestamps();
        });

        // 3. Jadwal Dokter
        Schema::create('jadwal_dokter', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_profile_id')->constrained('profil_dokter')->cascadeOnDelete();
            $table->enum('day', ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']);
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Obat Inventaris
        Schema::create('obat', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->string('form'); // Tablet, Kapsul, Sirup, Salep, dll
            $table->integer('stock')->default(0);
            $table->integer('min_stock_alert')->default(10);
            $table->text('description')->nullable();
            $table->text('dosage')->nullable();
            $table->text('side_effects')->nullable();
            $table->string('image_url')->nullable();
            $table->timestamps();
        });

        // 5. Antrean Pasien
        Schema::create('antrean', function (Blueprint $table) {
            $table->id();
            $table->string('queue_number'); // format A-001
            $table->foreignId('patient_profile_id')->constrained('profil_pasien')->restrictOnDelete();
            $table->foreignId('doctor_profile_id')->nullable()->constrained('profil_dokter')->nullOnDelete();
            $table->date('visit_date');
            $table->time('estimated_time')->nullable();
            $table->enum('status', ['Menunggu', 'Diperiksa', 'Selesai', 'Dibatalkan'])->default('Menunggu');
            $table->text('complaint')->nullable();
            $table->timestamps();

            // Mencegah antrean ganda pasien pada tanggal kunjungan yang sama
            $table->unique(['patient_profile_id', 'visit_date']);
        });

        // 6. Rekam Medis (Medical Records)
        Schema::create('rekam_medis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('queue_id')->constrained('antrean')->restrictOnDelete()->unique();
            $table->foreignId('patient_profile_id')->constrained('profil_pasien')->restrictOnDelete();
            $table->foreignId('doctor_profile_id')->constrained('profil_dokter')->restrictOnDelete();
            $table->date('record_date');
            $table->text('complaint');
            $table->string('blood_pressure')->nullable();
            $table->string('body_temperature')->nullable();
            $table->string('body_weight')->nullable();
            $table->text('physical_examination');
            $table->string('diagnosis');
            $table->text('action_treatment');
            $table->text('follow_up_notes')->nullable();
            $table->timestamps();
        });

        // 7. Resep Elektronik (Prescriptions)
        Schema::create('resep', function (Blueprint $table) {
            $table->id();
            $table->string('prescription_code')->unique(); // RX-20261118-001
            $table->foreignId('medical_record_id')->constrained('rekam_medis')->cascadeOnDelete()->unique();
            $table->enum('status', ['Menunggu Pengambilan', 'Selesai', 'Dibatalkan'])->default('Menunggu Pengambilan');
            $table->timestamp('dispensed_at')->nullable();
            $table->timestamps();
        });

        // 8. Item Resep Obat
        Schema::create('item_resep', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('resep')->cascadeOnDelete();
            $table->foreignId('medicine_id')->constrained('obat')->restrictOnDelete();
            $table->integer('quantity');
            $table->string('dosage_instructions'); // 3x1 setelah makan
            $table->timestamps();
        });

        // 9. Mutasi Stok Obat (Audit Log Farmasi)
        Schema::create('transaksi_obat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medicine_id')->constrained('obat')->cascadeOnDelete();
            $table->enum('type', ['masuk', 'keluar', 'penyesuaian']);
            $table->integer('quantity');
            $table->integer('stock_before');
            $table->integer('stock_after');
            $table->string('reference_type')->nullable(); // resep, pengadaan, expired
            $table->string('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 10. Notifikasi Broadcast
        Schema::create('notifikasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('message');
            $table->enum('target_role', ['all', 'patient', 'doctor'])->default('patient');
            $table->timestamps();
        });

        // 11. Penerima Notifikasi (Status Baca)
        Schema::create('penerima_notifikasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notification_id')->constrained('notifikasi')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penerima_notifikasi');
        Schema::dropIfExists('notifikasi');
        Schema::dropIfExists('transaksi_obat');
        Schema::dropIfExists('item_resep');
        Schema::dropIfExists('resep');
        Schema::dropIfExists('rekam_medis');
        Schema::dropIfExists('antrean');
        Schema::dropIfExists('obat');
        Schema::dropIfExists('jadwal_dokter');
        Schema::dropIfExists('profil_pasien');
        Schema::dropIfExists('profil_dokter');
    }
};
