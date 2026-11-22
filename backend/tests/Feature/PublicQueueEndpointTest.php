<?php

namespace Tests\Feature;

use App\Models\DoctorProfile;
use App\Models\PatientProfile;
use App\Models\Queue;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicQueueEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_queue_endpoint_returns_privacy_safe_queue_summary_without_authentication(): void
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = DoctorProfile::create([
            'user_id' => $doctorUser->id,
            'sip_number' => fake()->unique()->numerify('SIP-########'),
            'clinic_type' => 'Poli Umum',
        ]);
        $patientUser = User::factory()->create(['role' => 'patient']);
        $patient = PatientProfile::create([
            'user_id' => $patientUser->id,
            'identifier_number' => fake()->unique()->numerify('##########'),
        ]);

        Queue::create([
            'queue_number' => 'A-001',
            'patient_profile_id' => $patient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => now()->toDateString(),
            'status' => 'Diperiksa',
        ]);
        $secondPatientUser = User::factory()->create(['role' => 'patient']);
        $secondPatient = PatientProfile::create([
            'user_id' => $secondPatientUser->id,
            'identifier_number' => fake()->unique()->numerify('##########'),
        ]);
        Queue::create([
            'queue_number' => 'A-002',
            'patient_profile_id' => $secondPatient->id,
            'doctor_profile_id' => $doctor->id,
            'visit_date' => now()->toDateString(),
            'status' => 'Menunggu',
        ]);

        $this->getJson('/api/public/queues')
            ->assertOk()
            ->assertJsonPath('data.currently_served', 'A-001')
            ->assertJsonPath('data.waiting_count', 1)
            ->assertJsonPath('data.queues.0.service_type', 'Poli Umum')
            ->assertJsonMissingPath('data.queues.0.patient_profile')
            ->assertJsonMissingPath('data.queues.0.complaint')
            ->assertJsonMissingPath('data.queues.0.doctor_profile')
            ->assertJsonMissingPath('data.queues.0.patient_profile_id')
            ->assertJsonMissingPath('data.queues.0.doctor_profile_id');
    }

    public function test_public_queue_endpoint_returns_empty_message_data_when_no_queue_exists(): void
    {
        $this->getJson('/api/public/queues')
            ->assertOk()
            ->assertJsonPath('data.currently_served', null)
            ->assertJsonPath('data.waiting_count', 0)
            ->assertJsonPath('data.queues', []);
    }
}
