<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\MedicalRecord;
use App\Models\Medicine;
use App\Models\MedicineTransaction;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\PatientProfile;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RenameClinicTablesTest extends TestCase
{
    use RefreshDatabase;

    public function test_clinic_models_use_indonesian_table_names_and_keep_relationships(): void
    {
        $expectedTables = [
            DoctorProfile::class => 'profil_dokter',
            PatientProfile::class => 'profil_pasien',
            DoctorSchedule::class => 'jadwal_dokter',
            Medicine::class => 'obat',
            Queue::class => 'antrean',
            MedicalRecord::class => 'rekam_medis',
            Prescription::class => 'resep',
            PrescriptionItem::class => 'item_resep',
            MedicineTransaction::class => 'transaksi_obat',
            Notification::class => 'notifikasi',
            NotificationRecipient::class => 'penerima_notifikasi',
        ];

        foreach ($expectedTables as $modelClass => $tableName) {
            $this->assertSame($tableName, (new $modelClass)->getTable());
            $this->assertTrue(DB::getSchemaBuilder()->hasTable($tableName));
        }

        $this->assertTrue(DB::getSchemaBuilder()->hasTable('users'));
        $this->assertTrue(DB::getSchemaBuilder()->hasTable('cache'));
        $this->assertTrue(DB::getSchemaBuilder()->hasTable('jobs'));
    }

    public function test_indonesian_table_models_preserve_profile_and_schedule_relationships(): void
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = DoctorProfile::create([
            'user_id' => $doctorUser->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
        ]);
        DoctorSchedule::create([
            'doctor_profile_id' => $doctor->id,
            'day' => 'Senin',
            'start_time' => '08:00',
            'end_time' => '12:00',
        ]);

        $patientUser = User::factory()->create(['role' => 'patient']);
        $patient = PatientProfile::create([
            'user_id' => $patientUser->id,
            'identifier_number' => fake()->unique()->numerify('########'),
            'civitas_type' => 'mahasiswa',
        ]);
        Medicine::create([
            'name' => 'Obat uji',
            'category' => 'Uji',
            'form' => 'Tablet',
            'stock' => 2,
            'min_stock_alert' => 1,
        ]);

        $this->assertSame($doctorUser->id, $doctor->fresh()->user->id);
        $this->assertSame(1, $doctor->schedules()->count());
        $this->assertSame($patientUser->id, $patient->fresh()->user->id);
        $this->assertSame(1, Medicine::query()->count());

        $this->assertSame(0, Notification::query()->count());
        $this->assertSame(0, NotificationRecipient::query()->count());
        $this->assertSame(0, MedicineTransaction::query()->count());
    }

    public function test_patient_registration_and_doctor_queue_validation_use_renamed_tables(): void
    {
        $identifierNumber = 'TEST-'.fake()->unique()->numerify('########');

        $this->postJson('/api/auth/register', [
            'name' => 'Pasien Uji',
            'email' => 'pasien-uji-'.fake()->unique()->numerify('#####').'@example.test',
            'password' => 'PatientTest123!',
            'password_confirmation' => 'PatientTest123!',
            'identifier_number' => $identifierNumber,
            'civitas_type' => 'mahasiswa',
        ])->assertCreated();

        $this->assertDatabaseHas('profil_pasien', [
            'identifier_number' => $identifierNumber,
        ]);

        $doctor = DoctorProfile::create([
            'user_id' => User::factory()->create(['role' => 'doctor'])->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
        ]);
        $user = User::factory()->create(['role' => 'patient', 'is_active' => true]);
        $patient = PatientProfile::create([
            'user_id' => $user->id,
            'identifier_number' => fake()->unique()->numerify('########'),
            'civitas_type' => 'mahasiswa',
        ]);

        $this->actingAs($user)->postJson('/api/patient/queues', [
            'doctor_profile_id' => $doctor->id,
            'visit_date' => now()->addDay()->toDateString(),
            'complaint' => 'Keluhan uji fiktif',
        ])->assertCreated();

        $this->assertDatabaseHas('antrean', [
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
        ]);

        $this->assertSame(1, Queue::query()->count());
    }
}
