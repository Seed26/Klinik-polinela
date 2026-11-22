<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\DoctorSchedule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PublicScheduleEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_schedule_endpoint_returns_only_active_schedule_records_from_renamed_tables(): void
    {
        $doctorUser = User::factory()->create(['name' => 'Dokter Aktif', 'role' => 'doctor']);
        $doctor = DoctorProfile::create([
            'user_id' => $doctorUser->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
            'clinic_type' => 'Poli Umum',
        ]);
        DoctorSchedule::create([
            'doctor_profile_id' => $doctor->id,
            'day' => 'Senin',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'is_active' => true,
        ]);

        $this->getJson('/api/public/schedules')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.doctor_profile.user.name', 'Dokter Aktif');

        $this->assertSame(1, DB::table('jadwal_dokter')->count());
        $this->assertSame(1, DB::table('profil_dokter')->count());
    }

    public function test_public_schedule_endpoint_returns_empty_list_when_no_active_schedule_exists(): void
    {
        $this->getJson('/api/public/schedules')
            ->assertOk()
            ->assertExactJson(['success' => true, 'data' => []]);
    }

    public function test_public_schedule_endpoint_returns_active_schedule_and_doctor_name_without_authentication(): void
    {
        $doctorUser = User::factory()->create([
            'name' => 'Nama Dokter Terdaftar',
            'role' => 'doctor',
        ]);
        $doctor = DoctorProfile::create([
            'user_id' => $doctorUser->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
            'clinic_type' => 'Poli Umum',
        ]);

        DoctorSchedule::create([
            'doctor_profile_id' => $doctor->id,
            'day' => 'Senin',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'is_active' => true,
        ]);

        DoctorSchedule::create([
            'doctor_profile_id' => $doctor->id,
            'day' => 'Selasa',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'is_active' => false,
        ]);

        $this->getJson('/api/public/schedules')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.day', 'Senin')
            ->assertJsonPath('data.0.doctor_profile.user.name', 'Nama Dokter Terdaftar')
            ->assertJsonPath('data.0.doctor_profile.clinic_type', 'Poli Umum')
            ->assertJsonPath('data.0.is_active', true);
    }
}
