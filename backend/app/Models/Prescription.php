<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    use HasFactory;

    protected $table = 'resep';

    protected $fillable = [
        'prescription_code',
        'medical_record_id',
        'status',
        'dispensed_at',
    ];

    protected $casts = [
        'dispensed_at' => 'datetime',
    ];

    public function medicalRecord()
    {
        return $this->belongsTo(MedicalRecord::class);
    }

    public function items()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
