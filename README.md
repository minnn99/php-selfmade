# Pairiod - 生理周期管理アプリ

女性とパートナーの生理周期を管理・共有できる Web アプリケーションです。

## 機能

### 実装済み機能
- ✅ **ユーザー認証システム** (新規登録、ログイン、ログアウト)
- ✅ **生理周期記録・管理**
- ✅ **パートナー連携機能** (招待コード経由)
- ✅ **カレンダービュー** (生理日予測表示)
- ✅ **日々の症状記録**
- ✅ **統計・分析表示**
- ✅ **設定管理** (プロフィール、プライバシー、通知設定)

### 開発中・予定機能
- 🔄 **医療記録管理**
- 🔄 **妊娠記録・サポート**
- 📋 **データエクスポート機能**
- 📋 **多言語対応**

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite (Node.js 20)
- **バックエンド**: Laravel 11 (PHP 8.2)
- **データベース**: MySQL 8.0 (Docker環境)
- **認証**: Laravel Sanctum (APIトークン認証)
- **コンテナ**: Docker + Docker Compose

## プロジェクト構成

```
Pairiod/
├── frontend/          # React TypeScript Viteプロジェクト
├── backend/           # Laravel プロジェクト
├── docker-compose.yml # Docker Compose設定
└── README.md
```

## セットアップと実行方法

### Docker 環境（推奨）

#### 初回セットアップ

```bash
# プロジェクトルートディレクトリに移動
cd php-selfmade-develop

# バックエンドの依存関係をインストール（初回のみ）
cd backend
composer install
cp .env.example .env
php artisan key:generate
cd ..

# Docker Composeを実行
docker-compose up -d

# 初回のみ：データベースのマイグレーション
docker-compose exec backend php artisan migrate

# ログの確認
docker-compose logs -f
```

#### 2回目以降の起動

```bash
# 通常の起動
docker-compose up -d

# 停止
docker-compose down
```

**サービスへのアクセス:**

- **フロントエンド**: http://localhost:3000
- **バックエンド**: http://localhost:8000
- **MySQL**: localhost:3306 (ユーザー: pairiod_user / パスワード: pairiod_password)

### ローカル開発環境

#### フロントエンド (React)

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは http://localhost:5173 で動作します。

#### バックエンド (Laravel)

```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール
composer install

# 環境設定ファイルのコピー（既に作成済み）
# cp .env.example .env

# アプリケーションキーの生成（既に実行済み）
# php artisan key:generate

# データベースの作成とマイグレーション（既に実行済み）
# php artisan migrate

# 開発サーバーの起動
php artisan serve
```

バックエンドは http://localhost:8000 で動作します。

## API 設定

### CORS 設定

フロントエンドからバックエンドの API を呼び出すため、以下のオリジンが CORS で許可されています：

- `http://localhost:3000` (フロントエンドDockerコンテナ)
- `http://localhost:5173` (Vite開発サーバー)
- `http://localhost:8000` (バックエンドAPI)

### 認証システム

- **認証方式**: Laravel Sanctum APIトークン認証
- **トークン有効期限**: 8時間 (Remember Me: 7日間)
- **ストレージ**: ローカルストレージ (フロントエンド)
- **自動ログアウト**: トークン期限切れ時に自動実行

## 開発時の注意事項

### Docker 環境（推奨）

1. **統合環境**: `docker-compose up -d` で全てのサービスが一度に起動
2. **データ永続化**: MySQLコンテナのデータは永続化されます
3. **ホットリロード**: ファイル変更は自動的にコンテナに反映
4. **データベース確認**: `docker exec php-selfmade-develop-backend-1 php artisan tinker`

### データベース管理

#### Docker環境のデータベース操作
```bash
# ユーザー一覧確認
docker exec php-selfmade-develop-backend-1 php artisan tinker --execute="App\Models\User::all()"

# マイグレーション実行
docker exec php-selfmade-develop-backend-1 php artisan migrate

# データベースリセット
docker exec php-selfmade-develop-backend-1 php artisan migrate:fresh
```

### 開発環境の使い分け

- **本番開発**: Docker環境を使用（データは永続化）
- **機能テスト**: Docker環境推奨
- **デバッグ**: ローカル環境も併用可能

## Docker コマンド

