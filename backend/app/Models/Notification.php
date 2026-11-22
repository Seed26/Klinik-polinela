<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $table = 'notifikasi';

    protected $fillable = [
        'created_by_user_id',
        'title',
        'message',
        'target_role',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function recipients()
    {
        return $this->hasMany(NotificationRecipient::class);
    }
}
