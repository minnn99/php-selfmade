import React, { useState } from "react";

interface PartnerConnectionProps {
  // 将来的にAPI連携時に使用予定
}

export const PartnerConnection: React.FC<PartnerConnectionProps> = () => {
  const [activeTab, setActiveTab] = useState<"connect" | "invite" | "status">("status");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [partnerName, setPartnerName] = useState("");

  // 招待コード生成（仮実装）
  const generateInviteCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
  };

  // 招待コード入力処理（仮実装）
  const handleJoinPartner = () => {
    if (inviteCode.length === 6) {
      setIsConnected(true);
      setPartnerName("サンプルパートナー");
      setActiveTab("status");
      alert("パートナーと連携しました！");
    } else {
      alert("正しい招待コードを入力してください");
    }
  };

  // パートナー連携解除（仮実装）
  const handleDisconnect = () => {
    if (confirm("パートナーとの連携を解除しますか？")) {
      setIsConnected(false);
      setPartnerName("");
      setInviteCode("");
      setGeneratedCode("");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">パートナー連携</h2>
          <p className="text-sm text-neutral-600">パートナーと健康データを共有</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab("status")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "status" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          連携状況
        </button>
        <button
          onClick={() => setActiveTab("invite")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "invite" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          招待コード生成
        </button>
        <button
          onClick={() => setActiveTab("connect")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "connect" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          パートナーに参加
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* 連携状況タブ */}
        {activeTab === "status" && (
          <div className="space-y-4">
            {isConnected ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-green-900">連携中</h3>
                    <p className="text-green-700">パートナー: {partnerName}</p>
                    <p className="text-sm text-green-600 mt-1">健康データを共有しています</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-green-700">オンライン</span>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  連携を解除
                </button>
              </div>
            ) : (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-center">
                <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">パートナー未連携</h3>
                <p className="text-neutral-600 mb-4">パートナーと連携して健康データを共有しましょう</p>
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setActiveTab("invite")}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    招待コード生成
                  </button>
                  <button
                    onClick={() => setActiveTab("connect")}
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary-300 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
                  >
                    パートナーに参加
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 招待コード生成タブ */}
        {activeTab === "invite" && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">パートナーを招待</h3>
              <p className="text-neutral-600 mb-6">招待コードを生成してパートナーに共有してください</p>

              {generatedCode ? (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-primary-600 mb-2">招待コード</p>
                    <div className="text-3xl font-mono font-bold text-primary-900 tracking-widest mb-4">{generatedCode}</div>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedCode)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      コードをコピー
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg p-8 mb-4">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <p className="text-neutral-600">招待コードを生成してください</p>
                  </div>
                </div>
              )}

              <button
                onClick={generateInviteCode}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                招待コードを生成
              </button>
            </div>
          </div>
        )}

        {/* パートナーに参加タブ */}
        {activeTab === "connect" && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">パートナーに参加</h3>
              <p className="text-neutral-600 mb-6">パートナーから受け取った招待コードを入力してください</p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-neutral-700 mb-2">
                  招待コード
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="例: ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-medical rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <button
                onClick={handleJoinPartner}
                disabled={inviteCode.length !== 6}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                パートナーに参加
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-amber-800">注意事項</h4>
                  <p className="text-sm text-amber-700 mt-1">パートナーと連携すると、健康データが共有されます。信頼できる相手とのみ連携してください。</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