```bash
# サービス停止
docker-compose down

# コンテナの再ビルド
docker-compose up -d --build

# バックエンドコンテナへのアクセス
docker-compose exec backend bash

# フロントエンドコンテナへのアクセス
docker-compose exec frontend sh

# データベースのリセット
docker-compose exec backend php artisan migrate:fresh
```

## システム要件

- **Docker**: 20.10以上
- **Docker Compose**: 2.0以上
- **Node.js**: 20以上（ローカル開発時）
- **PHP**: 8.2以上（ローカル開発時）
- **Composer**: 2.0以上（ローカル開発時）

## トラブルシューティング

### よくある問題と解決方法

#### 1. 新規アカウント登録ができない（CORSエラー）

```bash
# CORS設定の確認
# backend/config/cors.php で localhost:3000 が許可されているか確認
# backend/bootstrap/app.php でHandleCorsミドルウェアが設定されているか確認

# サーバー再起動
docker-compose restart backend
```

#### 2. データベースに登録されない

```bash
# Docker環境のデータベースを確認（ローカルMySQLではない）
docker exec php-selfmade-develop-backend-1 php artisan tinker --execute="App\Models\User::count()"

# マイグレーション確認
docker exec php-selfmade-develop-backend-1 php artisan migrate:status
```

#### 3. Laravel 500エラー

```bash
# ログ確認
docker exec php-selfmade-develop-backend-1 tail -f storage/logs/laravel.log

# キャッシュクリア
docker exec php-selfmade-develop-backend-1 php artisan cache:clear
docker exec php-selfmade-develop-backend-1 php artisan view:clear
docker exec php-selfmade-develop-backend-1 php artisan config:clear
```

#### 4. 認証トークンの問題

```bash
# ブラウザのローカルストレージクリア
# 開発者ツール → Application → Local Storage → localhost:3000 → auth_data削除

# Sanctum設定確認
docker exec php-selfmade-develop-backend-1 php artisan tinker --execute="App\Models\User::first()->tokens()->count()"
```

#### 5. コンテナの完全リセット

```bash
# 全てのコンテナとボリュームを削除
docker-compose down -v
docker-compose up -d --build
docker exec php-selfmade-develop-backend-1 php artisan migrate
```

## 開発ワークフロー

### ブランチ戦略

- `main`: 本番環境用
- `develop`: 開発環境用
- `feature/*`: 機能開発用

### コーディング規約

- **フロントエンド**: ESLint + Prettier
- **バックエンド**: PSR-12

## 開発状況

### 完了済み
- ✅ **Docker環境構築** (フロントエンド、バックエンド、MySQL)
- ✅ **ユーザー認証API** (新規登録、ログイン、ログアウト)
- ✅ **CORS設定** (フロントエンド⇔バックエンド通信)
- ✅ **データベース設計** (ユーザー、生理周期、症状記録等)
- ✅ **フロントエンド基盤** (React + TypeScript + Vite)
- ✅ **認証システム** (Sanctum APIトークン認証)
- ✅ **CI/CDパイプライン** (GitHub Actions)

### 次のステップ
- 🔄 **UI/UXの改善** (レスポンシブデザイン対応)
- 📋 **テストケース実装** (Unit, Integration Tests)
- 📋 **パフォーマンス最適化**
- 📋 **セキュリティ強化** (CSRFトークン、レート制限)
- 📋 **CD（継続的デプロイ）** 本番環境構築後に追加
- 📋 **本番環境デプロイ準備**

## CI/CD パイプライン

### 🔄 実装済みCI機能

- **フロントエンドCI** (`.github/workflows/frontend.yml`)
  - Node.js 20での動作確認
  - TypeScriptタイプチェック
  - ESLintコードスタイルチェック
  - Viteビルド確認
  - バンドルサイズ測定

- **バックエンドCI** (`.github/workflows/backend.yml`)
  - PHP 8.2での動作確認
  - Composerパッケージインストール
  - MySQLデータベーステスト
  - PHPStanコード品質チェック
  - Laravel Artisanコマンド確認

- **統合CI** (`.github/workflows/ci.yml`)
  - Docker Composeビルドテスト
  - セキュリティ脆弱性スキャン (Trivy)
  - 変更ファイル検出による最適化実行

### 🚀 CI実行タイミング

- `main`、`develop`ブランチへのプッシュ
- Pull Request作成時
- 該当ディレクトリのファイル変更時のみ実行（最適化）

## 貢献方法

1. このリポジトリをフォーク
2. feature ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. Pull Request を作成

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
