<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAccessAndCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $doctor;

    private DoctorProfile $doctorProfile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);
        $this->doctorProfile = DoctorProfile::create([
            'user_id' => $this->doctor->id,
            'sip_number' => 'SIP-TEST-999',
            'specialization' => 'Dokter Umum',
            'clinic_type' => 'Poli Umum',
        ]);
    }

    public function test_guest_cannot_access_admin_routes(): void
    {
        $this->getJson('/api/admin/dashboard/stats')->assertUnauthorized();
        $this->getJson('/api/admin/queues')->assertUnauthorized();
        $this->getJson('/api/admin/schedules')->assertUnauthorized();
        $this->postJson('/api/admin/schedules', [])->assertUnauthorized();
        $this->getJson('/api/admin/notifications')->assertUnauthorized();
        $this->postJson('/api/admin/notifications', [])->assertUnauthorized();
        $this->getJson('/api/admin/medicines')->assertUnauthorized();
    }

    public function test_doctor_cannot_access_admin_routes(): void
    {
        $this->actingAs($this->doctor)->getJson('/api/admin/dashboard/stats')->assertForbidden();
        $this->actingAs($this->doctor)->getJson('/api/admin/queues')->assertForbidden();
        $this->actingAs($this->doctor)->getJson('/api/admin/schedules')->assertForbidden();
        $this->actingAs($this->doctor)->postJson('/api/admin/schedules', [
            'doctor_profile_id' => $this->doctorProfile->id,
            'day' => 'Senin',
            'start_time' => '08:00',
            'end_time' => '12:00',
        ])->assertForbidden();
        $this->actingAs($this->doctor)->getJson('/api/admin/notifications')->assertForbidden();
        $this->actingAs($this->doctor)->getJson('/api/admin/medicines')->assertForbidden();
    }

    public function test_admin_can_perform_crud_on_doctor_schedules(): void
    {
        // 1. Create Schedule
        $storeResponse = $this->actingAs($this->admin)->postJson('/api/admin/schedules', [
            'doctor_profile_id' => $this->doctorProfile->id,
            'day' => 'Senin',
            'start_time' => '08:00',
            'end_time' => '12:00',
            'is_active' => true,
        ]);

        $storeResponse->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.day', 'Senin')
            ->assertJsonPath('data.doctor_profile_id', $this->doctorProfile->id);

        $scheduleId = $storeResponse->json('data.id');
        $this->assertDatabaseHas('jadwal_dokter', [
            'id' => $scheduleId,
            'day' => 'Senin',
            'is_active' => true,
        ]);

        // 2. Read Schedules
        $this->actingAs($this->admin)->getJson('/api/admin/schedules')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');

        // 3. Update Schedule
        $updateResponse = $this->actingAs($this->admin)->putJson("/api/admin/schedules/{$scheduleId}", [
            'day' => 'Selasa',
            'start_time' => '09:00',
            'end_time' => '13:00',
            'is_active' => false,
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.day', 'Selasa')
            ->assertJsonPath('data.is_active', false);

        $this->assertDatabaseHas('jadwal_dokter', [
            'id' => $scheduleId,
            'day' => 'Selasa',
            'is_active' => false,
        ]);

        // 4. Delete Schedule
        $this->actingAs($this->admin)->deleteJson("/api/admin/schedules/{$scheduleId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('jadwal_dokter', ['id' => $scheduleId]);
    }

    public function test_admin_can_broadcast_notification_and_create_recipients(): void
    {
        $patient = User::factory()->create(['role' => 'patient', 'is_active' => true]);

        $response = $this->actingAs($this->admin)->postJson('/api/admin/notifications', [
            'title' => 'Pengumuman Jadwal Libur',
            'message' => 'Layanan klinik libur pada hari libur nasional.',
            'target_role' => 'all',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'Pengumuman Jadwal Libur');

        $notifId = $response->json('data.id');

        $this->assertDatabaseHas('notifikasi', [
            'id' => $notifId,
            'title' => 'Pengumuman Jadwal Libur',
            'target_role' => 'all',
        ]);

        // Pastikan penerima dibuat untuk semua user aktif
        $this->assertDatabaseHas('penerima_notifikasi', [
            'notification_id' => $notifId,
            'user_id' => $this->doctor->id,
        ]);
        $this->assertDatabaseHas('penerima_notifikasi', [
            'notification_id' => $notifId,
            'user_id' => $patient->id,
        ]);

        // Read notifications list
        $this->actingAs($this->admin)->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }
}
