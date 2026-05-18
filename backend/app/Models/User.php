<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'subscription',
        'electricity_price',
        'home_size',
        'currency',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'electricity_price' => 'float',
            'home_size' => 'integer',
        ];
    }

    public function devices()
    {
        return $this->hasMany(Device::class);
    }

    public function alerts()
    {
        return $this->hasMany(Alert::class, 'author_id');
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}
