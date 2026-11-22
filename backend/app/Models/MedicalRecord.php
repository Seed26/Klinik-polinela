<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalRecord extends Model
{
    use HasFactory;

    protected $table = 'rekam_medis';

    protected $fillable = [
        'queue_id',
        'patient_profile_id',
        'doctor_profile_id',
        'record_date',
        'complaint',
        'blood_pressure',
        'body_temperature',
        'body_weight',
        'physical_examination',
        'diagnosis',
        'action_treatment',
        'follow_up_notes',
    ];

    public function queue()
    {
        return $this->belongsTo(Queue::class);
    }

    public function patientProfile()
    {
        return $this->belongsTo(PatientProfile::class);
    }

    public function doctorProfile()
    {
        return $this->belongsTo(DoctorProfile::class);
    }

    public function prescription()
    {
        return $this->hasOne(Prescription::class);
    }
}
