<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Schema;

class SqlInjectionTest extends TestCase
{
    use RefreshDatabase, WithFaker;
    
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // テスト用ユーザーを作成
        $this->user = User::factory()->create([
            'name' => 'テストユーザー',
            'furigana' => 'テストユーザー',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
            'gender' => 'female',
            'phone' => '09012345678'
        ]);
    }

    /**
     * @test
     * 生理周期作成APIでのSQLインジェクション攻撃テスト
     */
    public function it_prevents_sql_injection_in_menstrual_cycle_creation()
    {
        Sanctum::actingAs($this->user);

        // SQLインジェクション攻撃パターンをテスト
        $maliciousInputs = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --",
            "<script>alert('xss')</script>",
            "'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --"
        ];

        foreach ($maliciousInputs as $maliciousInput) {
            $response = $this->postJson('/api/menstrual-cycles', [
                'start_date' => '2025-01-01',
                'notes' => $maliciousInput,
                'symptoms' => [$maliciousInput]
            ]);

            // データベースが破損していないことを確認
            $this->assertDatabaseHas('users', [
                'email' => 'test@example.com'
            ]);

            // 悪意のあるデータが保存されていないことを確認
            $this->assertDatabaseMissing('menstrual_cycles', [
                'notes' => $maliciousInput
            ]);

            // レスポンスが正常（バリデーションエラーまたは成功）であることを確認
            $this->assertTrue(
                $response->status() === 200 || 
                $response->status() === 201 || 
                $response->status() === 422 ||
                $response->status() === 400,
                "Response status was: {$response->status()}, Response content: " . $response->content()
            );
        }
    }

    /**
     * @test
     * ユーザー登録APIでのSQLインジェクション攻撃テスト
     */
    public function it_prevents_sql_injection_in_user_registration()
    {
        $maliciousInputs = [
            "admin'; DROP TABLE users; --",
            "test' OR '1'='1' --",
            "'; SELECT password FROM users WHERE email='admin@test.com'; --"
        ];

        foreach ($maliciousInputs as $maliciousInput) {
            $response = $this->postJson('/api/register', [
                'name' => $maliciousInput,
                'furigana' => 'テスト',
                'gender' => 'female',
                'phone' => '09012345678',
                'email' => 'test' . time() . '@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123'
            ]);

            // 初期ユーザーが残っていることを確認
            $this->assertDatabaseHas('users', [
                'email' => 'test@example.com'
            ]);

            // 悪意のあるデータでユーザーが作成されていないことを確認
            $this->assertDatabaseMissing('users', [
                'name' => $maliciousInput
            ]);
        }
    }

    /**
     * @test
     * パートナー招待コード生成でのSQLインジェクション攻撃テスト
     */
    public function it_prevents_sql_injection_in_partner_invitation()
    {
        Sanctum::actingAs($this->user);

        // 悪意のあるデータを含むパートナー接続試行
        $maliciousCode = "'; DROP TABLE users; --";
        
        $response = $this->postJson('/api/partner/connect', [
            'invitation_code' => $maliciousCode
        ]);

        // データベースが破損していないことを確認
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com'
        ]);

        // レスポンスが適切なエラーまたは処理結果であることを確認
        $this->assertTrue($response->status() >= 400);
    }

    /**
     * @test
     * データベース構造が変更されていないことを確認
     */
    public function it_maintains_database_structure_after_attacks()
    {
        Sanctum::actingAs($this->user);

        // 複数の攻撃を実行
        $attacks = [
            ['endpoint' => '/api/menstrual-cycles', 'data' => ['start_date' => '2025-01-01', 'notes' => "'; DROP TABLE users; --"]],
            ['endpoint' => '/api/user-data/settings', 'data' => ['settings' => ['userProfile' => ['nickname' => "'; DELETE FROM users; --"]]]],
        ];

        foreach ($attacks as $attack) {
            $this->postJson($attack['endpoint'], $attack['data']);
        }

        // 重要なテーブルが存在することを確認
        $this->assertTrue(Schema::hasTable('users'));
        $this->assertTrue(Schema::hasTable('menstrual_cycles'));
        $this->assertTrue(Schema::hasTable('partner_relationships'));

        // テストユーザーが残っていることを確認
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com'
        ]);
    }
}