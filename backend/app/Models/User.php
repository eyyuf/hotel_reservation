<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory;
    use Notifiable;

    protected $fillable = ['first_name', 'last_name', 'email', 'phone', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return ['password' => 'hashed'];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function createdUsers(): HasMany
    {
        return $this->hasMany(User::class, 'created_by_user_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'guest_user_id');
    }

    public function createdReservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'created_by_user_id');
    }

    public function recordedPayments(): HasMany
    {
        return $this->hasMany(Payment::class, 'recorded_by_user_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
