<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicineTransaction extends Model
{
    use HasFactory;

    protected $table = 'transaksi_obat';

    protected $fillable = [
        'medicine_id',
        'type',
        'quantity',
        'stock_before',
        'stock_after',
        'reference_type',
        'reference_id',
        'notes',
    ];

    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }
}
