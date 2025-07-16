# Pairiod - 生理周期管理アプリ

女性の生理周期を管理する Web アプリケーションです。

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite (Node.js 20)
- **バックエンド**: Laravel 12 (PHP 8.2)
- **データベース**: MySQL 8.0 (Docker 環境) / SQLite (ローカル開発環境)
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

## CORS 設定

フロントエンドからバックエンドの API を呼び出すため、以下のポートが CORS で許可されています：

- `http://localhost:5173` (Vite 開発サーバー)
- `http://localhost:3000` (Create React App 用)

## 開発時の注意事項

### Docker 環境

1. `docker-compose up -d` で全てのサービスが一度に起動されます
2. データベースは MySQL を使用し、データは永続化されます
3. ファイルの変更は自動的にコンテナに反映されます

### ローカル環境

1. フロントエンドとバックエンドは別々のポートで動作します
2. API の呼び出しは `http://localhost:8000/api/` ベース URL を使用してください
3. 開発時は両方のサーバーを同時に起動してください

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

#### 1. Docker起動時のパッケージインストールエラー

```bash
# mysql-clientが見つからない場合は、Dockerfileが最新化されているか確認
# backend/Dockerfile で mariadb-client を使用している必要があります
```

#### 2. Laravel 500エラー

```bash
# .envファイルとアプリケーションキーが正しく設定されているか確認
cd backend
cp .env.example .env
php artisan key:generate

# データベースマイグレーションを実行
docker-compose exec backend php artisan migrate
```

#### 3. Node.jsバージョンの不整合

```bash
# Vite 7.0以上にはNode.js 20以上が必要です
# frontend/Dockerfile でnode:20-alpineを使用している必要があります
```

#### 4. コンテナの完全リセット

```bash
# 全てのコンテナとボリュームを削除
docker-compose down -v
docker-compose up -d --build
docker-compose exec backend php artisan migrate
```

## 開発ワークフロー

### ブランチ戦略

- `main`: 本番環境用
- `develop`: 開発環境用
- `feature/*`: 機能開発用

### コーディング規約

- **フロントエンド**: ESLint + Prettier
- **バックエンド**: PSR-12

## 次のステップ

- API エンドポイントの実装
- 生理周期トラッキング機能の実装
- ユーザー認証機能の追加
- UI/UX の改善
- テストの実装
- CI/CDパイプラインの構築
