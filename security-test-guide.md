# SQLインジェクション脆弱性テストガイド

## ⚠️ 重要注意事項
- **本番環境では絶対にテストしない**
- **開発環境またはテスト環境でのみ実行**
- **事前にデータベースをバックアップ**

## 1. 準備作業

```bash
# テスト環境のセットアップ
cp .env .env.backup
cp .env.example .env.testing

# テスト用データベースの作成
php artisan migrate:fresh --seed --env=testing
```

## 2. フロントエンドでの手動テスト

### 新規登録フォームでのテスト

**テストケース1: 名前フィールド**
```
入力: 田中'; DROP TABLE users; --
期待結果: サニタイズされて「田中 DROP TABLE users --」または拒否
```

**テストケース2: メールフィールド**
```
入力: admin'; DELETE FROM users; --@evil.com
期待結果: 無効なメール形式としてバリデーションエラー
```

**テストケース3: パスワードフィールド**
```
入力: password'; TRUNCATE TABLE menstrual_cycles; --
期待結果: 正常にハッシュ化されて保存（SQLは実行されない）
```

### 生理周期記録でのテスト

**テストケース4: メモフィールド**
```
入力: 体調良好'; INSERT INTO users (email) VALUES ('hacker@evil.com'); --
期待結果: メモとして保存されるが、SQLコマンドは実行されない
```

**テストケース5: 症状フィールド**
```
入力: ["頭痛'; DROP DATABASE pairiod; --", "腹痛"]
期待結果: 配列として正常に処理され、SQLコマンドは実行されない
```

## 3. APIでの直接テスト（Postman/curl）

### テストケース6: 生理周期作成API
```bash
curl -X POST http://localhost:8000/api/menstrual-cycles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "start_date": "2025-01-01",
    "notes": "'; DROP TABLE users; --",
    "symptoms": ["頭痛'; DELETE FROM menstrual_cycles; --"]
  }'
```

**期待結果:** 
- 422 Validation Error または 200 Success
- データベースのusersテーブルは削除されない
- menstrual_cyclesテーブルは削除されない

### テストケース7: ユーザー登録API
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'; DROP TABLE users; --",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "gender": "female"
  }'
```

## 4. テスト結果の確認方法

### データベースの整合性確認
```sql
-- テーブルが存在することを確認
SHOW TABLES;

-- ユーザーデータが正常であることを確認
SELECT id, name, email FROM users;

-- 悪意のあるデータが保存されていないことを確認
SELECT * FROM menstrual_cycles WHERE notes LIKE '%DROP%';
SELECT * FROM users WHERE name LIKE '%DROP%';
```

### ログの確認
```bash
# Laravelのログを確認
tail -f storage/logs/laravel.log

# データベースクエリログの確認（.envでDB_LOG=true設定後）
grep "DROP\|DELETE\|TRUNCATE" storage/logs/laravel.log
```

## 5. 成功の判定基準

✅ **テスト成功の条件:**
1. 悪意のあるSQLコマンドが実行されない
2. データベース構造が変更されない
3. 既存データが削除・改ざんされない
4. 適切なバリデーションエラーまたは正常処理が行われる
5. アプリケーションがクラッシュしない

❌ **テスト失敗の兆候:**
1. データベースのテーブルが削除される
2. 予期しないデータが挿入・更新される
3. アプリケーションエラーやクラッシュが発生
4. ログに実際のSQLインジェクション実行が記録される

## 6. トラブルシューティング

### 問題が発見された場合の対処
1. 即座にテストを停止
2. データベースをバックアップから復元
3. 該当するコードを修正
4. 修正後に再テストを実行

### 追加の対策が必要な場合
1. バリデーションルールの強化
2. 入力サニタイゼーションの追加
3. WAF（Web Application Firewall）の導入検討
4. セキュリティ監査ツールの導入