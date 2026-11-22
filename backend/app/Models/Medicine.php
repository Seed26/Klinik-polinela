<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    use HasFactory;

    protected $table = 'obat';

    protected $fillable = [
        'name',
        'category',
        'form',
        'stock',
        'min_stock_alert',
        'description',
        'dosage',
        'side_effects',
        'image_url',
    ];

    public function transactions()
    {
        return $this->hasMany(MedicineTransaction::class);
    }

    public function prescriptionItems()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
