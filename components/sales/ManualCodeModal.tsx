import React, { useEffect, useRef, useState } from 'react';
import XMarkIcon from '../icons/XMarkIcon';

interface ManualCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  title?: string;
  placeholder?: string;
}

const ManualCodeModal: React.FC<ManualCodeModalProps> = ({ isOpen, onClose, onSubmit, title = 'Enter Barcode or SKU', placeholder = 'e.g., 0123456789' }) => {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCode('');
      // Delay to ensure element is mounted
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = (code || '').trim();
    if (!trimmed) return; // do nothing on empty
    onSubmit(trimmed);
  };

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      aria-labelledby="manual-code-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-medium text-gray-900" id="manual-code-modal-title">
            {title}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label htmlFor="manual-code-input" className="block text-sm font-medium text-gray-700 mb-1">
              Barcode / SKU
            </label>
            <input
              id="manual-code-input"
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={placeholder}
            />
            <p className="text-xs text-gray-500 mt-1">Tip: You can paste a barcode number or type a SKU, then press Enter.</p>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white text-gray-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim()}
              className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 disabled:bg-blue-300"
            >
              Add to cart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualCodeModal;
