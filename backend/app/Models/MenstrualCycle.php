<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenstrualCycle extends Model
{
    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'flow_intensity',
        'symptoms',
        'notes'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'symptoms' => 'array'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getDurationAttribute(): ?int
    {
        if ($this->end_date) {
            return $this->start_date->diffInDays($this->end_date) + 1;
        }
        return null;
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->end_date === null;
    }
}
