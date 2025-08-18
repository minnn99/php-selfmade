import React, { useState } from "react";
import { menstrualCycleAPI } from "../services/api";

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportData {
  cycles: Array<Record<string, unknown>>;
  settings: {
    appearance?: Record<string, unknown>;
    notifications?: Record<string, unknown>;
    privacy?: Record<string, unknown>;
  };
  exportDate: string;
  version: string;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ isOpen, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportDateRange, setExportDateRange] = useState<"all" | "last12months" | "thisyear" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [includeSettings, setIncludeSettings] = useState(true);

  // データエクスポート機能
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 生理周期データを取得
      const cyclesResponse = await menstrualCycleAPI.getCycles();
      let cycles = Array.isArray(cyclesResponse.data) ? cyclesResponse.data as Array<Record<string, unknown>> : [] as Array<Record<string, unknown>>;

      // 日付範囲でフィルタリング
      if (exportDateRange !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (exportDateRange) {
          case "last12months":
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            break;
          case "thisyear":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          case "custom": {
            startDate = new Date(customStartDate);
            const endDate = new Date(customEndDate);
            cycles = cycles.filter((cycle: Record<string, unknown>) => {
              const cycleDate = new Date(cycle.start_date as string);
              return cycleDate >= startDate && cycleDate <= endDate;
            });
            break;
          }
          default:
            startDate = new Date(0);
        }

        if (exportDateRange !== "custom") {
          cycles = (cycles as Array<Record<string, unknown>>).filter((cycle: Record<string, unknown>) => {
            const cycleDate = new Date(cycle.start_date as string);
            return cycleDate >= startDate;
          });
        }
      } else {
        cycles = [] as Array<Record<string, unknown>>;
      }

      if (exportFormat === "json") {
        // JSON形式でエクスポート
        const exportData: ExportData = {
          cycles,
          settings: {},
          exportDate: new Date().toISOString(),
          version: "1.0.0",
        };

        // 設定データを含める場合
        if (includeSettings) {
          exportData.settings = {
            appearance: JSON.parse(localStorage.getItem("appearanceSettings") || "null"),
            notifications: JSON.parse(localStorage.getItem("notificationSettings") || "null"),
            privacy: JSON.parse(localStorage.getItem("privacySettings") || "null"),
          };
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        downloadFile(blob, `pairiod-data-${formatDate(new Date())}.json`);
      } else {
        // CSV形式でエクスポート
        const csvContent = convertToCSV(cycles);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        downloadFile(blob, `pairiod-cycles-${formatDate(new Date())}.csv`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("エクスポートに失敗しました。");
    } finally {
      setIsExporting(false);
    }
  };

  // ファイルダウンロード
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV形式に変換
  const convertToCSV = (cycles: Array<Record<string, unknown>>) => {
    const headers = ["開始日", "終了日", "周期長", "生理期間", "出血量", "症状", "メモ", "作成日"];

    const rows = cycles.map((cycle) => [
      cycle.start_date || "",
      cycle.end_date || "",
      cycle.cycle_length || "",
      cycle.period_length || "",
      cycle.flow_intensity || "",
      Array.isArray(cycle.symptoms) ? cycle.symptoms.join("; ") : cycle.symptoms || "",
      cycle.notes || "",
      cycle.created_at || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n");

    return "\ufeff" + csvContent; // BOM for UTF-8
  };

  // 日付フォーマット
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // データインポート機能
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      let importData: ExportData;

      try {
        importData = JSON.parse(text);
      } catch {
        alert("無効なJSONファイルです。");
        return;
      }

      // データ構造の検証
      if (!importData.cycles || !Array.isArray(importData.cycles)) {
        alert("無効なデータ形式です。");
        return;
      }

      // 確認ダイアログ
      const confirmMessage = `${importData.cycles.length}件の生理周期データをインポートしますか？\n既存のデータは保持されます。`;
      if (!confirm(confirmMessage)) {
        return;
      }

      // データをインポート（既存のAPIがない場合は、個別に作成）
      let successCount = 0;
      let errorCount = 0;

      for (const cycle of importData.cycles) {
        try {
          await menstrualCycleAPI.startCycle({
            start_date: cycle.start_date as string,
            flow_intensity: cycle.flow_intensity as number | undefined,
            symptoms: cycle.symptoms as string[] | undefined,
            notes: cycle.notes as string | undefined,
          });

          if (cycle.end_date) {
            await menstrualCycleAPI.endCycle(cycle.end_date as string);
          }
          successCount++;
        } catch (error) {
          console.error("Failed to import cycle:", cycle, error);
          errorCount++;
        }
      }

      // 設定データのインポート
      if (importData.settings && includeSettings) {
        if (importData.settings.appearance) {
          localStorage.setItem("appearanceSettings", JSON.stringify(importData.settings.appearance));
        }
        if (importData.settings.notifications) {
          localStorage.setItem("notificationSettings", JSON.stringify(importData.settings.notifications));
        }
        if (importData.settings.privacy) {
          localStorage.setItem("privacySettings", JSON.stringify(importData.settings.privacy));
        }
      }

      alert(`インポートが完了しました。\n成功: ${successCount}件\nエラー: ${errorCount}件`);
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      alert("インポートに失敗しました。");
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  // バックアップ作成
  const handleCreateBackup = async () => {
    setIsExporting(true);
    try {
      const cyclesResponse = await menstrualCycleAPI.getCycles();
      const backupData: ExportData = {
        cycles: Array.isArray(cyclesResponse.data) ? cyclesResponse.data as Array<Record<string, unknown>> : [],
        settings: {
          appearance: JSON.parse(localStorage.getItem("appearanceSettings") || "null"),
          notifications: JSON.parse(localStorage.getItem("notificationSettings") || "null"),
          privacy: JSON.parse(localStorage.getItem("privacySettings") || "null"),
        },
        exportDate: new Date().toISOString(),
        version: "1.0.0",
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      downloadFile(blob, `pairiod-backup-${formatDate(new Date())}.json`);
    } catch (error) {
      console.error("Backup failed:", error);
      alert("バックアップの作成に失敗しました。");
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-3xl sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">データ管理</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* バックアップ作成 */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">バックアップ作成</h3>
              <p className="text-xs sm:text-sm text-gray-500">全てのデータと設定の完全バックアップを作成</p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={isExporting}
              className="w-full sm:w-auto flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-400 text-white rounded-lg transition-colors min-h-[44px]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              <span className="text-sm sm:text-base">{isExporting ? "作成中..." : "完全バックアップを作成"}</span>
            </button>
          </div>

          {/* データエクスポート */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">データエクスポート</h3>
              <p className="text-xs sm:text-sm text-gray-500">指定した形式でデータを書き出し</p>
            </div>

            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              {/* エクスポート形式 */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">エクスポート形式</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: "json", label: "JSON（完全データ）", desc: "設定含む完全データ" },
                    { value: "csv", label: "CSV（表計算ソフト用）", desc: "生理周期データのみ" },
                  ].map((format) => (
                    <label key={format.value} className="flex items-start">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={(e) => setExportFormat(e.target.value as "json" | "csv")}
                        className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 flex-shrink-0"
                      />
                      <div className="ml-2 flex-1">
                        <div className="text-xs sm:text-sm font-medium">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 日付範囲 */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">データ範囲</label>
                <select
                  value={exportDateRange}
                  onChange={(e) => setExportDateRange(e.target.value as any)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                >
                  <option value="all">全期間</option>
                  <option value="thisyear">今年</option>
                  <option value="last12months">過去12ヶ月</option>
                  <option value="custom">カスタム期間</option>
                </select>
              </div>

              {/* カスタム日付範囲 */}
              {exportDateRange === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">開始日</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">終了日</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {/* 設定を含める */}
              {exportFormat === "json" && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeSettings}
                    onChange={(e) => setIncludeSettings(e.target.checked)}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-700">設定データを含める</span>
                </label>
              )}

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg transition-colors min-h-[44px]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm sm:text-base">{isExporting ? "エクスポート中..." : "エクスポート実行"}</span>
              </button>
            </div>
          </div>

          {/* データインポート */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">データインポート</h3>
              <p className="text-xs sm:text-sm text-gray-500">バックアップファイルからデータを復元</p>
            </div>

            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600">
                <p className="mb-2">• JSONファイルのみサポート</p>
                <p className="mb-2">• 既存のデータは保持されます</p>
                <p>• 重複するデータは追加される可能性があります</p>
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeSettings}
                  onChange={(e) => setIncludeSettings(e.target.checked)}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-xs sm:text-sm text-gray-700">設定データもインポートする</span>
              </label>

              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  disabled={isImporting}
                  className="block w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 sm:file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 active:file:bg-green-200 disabled:opacity-50 file:min-h-[36px]"
                />
                {isImporting && <p className="text-xs sm:text-sm text-gray-600 mt-2">インポート中...</p>}
              </label>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-xs sm:text-sm">
                <p className="font-medium text-yellow-800">注意事項</p>
                <ul className="mt-1 text-yellow-700 list-disc list-inside">
                  <li>大量のデータの場合、処理に時間がかかる場合があります</li>
                  <li>インポート前に必ずバックアップを作成してください</li>
                  <li>ファイルサイズが大きい場合はブラウザがフリーズする可能性があります</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center sm:justify-end p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 text-sm sm:text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
