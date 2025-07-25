<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PartnerRelationship extends Model
{
    protected $fillable = [
        'female_user_id',
        'male_user_id',
        'invite_code',
        'status',
        'connected_at',
    ];

    protected $casts = [
        'connected_at' => 'datetime',
    ];

    // 女性ユーザー（招待者）
    public function femaleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'female_user_id');
    }

    // 男性ユーザー（参加者）
    public function maleUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'male_user_id');
    }

    // パートナーユーザーを取得（現在のユーザーに対する相手）
    public function getPartnerUser(int $currentUserId): ?User
    {
        if ($this->female_user_id === $currentUserId) {
            return $this->maleUser;
        } elseif ($this->male_user_id === $currentUserId) {
            return $this->femaleUser;
        }
        return null;
    }

    // 招待コードを生成
    public static function generateInviteCode(): string
    {
        do {
            $code = strtoupper(substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 6));
        } while (self::where('invite_code', $code)->exists());
        
        return $code;
    }
}
