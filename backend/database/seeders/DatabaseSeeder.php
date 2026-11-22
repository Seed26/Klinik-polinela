<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Hanya data dummy minimal untuk kebutuhan local development / testing.
     * JANGAN gunakan di lingkungan production.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin Demo',
            'email' => 'admin.demo@example.test',
            'password' => Hash::make('change-me-local'),
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Dokter Demo',
            'email' => 'doctor.demo@example.test',
            'password' => Hash::make('change-me-local'),
            'role' => 'doctor',
        ]);
    }
}
