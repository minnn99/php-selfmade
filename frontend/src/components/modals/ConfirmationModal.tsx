import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  onConfirm,
  onCancel,
  confirmButtonText = 'はい',
  cancelButtonText = 'キャンセル',
  confirmButtonClass = 'px-4 sm:px-6 py-3 rounded-md bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition-colors text-sm sm:text-base font-medium min-h-[44px] flex items-center justify-center',
  cancelButtonClass = 'px-4 sm:px-6 py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors text-sm sm:text-base font-medium min-h-[44px] flex items-center justify-center',
}) => {
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-sm w-full">
        <p className="whitespace-pre-wrap text-gray-800 mb-4 sm:mb-6 text-center text-sm sm:text-base leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <button onClick={onCancel} className={cancelButtonClass}>
            {cancelButtonText}
          </button>
          <button onClick={onConfirm} className={confirmButtonClass}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
