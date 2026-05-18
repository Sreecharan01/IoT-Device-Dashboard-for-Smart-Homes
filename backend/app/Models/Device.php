<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'device_uid',
        'name',
        'type',
        'location',
        'status',
        'state',
        'connection',
        'geofence_enabled',
        'satellite_support',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'state' => 'array',
            'geofence_enabled' => 'boolean',
            'satellite_support' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
