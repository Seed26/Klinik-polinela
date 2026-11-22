<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DoctorSchedule extends Model
{
    use HasFactory;

    protected $table = 'jadwal_dokter';

    protected $fillable = [
        'doctor_profile_id',
        'day',
        'start_time',
        'end_time',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function doctorProfile()
    {
        return $this->belongsTo(DoctorProfile::class);
    }
}
