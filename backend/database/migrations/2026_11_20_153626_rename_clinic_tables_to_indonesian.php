<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableNames = [
            'doctor_profiles' => 'profil_dokter',
            'patient_profiles' => 'profil_pasien',
            'doctor_schedules' => 'jadwal_dokter',
            'medicines' => 'obat',
            'queues' => 'antrean',
            'medical_records' => 'rekam_medis',
            'prescriptions' => 'resep',
            'prescription_items' => 'item_resep',
            'medicine_transactions' => 'transaksi_obat',
            'notifications' => 'notifikasi',
            'notification_recipients' => 'penerima_notifikasi',
        ];

        foreach ($tableNames as $oldName => $newName) {
            if (Schema::hasTable($oldName) && ! Schema::hasTable($newName)) {
                Schema::rename($oldName, $newName);
            }
        }
    }

    public function down(): void
    {
        $tableNames = [
            'penerima_notifikasi' => 'notification_recipients',
            'notifikasi' => 'notifications',
            'transaksi_obat' => 'medicine_transactions',
            'item_resep' => 'prescription_items',
            'resep' => 'prescriptions',
            'rekam_medis' => 'medical_records',
            'antrean' => 'queues',
            'obat' => 'medicines',
            'jadwal_dokter' => 'doctor_schedules',
            'profil_pasien' => 'patient_profiles',
            'profil_dokter' => 'doctor_profiles',
        ];

        foreach ($tableNames as $oldName => $newName) {
            if (Schema::hasTable($oldName) && ! Schema::hasTable($newName)) {
                Schema::rename($oldName, $newName);
            }
        }
    }
};
