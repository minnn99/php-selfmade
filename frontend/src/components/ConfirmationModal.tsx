import React from 'react';

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
  confirmButtonClass = 'px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors',
  cancelButtonClass = 'px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors',
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{ margin: 0, top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <p className="whitespace-pre-wrap text-gray-800 mb-6 text-center">{message}</p>
        <div className="flex justify-center space-x-4">
          <button onClick={onCancel} className={cancelButtonClass}>
            {cancelButtonText}
          </button>
          <button onClick={onConfirm} className={confirmButtonClass}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
