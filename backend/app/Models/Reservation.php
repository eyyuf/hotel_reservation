<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Reservation extends Model
{
    use HasFactory;

    protected $fillable = ['check_in_date', 'check_out_date', 'number_of_rooms', 'adults', 'children', 'special_requests'];

    protected function casts(): array
    {
        return [
            'check_in_date' => 'date',
            'check_out_date' => 'date',
            'number_of_rooms' => 'integer',
            'adults' => 'integer',
            'children' => 'integer',
            'nightly_rate' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'guest_user_id');
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
