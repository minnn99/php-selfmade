<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PregnancyRecord extends Model
{
    protected $fillable = [
        'user_id',
        'start_date',
        'records_data',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'records_data' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
