import React from 'react';

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">利用規約</h2>
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
            <h3 className="text-lg font-medium text-gray-900 mb-3">第1条（適用）</h3>
            <p className="text-sm text-gray-600 mb-2">
              本利用規約（以下「本規約」）は、Pairiod（以下「当サービス」）の利用条件を定めるものです。
              利用者は、当サービスの利用にあたって、本規約に同意したものとみなします。
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第2条（利用登録）</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 利用者は、正確な情報を提供して利用登録を行うものとします。</li>
              <li>• 虚偽の情報を登録した場合、当サービスの利用を停止することがあります。</li>
              <li>• 利用者は、登録情報に変更があった場合、速やかに変更手続きを行うものとします。</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第3条（サービス内容）</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 当サービスは、月経周期の記録・予測機能を提供します。</li>
              <li>• 健康管理に関する情報提供を行います。</li>
              <li>• 医療的な診断や治療を目的とするものではありません。</li>
              <li>• 気になる症状がある場合は、必ず医療機関を受診してください。</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第4条（利用者の義務）</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 法令および本規約を遵守して当サービスを利用するものとします。</li>
              <li>• 他の利用者や第三者に迷惑をかける行為を行ってはなりません。</li>
              <li>• 当サービスの運営を妨害する行為を行ってはなりません。</li>
              <li>• アカウント情報の管理は利用者の責任において行うものとします。</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第5条（禁止事項）</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 当サービスの知的財産権を侵害する行為</li>
              <li>• 虚偽の情報を発信する行為</li>
              <li>• 不正アクセスやシステムへの攻撃</li>
              <li>• 他の利用者の個人情報を収集する行為</li>
              <li>• 営利目的での利用（許可なく）</li>
              <li>• その他、当サービスが不適切と判断する行為</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第6条（サービスの変更・停止）</h3>
            <p className="text-sm text-gray-600 mb-2">
              当サービスは、事前の通知なく、サービス内容の変更や停止を行うことがあります。
              これにより利用者に生じた損害については、責任を負いません。
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第7条（個人情報の取扱い）</h3>
            <p className="text-sm text-gray-600 mb-2">
              利用者の個人情報の取扱いについては、別途定めるプライバシーポリシーに従います。
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第8条（免責事項）</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 当サービスの情報の正確性や完全性を保証するものではありません。</li>
              <li>• 当サービスの利用により生じた損害について、責任を負いません。</li>
              <li>• システムの不具合や障害による損害について、責任を負いません。</li>
              <li>• 第三者との間で生じたトラブルについて、責任を負いません。</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第9条（利用停止・退会）</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 利用者が本規約に違反した場合、利用を停止することがあります。</li>
              <li>• 利用者はいつでも退会手続きを行うことができます。</li>
              <li>• 退会後は、登録データは削除されます。</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第10条（準拠法・管轄裁判所）</h3>
            <p className="text-sm text-gray-600 mb-2">
              本規約は日本法に準拠し、当サービスに関する紛争については、東京地方裁判所を専属的合意管轄裁判所とします。
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">第11条（規約の変更）</h3>
            <p className="text-sm text-gray-600 mb-2">
              本規約は、利用者への事前の通知なく変更されることがあります。
              変更後の規約は、当サービス上に掲載した時点で効力を生じます。
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              制定日: 2025年7月16日<br />
              改定日: 2025年7月16日
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
    </div>
  );
};