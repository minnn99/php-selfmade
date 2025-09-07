import React from 'react';
import { createPortal } from 'react-dom';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">プライバシーポリシー</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">1. 収集する情報</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 最終月経日</li>
              <li>• 平均周期の長さ</li>
              <li>• Firebase アカウントに関連付けられたメールアドレス</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">2. 使用目的</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 月経周期の予測と管理</li>
              <li>• ユーザー認証</li>
              <li>• サービス機能の改善</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">3. 情報の管理</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Google Firebase（米国サーバー）で安全に保存</li>
              <li>• 第三者との共有なし</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">4. 機密性の高い個人情報</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 月経周期データは潜在的に機密性の高い情報として扱われます</li>
              <li>• 明示的なユーザー同意のもとでのみ収集されます</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">5. 同意</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• サービスの使用により同意したものと見なされます</li>
              <li>• フォーム送信時のチェックボックスによる明示的な同意</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">6. データの保持</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• ユーザーアカウントの削除まで維持されます</li>
              <li>• 要求に応じて迅速に削除されます</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">7. お問い合わせ</h3>
            <p className="text-sm text-gray-600">
              メール: example@example.com
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">8. ポリシーの改訂</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 必要に応じて更新される場合があります</li>
              <li>• 変更はウェブサイトで公開されます</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              制定日: 2025年7月16日
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};