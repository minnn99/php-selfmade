<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('partner_relationships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('female_user_id')->constrained('users')->onDelete('cascade'); // 女性ユーザー（招待者）
            $table->foreignId('male_user_id')->nullable()->constrained('users')->onDelete('cascade'); // 男性ユーザー（参加者）
            $table->string('invite_code', 6)->unique(); // 招待コード
            $table->enum('status', ['pending', 'connected', 'disconnected'])->default('pending');
            $table->timestamp('connected_at')->nullable(); // 連携開始日時
            $table->timestamps();
            
            // インデックス
            $table->index(['female_user_id', 'status']);
            $table->index(['male_user_id', 'status']);
            $table->index('invite_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_relationships');
    }
};
