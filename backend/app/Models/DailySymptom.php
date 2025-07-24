<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailySymptom extends Model
{
    protected $fillable = [
        'user_id',
        'symptom_date',
        'symptoms_data',
    ];

    protected $casts = [
        'symptom_date' => 'date',
        'symptoms_data' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
