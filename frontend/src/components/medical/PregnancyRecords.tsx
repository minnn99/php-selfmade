import React, { useState, useEffect } from "react";
import { userDataAPI } from "../../services/api";

interface PregnancyRecord {
  id: string;
  date: string;
  type: "symptom" | "test" | "appointment" | "note";
  title: string;
  description: string;
  value?: string;
}

interface PregnancyRecordsProps {
  onBack: () => void;
}

export const PregnancyRecords: React.FC<PregnancyRecordsProps> = ({ onBack }) => {
  const [pregnancyRecords, setPregnancyRecords] = useState<PregnancyRecord[]>([]);
  const [pregnancyStartDate, setPregnancyStartDate] = useState("");
  const [searchWeek, setSearchWeek] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchType, setSearchType] = useState<"" | "symptom" | "test" | "appointment" | "note">("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PregnancyRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState<{
    type: "symptom" | "test" | "appointment" | "note";
    title: string;
    description: string;
    value: string;
  }>({
    type: "symptom",
    title: "",
    description: "",
    value: "",
  });

  useEffect(() => {
    loadPregnancyData();
  }, []);

  const loadPregnancyData = async () => {
    try {
      const response = await userDataAPI.getPregnancyRecords();
      if (response.success && response.data) {
        const responseData = response.data as { records_data?: PregnancyRecord[]; start_date?: string };
        setPregnancyRecords(responseData.records_data || []);
        setPregnancyStartDate(responseData.start_date || "");
      }
    } catch {
      // Failed to load pregnancy data
    }
  };

  const savePregnancyData = async (records: PregnancyRecord[], startDate: string = pregnancyStartDate) => {
    try {
      await userDataAPI.savePregnancyRecords(startDate || null, records);
    } catch {
      alert("データの保存に失敗しました。");
    }
  };

  // クリック外でドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".search-dropdown-container")) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSearchDropdown]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const calculateWeeksFromDate = (recordDate: string) => {
    if (!pregnancyStartDate) return { weeks: 0, days: 0 };

    const start = new Date(pregnancyStartDate);
    const record = new Date(recordDate);
    const diffTime = Math.abs(record.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;

    return { weeks, days };
  };

  const groupRecordsByWeek = () => {
    const filtered = pregnancyRecords.filter((record) => {
      const matchesWeek = !searchWeek || calculateWeeksFromDate(record.date).weeks.toString() === searchWeek;
      const matchesDate = !searchDate || record.date.includes(searchDate);
      const matchesType = !searchType || record.type === searchType;
      return matchesWeek && matchesDate && matchesType;
    });

    const grouped = filtered.reduce((acc, record) => {
      const { weeks } = calculateWeeksFromDate(record.date);
      const weekKey = `${weeks}週`;

      if (!acc[weekKey]) {
        acc[weekKey] = [];
      }
      acc[weekKey].push(record);
      return acc;
    }, {} as Record<string, PregnancyRecord[]>);

    // 週数順にソート
    return Object.keys(grouped)
      .sort((a, b) => {
        const weekA = parseInt(a.replace("週", ""));
        const weekB = parseInt(b.replace("週", ""));
        return weekB - weekA; // 新しい週から表示
      })
      .map((weekKey) => ({
        week: weekKey,
        records: grouped[weekKey].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }));
  };

  const addPregnancyRecord = async () => {
    const record: PregnancyRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      type: newRecord.type,
      title: newRecord.title,
      description: newRecord.description,
      value: newRecord.value,
    };

    const updatedRecords = [record, ...pregnancyRecords];
    setPregnancyRecords(updatedRecords);
    await savePregnancyData(updatedRecords);

    setNewRecord({ type: "symptom", title: "", description: "", value: "" });
    setShowAddRecord(false);
  };

  const updateRecord = async (updatedRecord: PregnancyRecord) => {
    const updatedRecords = pregnancyRecords.map((record) => (record.id === updatedRecord.id ? updatedRecord : record));
    setPregnancyRecords(updatedRecords);
    await savePregnancyData(updatedRecords);
    setEditingRecord(null);
    setShowEditModal(false);
  };

  const openEditModal = (record: PregnancyRecord) => {
    setEditingRecord(record);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditingRecord(null);
    setShowEditModal(false);
  };

  const deleteRecord = async (recordId: string) => {
    if (confirm("この記録を削除しますか？")) {
      const updatedRecords = pregnancyRecords.filter((record) => record.id !== recordId);
      setPregnancyRecords(updatedRecords);
      await savePregnancyData(updatedRecords);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      symptom: "症状",
      test: "検査",
      appointment: "診察",
      note: "メモ",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSearchDisplayText = () => {
    const parts = [];
    if (searchWeek) parts.push(`${searchWeek}週`);
    if (searchDate) parts.push(formatDate(searchDate));
    if (searchType) parts.push(getTypeLabel(searchType));
    return parts.length > 0 ? parts.join(" / ") : "";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-medical p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">妊娠記録</h2>
        </div>
        <button
          onClick={() => setShowAddRecord(true)}
          className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg text-sm transition-colors min-h-[44px] touch-manipulation"
        >
          記録追加
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        <div className="relative search-dropdown-container">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="記録を検索・フィルター..."
                value={getSearchDisplayText()}
                onClick={() => setShowSearchDropdown(!showSearchDropdown)}
                readOnly
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation cursor-pointer bg-white"
              />
              <svg
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {(searchWeek || searchDate || searchType) && (
              <button
                onClick={() => {
                  setSearchWeek("");
                  setSearchDate("");
                  setSearchType("");
                  setShowSearchDropdown(false);
                }}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 active:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              >
                クリア
              </button>
            )}
          </div>

          {/* Advanced Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">週数</label>
                    <input
                      type="number"
                      placeholder="例: 5"
                      value={searchWeek}
                      onChange={(e) => setSearchWeek(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[36px] touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">日付</label>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[36px] touch-manipulation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">種類</label>
                    <select
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value as "" | "symptom" | "test" | "appointment" | "note")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[36px] touch-manipulation"
                    >
                      <option value="">全て</option>
                      <option value="symptom">症状</option>
                      <option value="test">検査</option>
                      <option value="appointment">診察</option>
                      <option value="note">メモ</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowSearchDropdown(false)}
                    className="px-3 py-1 text-xs bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors min-h-[32px] touch-manipulation"
                  >
                    完了
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>総記録数: {pregnancyRecords.length}件</span>
          <span>表示中: {groupRecordsByWeek().reduce((sum, group) => sum + group.records.length, 0)}件</span>
        </div>
      </div>

      {/* Add Record Form */}
      {showAddRecord && (
        <div className="mb-4 sm:mb-6 bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 text-center sm:text-left">新しい記録を追加</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={newRecord.type}
              onChange={(e) => setNewRecord({ ...newRecord, type: e.target.value as "symptom" | "test" | "appointment" | "note" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
            >
              <option value="symptom">症状</option>
              <option value="test">検査</option>
              <option value="appointment">診察</option>
              <option value="note">メモ</option>
            </select>
            <input
              type="text"
              placeholder="タイトル"
              value={newRecord.title}
              onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
            />
          </div>
          <textarea
            placeholder="詳細内容"
            value={newRecord.description}
            onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[88px] touch-manipulation"
          />
          {newRecord.type === "test" && (
            <input
              type="text"
              placeholder="検査結果"
              value={newRecord.value || ""}
              onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
            />
          )}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
            <button
              onClick={() => setShowAddRecord(false)}
              className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-800 active:text-gray-900 border border-gray-300 rounded-lg text-sm min-h-[44px] touch-manipulation"
            >
              キャンセル
            </button>
            <button
              onClick={addPregnancyRecord}
              disabled={!newRecord.title || !newRecord.description}
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors min-h-[44px] touch-manipulation"
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-6">
        {pregnancyRecords.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-sm px-4">まだ記録がありません</p>
            <button
              onClick={() => setShowAddRecord(true)}
              className="mt-3 sm:mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors min-h-[44px] touch-manipulation"
            >
              最初の記録を追加
            </button>
          </div>
        ) : groupRecordsByWeek().length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-gray-500 text-sm px-4">検索条件に一致する記録がありません</p>
          </div>
        ) : (
          groupRecordsByWeek().map(({ week, records }) => (
            <div key={week} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Week Header */}
              <div className="bg-primary-50 border-b border-primary-100 px-3 sm:px-4 py-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm sm:text-base font-semibold text-primary-900">妊娠 {week}</h5>
                  <span className="text-xs text-primary-700">{records.length}件</span>
                </div>
              </div>

              {/* Records in this week */}
              <div className="space-y-0">
                {records.map((record, index) => {
                  const weekData = calculateWeeksFromDate(record.date);

                  return (
                    <div key={record.id} className={`relative p-3 sm:p-4 ${index !== records.length - 1 ? "border-b border-gray-100" : ""}`}>
                      {/* Display Mode */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center mb-2">
                              <span
                                className={`
                                  px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1 flex-shrink-0
                                  ${record.type === "symptom" ? "bg-orange-100 text-orange-800" : ""}
                                  ${record.type === "test" ? "bg-blue-100 text-blue-800" : ""}
                                  ${record.type === "appointment" ? "bg-green-100 text-green-800" : ""}
                                  ${record.type === "note" ? "bg-gray-100 text-gray-800" : ""}
                                `}
                              >
                                {getTypeLabel(record.type)}
                              </span>
                              <h6 className="font-medium text-gray-900 text-sm break-words">{record.title}</h6>
                            </div>
                            <p className="text-gray-700 text-xs sm:text-sm mb-2 whitespace-pre-wrap break-words leading-relaxed">{record.description}</p>
                            {record.value && <p className="text-primary-600 text-xs sm:text-sm font-medium break-words">結果: {record.value}</p>}
                          </div>
                          <div className="text-right flex-shrink-0 sm:ml-4">
                            <div className="text-xs text-gray-500 whitespace-nowrap">{formatDate(record.date)}</div>
                            <div className="text-xs text-primary-600 font-medium whitespace-nowrap sm:mb-2">
                              {weekData.weeks}w{weekData.days}d
                            </div>
                          </div>
                        </div>

                        {/* Mobile Action Buttons */}
                        <div className="flex justify-end space-x-2 sm:hidden">
                          <button
                            onClick={() => openEditModal(record)}
                            className="flex items-center space-x-1 px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span>編集</span>
                          </button>
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="flex items-center space-x-1 px-3 py-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[40px]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            <span>削除</span>
                          </button>
                        </div>

                        {/* Desktop Action Buttons */}
                        <div className="hidden sm:flex sm:absolute sm:bottom-3 sm:right-3 space-x-1">
                          <button
                            onClick={() => openEditModal(record)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="編集"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteRecord(record.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="削除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Record Modal */}
      {showEditModal && editingRecord && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">記録を編集</h3>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">種類</label>
                  <select
                    value={editingRecord.type}
                    onChange={(e) => setEditingRecord({ ...editingRecord, type: e.target.value as "symptom" | "test" | "appointment" | "note" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
                  >
                    <option value="symptom">症状</option>
                    <option value="test">検査</option>
                    <option value="appointment">診察</option>
                    <option value="note">メモ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">タイトル</label>
                  <input
                    type="text"
                    value={editingRecord.title}
                    onChange={(e) => setEditingRecord({ ...editingRecord, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
                    placeholder="タイトルを入力"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">詳細内容</label>
                <textarea
                  value={editingRecord.description}
                  onChange={(e) => setEditingRecord({ ...editingRecord, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px] touch-manipulation"
                  placeholder="詳細内容を入力"
                />
              </div>

              {editingRecord.type === "test" && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">検査結果</label>
                  <input
                    type="text"
                    placeholder="検査結果を入力"
                    value={editingRecord.value || ""}
                    onChange={(e) => setEditingRecord({ ...editingRecord, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] touch-manipulation"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeEditModal}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => updateRecord(editingRecord)}
                  disabled={!editingRecord.title || !editingRecord.description}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors min-h-[44px] touch-manipulation"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
