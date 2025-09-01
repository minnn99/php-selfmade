import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2; // 現在のページの前後に表示するページ数
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 ${className}`}>
      {/* 表示情報 */}
      <div className="text-sm text-gray-700">
        <span>総 {totalItems} 件中 </span>
        <span className="font-medium">
          {Math.min((currentPage - 1) * 10 + 1, totalItems)} - {Math.min(currentPage * 10, totalItems)}
        </span>
        <span> 件を表示</span>
      </div>

      {/* ページネーション */}
      <div className="flex items-center space-x-1">
        {/* 前へボタン */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors min-h-[40px] min-w-[40px] touch-manipulation"
          aria-label="前のページ"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* ページ番号 */}
        <div className="hidden sm:flex">
          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 min-h-[40px]"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isCurrentPage = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border-t border-b border-gray-300 transition-colors min-h-[40px] min-w-[40px] touch-manipulation ${
                  isCurrentPage
                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* モバイル用の現在ページ表示 */}
        <div className="sm:hidden relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 min-h-[40px]">
          {currentPage} / {totalPages}
        </div>

        {/* 次へボタン */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors min-h-[40px] min-w-[40px] touch-manipulation"
          aria-label="次のページ"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// レスポンシブ専用の左右ナビゲーションボタン
interface MobilePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  className?: string;
}

export const MobilePagination: React.FC<MobilePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  className = ''
}) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* 左ボタン */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>前へ</span>
      </button>

      {/* 中央の情報 */}
      <div className="flex flex-col items-center space-y-1">
        <div className="text-sm text-gray-700">
          {currentPage} / {totalPages} ページ
        </div>
        <div className="text-xs text-gray-500">
          総 {totalItems} 件
        </div>
      </div>

      {/* 右ボタン */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px] touch-manipulation"
      >
        <span>次へ</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};