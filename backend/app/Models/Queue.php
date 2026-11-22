<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Queue extends Model
{
    use HasFactory;

    protected $table = 'antrean';

    protected $fillable = [
        'queue_number',
        'patient_profile_id',
        'doctor_profile_id',
        'visit_date',
        'estimated_time',
        'status',
        'complaint',
    ];

    public function patientProfile()
    {
        return $this->belongsTo(PatientProfile::class);
    }

    public function doctorProfile()
    {
        return $this->belongsTo(DoctorProfile::class);
    }

    public function medicalRecord()
    {
        return $this->hasOne(MedicalRecord::class);
    }
}
