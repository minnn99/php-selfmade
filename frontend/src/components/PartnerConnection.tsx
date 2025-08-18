import React, { useState, useEffect } from "react";
import { authAPI, partnerAPI } from "../services/api";
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PartnerConnectionProps {
  // 将来的にAPI連携時に使用予定
}

export const PartnerConnection: React.FC<PartnerConnectionProps> = () => {
  const [activeTab, setActiveTab] = useState<"connect" | "invite" | "status">("status");
  const [inviteCode, setInviteCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<{ name: string; gender: string } | null>(null);
  const [userGender, setUserGender] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ユーザー情報とパートナー状況を取得してロード
  useEffect(() => {
    const loadData = async () => {
      try {
        // ユーザー情報を取得
        const userData = await authAPI.getUser();
        const gender = (userData.data as { user?: { gender?: string } })?.user?.gender || "";
        setUserGender(gender);

        // パートナー状況を取得
        await loadPartnerStatus();

        // 男性ユーザーで招待タブが選択されている場合、自動的にconnectタブに切り替え
        const isMale = gender === "male" || gender === "男性";
        const isFemale = gender === "female" || gender === "女性";

        if (isMale && activeTab === "invite") {
          setActiveTab("connect");
        }
        // 女性ユーザーで参加タブが選択されている場合、自動的に招待タブに切り替え
        if (isFemale && activeTab === "connect") {
          setActiveTab("invite");
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // パートナー状況を取得
  const loadPartnerStatus = async () => {
    try {
      const response = await partnerAPI.getStatus();

      if (response.success && response.data) {
        const responseData = response.data as { is_connected?: boolean; partner?: { name: string; gender: string } };
        setIsConnected(!!responseData.is_connected);
        if (responseData.partner) {
          setPartnerInfo({
            name: responseData.partner.name,
            gender: responseData.partner.gender,
          });
        }
      }
    } catch (error) {
      console.error("Failed to load partner status:", error);
    }
  };

  // 男性ユーザーかどうかをチェック
  const isMaleUser = userGender === "male" || userGender === "男性";
  // 女性ユーザーかどうかをチェック
  const isFemaleUser = userGender === "female" || userGender === "女性";

  // 招待コード生成
  const generateInviteCode = async () => {
    setActionLoading(true);
    try {
      const response = await partnerAPI.generateInvite();

      if (response.success && response.data) {
        const responseData = response.data as { invite_code?: string };
        setGeneratedCode(responseData.invite_code || "");
        alert("招待コードが生成されました！\nパートナーにコードを共有してください。");
      } else {
        alert(response.message || "招待コードの生成に失敗しました。");
      }
    } catch (error: any) {
      console.error("Failed to generate invite code:", error);
      const errorMessage = error.response?.data?.message || error.message || "招待コードの生成に失敗しました。";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // 招待コード入力処理
  const handleJoinPartner = async () => {
    if (inviteCode.length !== 6) {
      alert("正しい招待コードを入力してください");
      return;
    }

    // 確認ダイアログを表示
    const isConfirmed = confirm(
      `招待コード「${inviteCode}」でパートナーと連携しますか？\n\n連携すると以下の情報が共有されます：\n・生理周期データ\n・症状記録\n・健康状態\n\n信頼できるパートナーとのみ連携してください。`
    );

    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      const response = await partnerAPI.joinPartner(inviteCode);

      if (response.success && response.data) {
        const responseData = response.data as { partner?: { name: string; gender: string } };
        setIsConnected(true);
        if (responseData.partner) {
          setPartnerInfo({
            name: responseData.partner.name,
            gender: responseData.partner.gender,
          });
        }
        setActiveTab("status");
        setInviteCode("");
        alert("パートナーと連携しました！\n今後、健康データがパートナーと共有されます。");
      } else {
        alert(response.message || "パートナー連携に失敗しました。");
      }
    } catch (error: any) {
      console.error("Failed to join partner:", error);
      const errorMessage = error.response?.data?.message || error.message || "パートナー連携に失敗しました。";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // パートナー連携解除
  const handleDisconnect = async () => {
    if (!confirm("パートナーとの連携を解除しますか？")) return;

    setActionLoading(true);
    try {
      const response = await partnerAPI.disconnect();

      if (response.success) {
        setIsConnected(false);
        setPartnerInfo(null);
        setInviteCode("");
        setGeneratedCode("");
        alert("パートナーとの連携を解除しました。");
      } else {
        alert(response.message || "連携解除に失敗しました。");
      }
    } catch (error: any) {
      console.error("Failed to disconnect partner:", error);
      const errorMessage = error.response?.data?.message || error.message || "連携解除に失敗しました。";
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-center sm:justify-start mb-4 sm:mb-6">
        <div className="text-center sm:text-left">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900">パートナー連携</h2>
          <p className="text-xs sm:text-sm text-neutral-600">パートナーと健康データを共有</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 mb-4 sm:mb-6">
        <button
          onClick={() => setActiveTab("status")}
          className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
            activeTab === "status" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          連携状況
        </button>
        {!isMaleUser && (
          <button
            onClick={() => setActiveTab("invite")}
            className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              activeTab === "invite" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <span className="hidden sm:inline">招待コード生成</span>
            <span className="sm:hidden">招待</span>
          </button>
        )}
        {!isFemaleUser && (
          <button
            onClick={() => setActiveTab("connect")}
            className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              activeTab === "connect" ? "bg-white text-primary-600 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <span className="hidden sm:inline">パートナーに参加</span>
            <span className="sm:hidden">参加</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* 連携状況タブ */}
        {activeTab === "status" && (
          <div className="space-y-4">
            {isConnected ? (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-base sm:text-lg font-medium text-pink-900">連携中</h3>
                    <p className="text-sm sm:text-base text-pink-700">パートナー: {partnerInfo?.name}</p>
                    <p className="text-xs sm:text-sm text-pink-600 mt-1">健康データを共有しています</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={actionLoading}
                  className="mt-3 sm:mt-4 w-full sm:w-auto px-4 py-2 bg-red-100 hover:bg-red-200 active:bg-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
                >
                  {actionLoading ? "処理中..." : "連携を解除"}
                </button>
              </div>
            ) : (
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">パートナー未連携</h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-4 px-2">パートナーと連携して健康データを共有しましょう</p>
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {!isMaleUser && (
                    <button
                      onClick={() => setActiveTab("invite")}
                      className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
                    >
                      招待コード生成
                    </button>
                  )}
                  {!isFemaleUser && (
                    <button
                      onClick={() => setActiveTab("connect")}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-primary-300 rounded-lg text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 transition-colors min-h-[44px] touch-manipulation"
                    >
                      パートナーに参加
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 招待コード生成タブ */}
        {activeTab === "invite" && (
          <div className="space-y-4">
            {isMaleUser ? (
              <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-amber-900 mb-2">招待コード生成は利用できません</h3>
                <p className="text-sm sm:text-base text-amber-700 mb-4 px-2">
                  男性アカウントでは招待コードの生成機能をご利用いただけません。パートナーから招待コードを受け取って参加してください。
                </p>
                <button
                  onClick={() => setActiveTab("connect")}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
                >
                  パートナーに参加する
                </button>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">パートナーを招待</h3>
                <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 px-2">招待コードを生成してパートナーに共有してください</p>

                {generatedCode ? (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 sm:p-6 mb-4">
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-primary-600 mb-2">招待コード</p>
                      <div className="text-2xl sm:text-3xl font-mono font-bold text-primary-900 tracking-widest mb-3 sm:mb-4">{generatedCode}</div>
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedCode)}
                        className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
                      >
                        コードをコピー
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg p-6 sm:p-8 mb-4">
                    <div className="text-center">
                      <svg className="w-10 h-10 sm:w-12 sm:h-12 text-neutral-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      <p className="text-sm sm:text-base text-neutral-600">招待コードを生成してください</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={generateInviteCode}
                  disabled={actionLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors min-h-[48px] touch-manipulation"
                >
                  {actionLoading ? "生成中..." : "招待コードを生成"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* パートナーに参加タブ */}
        {activeTab === "connect" && (
          <div className="space-y-4">
            {isFemaleUser ? (
              <div className="text-center bg-pink-50 border border-pink-200 rounded-lg p-4 sm:p-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-pink-900 mb-2">パートナー参加機能は利用できません</h3>
                <p className="text-sm sm:text-base text-pink-700 mb-4 px-2">
                  女性アカウントではパートナーへの参加機能をご利用いただけません。招待コードを生成してパートナーを招待してください。
                </p>
                <button
                  onClick={() => setActiveTab("invite")}
                  className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm font-medium transition-colors min-h-[44px] touch-manipulation"
                >
                  招待コードを生成する
                </button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <h3 className="text-base sm:text-lg font-medium text-neutral-900 mb-2">パートナーに参加</h3>
                  <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6 px-2">パートナーから受け取った招待コードを入力してください</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="inviteCode" className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                      招待コード
                    </label>
                    <input
                      id="inviteCode"
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="例: ABC123"
                      maxLength={6}
                      className="w-full px-4 py-3 border border-medical rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-center text-xl sm:text-2xl font-mono tracking-widest min-h-[48px] touch-manipulation"
                    />
                  </div>

                  <button
                    onClick={handleJoinPartner}
                    disabled={inviteCode.length !== 6 || actionLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors min-h-[48px] touch-manipulation"
                  >
                    {actionLoading ? "連携中..." : "パートナーに参加"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
