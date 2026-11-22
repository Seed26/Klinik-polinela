<?php

namespace Tests\Feature;

use App\Models\Medicine;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMedicineTransactionTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_record_medicine_stock_in_and_out(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $medicine = Medicine::create([
            'name' => 'Obat Uji',
            'category' => 'Umum',
            'form' => 'Tablet',
            'stock' => 10,
            'min_stock_alert' => 2,
        ]);

        $this->actingAs($admin)->postJson('/api/admin/medicine-transactions', [
            'medicine_id' => $medicine->id,
            'type' => 'masuk',
            'quantity' => 5,
            'notes' => 'Stok masuk',
        ])->assertCreated()->assertJsonPath('data.stock_after', 15);

        $this->actingAs($admin)->postJson('/api/admin/medicine-transactions', [
            'medicine_id' => $medicine->id,
            'type' => 'keluar',
            'quantity' => 3,
            'notes' => 'Stok keluar',
        ])->assertCreated()->assertJsonPath('data.stock_after', 12);

        $this->assertDatabaseHas('obat', ['id' => $medicine->id, 'stock' => 12]);
        $this->assertDatabaseCount('transaksi_obat', 2);
    }

    public function test_admin_cannot_record_stock_out_when_stock_is_insufficient(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $medicine = Medicine::create([
            'name' => 'Obat Stok Terbatas',
            'category' => 'Umum',
            'form' => 'Tablet',
            'stock' => 2,
            'min_stock_alert' => 1,
        ]);

        $this->actingAs($admin)->postJson('/api/admin/medicine-transactions', [
            'medicine_id' => $medicine->id,
            'type' => 'keluar',
            'quantity' => 3,
        ])->assertUnprocessable();

        $this->assertDatabaseHas('obat', ['id' => $medicine->id, 'stock' => 2]);
        $this->assertDatabaseCount('transaksi_obat', 0);
    }

    public function test_non_admin_cannot_read_or_create_admin_medicine_transactions(): void
    {
        $doctor = User::factory()->create(['role' => 'doctor', 'is_active' => true]);

        $this->actingAs($doctor)
            ->getJson('/api/admin/medicine-transactions')
            ->assertForbidden();

        $this->actingAs($doctor)
            ->postJson('/api/admin/medicine-transactions', [])
            ->assertForbidden();
    }
}
