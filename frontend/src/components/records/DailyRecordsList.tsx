import React, { useState, useEffect } from "react";
import { DailyRecordModal } from "../calendar/DailyRecordModal";

interface DailyRecordData {
  mood: string;
  physicalCondition: string;
  waterIntake: number;
  sleepHours: number;
  notes: string;
  date: string;
  timestamp: string;
}

export const DailyRecordsList: React.FC = () => {
  const [records, setRecords] = useState<DailyRecordData[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DailyRecordData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 10;

  // Load records from localStorage
  useEffect(() => {
    const loadRecords = () => {
      const allRecords: DailyRecordData[] = [];

      // Get all localStorage keys for daily records
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("daily-record-")) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const parsedData = JSON.parse(data);
              const dateString = key.replace("daily-record-", "");
              allRecords.push({
                ...parsedData,
                date: dateString,
              });
            }
          } catch {
            // Skip invalid records
          }
        }
      }

      // Sort by date (newest first)
      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecords(allRecords);
      setFilteredRecords(allRecords);
    };

    loadRecords();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const getMoodText = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      excellent: "とても良い",
      good: "良い",
      normal: "普通",
      poor: "悪い",
      terrible: "とても悪い",
    };
    return moodMap[mood] || "普通";
  };

  const getPhysicalText = (condition: string) => {
    const conditionMap: { [key: string]: string } = {
      excellent: "とても良い",
      good: "良い",
      normal: "普通",
      poor: "悪い",
      terrible: "とても悪い",
    };
    return conditionMap[condition] || "普通";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const handleEdit = (record: DailyRecordData) => {
    setSelectedDate(new Date(record.date));
    setIsModalOpen(true);
  };

  const handleDelete = (dateString: string) => {
    setRecordToDelete(dateString);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      localStorage.removeItem(`daily-record-${recordToDelete}`);
      const updatedRecords = records.filter((record) => record.date !== recordToDelete);
      setRecords(updatedRecords);
      setFilteredRecords(updatedRecords);

      // Reset page if current page is empty
      const newTotalPages = Math.ceil(updatedRecords.length / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }
    setShowDeleteModal(false);
    setRecordToDelete(null);
  };

  const handleSaveRecord = (data: { mood: string; physicalCondition: string; waterIntake: number; sleepHours: number; notes: string }) => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split("T")[0];
      localStorage.setItem(`daily-record-${dateString}`, JSON.stringify(data));

      // Reload records
      const allRecords: DailyRecordData[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("daily-record-")) {
          try {
            const recordData = localStorage.getItem(key);
            if (recordData) {
              const parsedData = JSON.parse(recordData);
              const recordDateString = key.replace("daily-record-", "");
              allRecords.push({
                ...parsedData,
                date: recordDateString,
              });
            }
          } catch {
            // Skip invalid records
          }
        }
      }

      allRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecords(allRecords);
      setFilteredRecords(allRecords);
    }

    setIsModalOpen(false);
    setSelectedDate(null);
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white">記録一覧</h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-gray-300">{records.length}件の記録</p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </button>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-medical dark:border-gray-700">
          {currentRecords.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">記録がありません</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">まだ記録が作成されていません。</p>
            </div>
          ) : (
            <>
              {/* Records */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentRecords.map((record) => (
                  <div key={record.date} className="p-4 sm:p-6">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center mb-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium mr-2 mb-1 flex-shrink-0 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400">日記録</span>
                            <h6 className="font-medium text-gray-900 dark:text-white text-sm break-words">{formatDate(record.date)}</h6>
                          </div>
                          <div className="space-y-1">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">気分: {getMoodText(record.mood)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">体調: {getPhysicalText(record.physicalCondition)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">水分: {record.waterIntake}L</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">睡眠: {record.sleepHours}h</p>
                              </div>
                            </div>
                            {record.notes && (
                              <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap break-words leading-relaxed">メモ: {record.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col justify-end text-right flex-shrink-0 sm:ml-4">
                          {/* Desktop Action Buttons */}
                          <div className="hidden sm:flex sm:flex-row sm:space-x-1">
                            <button
                              onClick={() => handleEdit(record)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
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
                              onClick={() => handleDelete(record.date)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
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

                      {/* Mobile Action Buttons */}
                      <div className="flex justify-end space-x-2 sm:hidden">
                        <button
                          onClick={() => handleEdit(record)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors touch-manipulation min-h-[40px]"
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
                          onClick={() => handleDelete(record.date)}
                          className="flex items-center space-x-1 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors touch-manipulation min-h-[40px]"
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} / {filteredRecords.length}件
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        前へ
                      </button>

                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 border border-primary-300 dark:border-primary-700"
                                : "text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        次へ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && selectedDate && (
        <DailyRecordModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDate(null);
          }}
          onSave={handleSaveRecord}
          date={selectedDate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">記録を削除</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">この記録を削除してもよろしいですか？この操作は取り消せません。</p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecordToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
