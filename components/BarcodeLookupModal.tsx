import React, { useState } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import { Button } from './ui/Button';
import { InputField } from './ui/InputField';

interface BarcodeLookupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (barcode: string) => void;
}

const BarcodeLookupModal: React.FC<BarcodeLookupModalProps> = ({
    isOpen,
    onClose,
    onSearch
}) => {
    const [barcode, setBarcode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim()) return;

        setIsSubmitting(true);
        // Small delay to show button press feedback
        setTimeout(() => {
            onSearch(barcode.trim());
            setIsSubmitting(false);
            setBarcode('');
            onClose();
        }, 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div glass-effect="" className="rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scale-in">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Manual Barcode Lookup</h3>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Enter the barcode number manually to search for the product.
                    </p>

                    <InputField
                        label="Barcode Number"
                        name="barcode"
                        id="barcode-input"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="e.g. 5449000000996"
                        autoFocus
                        required
                    />

                    <div className="mt-6 flex gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                            disabled={!barcode.trim() || isSubmitting}
                        >
                            {isSubmitting ? 'Searching...' : 'Lookup Product'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BarcodeLookupModal;
