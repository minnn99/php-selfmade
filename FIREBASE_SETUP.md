# Firebase FCM 本番環境セットアップ手順

## 前提条件

1. Firebaseプロジェクトが作成されている
2. Firebase Console で Cloud Messaging が有効化されている
3. Firebase サービスアカウントキーが生成されている

## 環境変数設定

### フロントエンド（.env）
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

### バックエンド（.env）
```env
# Firebase Configuration for Backend
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CREDENTIALS_PATH=/path/to/service-account-key.json
FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
```

## サービスアカウント設定

1. Firebase Console → プロジェクト設定 → サービスアカウント
2. "新しい秘密鍵の生成" をクリック
3. JSONファイルをダウンロード
4. サーバーの安全な場所に配置
5. `FIREBASE_CREDENTIALS_PATH` で指定

## VAPID キー設定

1. Firebase Console → プロジェクト設定 → Cloud Messaging
2. "ウェブ構成" セクションでキーペアを生成
3. 公開鍵を `VITE_FIREBASE_VAPID_KEY` に設定

## Service Worker 配置

`public/firebase-messaging-sw.js` が正しく配置されていることを確認。
実際の Firebase 設定値に更新が必要：

```javascript
firebase.initializeApp({
  apiKey: "実際のAPIキー",
  authDomain: "実際のドメイン",
  // ... 他の設定
});
```

## データベースマイグレーション

```bash
php artisan migrate
```

FCMトークンと通知設定用のカラムが追加されます：
- `fcm_token`
- `notification_settings`
- `last_notification_sent_at`

## スケジューラー設定

### 開発環境
```bash
php artisan schedule:run
```

### 本番環境
crontabに追加：
```cron
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

## 通知のテスト

### 手動テスト
```bash
php artisan notifications:send-scheduled
```

### ブラウザ通知許可の確認
1. ブラウザでアプリを開く
2. 通知許可ダイアログで「許可」を選択
3. Developer Tools の Console で FCM トークンの取得を確認

## セキュリティ設定

### Firebase Security Rules
```javascript
{
  "rules": {
    ".read": false,
    ".write": false
  }
}
```

### HTTPS必須
本番環境では HTTPS が必須です。Service Worker は HTTPS でのみ動作します。

## パフォーマンス最適化

### Firebase SDK のツリーシェイキング
必要な機能のみをインポート：
```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
```

### バックグラウンド処理
Laravel Horizon または Queue Worker を使用して通知送信を非同期処理することを推奨。

## 監視とログ

### Firebase Analytics
通知の配信状況を Firebase Console で確認可能。

### Laravel ログ
`storage/logs/laravel.log` で通知送信の成功/失敗を確認。

## トラブルシューティング

### 通知が届かない場合
1. FCMトークンが正しく保存されているか確認
2. 通知設定が有効になっているか確認
3. Service Worker が正しく登録されているか確認
4. VAPID キーが正しいか確認
5. ブラウザの通知許可状態を確認

### Service Worker の問題
```javascript
// Developer Tools でService Worker の状態を確認
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(registrations);
});
```

## 本番環境固有の考慮事項

1. **レート制限**: Firebase には送信制限があります
2. **バッチ送信**: 大量の通知は分割して送信
3. **エラー処理**: 無効なトークンの削除が必要
4. **スケーリング**: 複数サーバー環境での重複送信防止

## 実装完了チェックリスト

- [ ] Firebase プロジェクト作成
- [ ] 環境変数設定
- [ ] サービスアカウントキー配置
- [ ] VAPID キー設定
- [ ] データベースマイグレーション実行
- [ ] Service Worker の実際の設定値更新
- [ ] cron ジョブ設定
- [ ] HTTPS 設定
- [ ] 通知許可テスト
- [ ] エンドツーエンドテスト実行