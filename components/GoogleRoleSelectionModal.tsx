import React from 'react';
import { HiOutlineBuildingStorefront, HiOutlineShoppingBag } from 'react-icons/hi2';

interface GoogleRoleSelectionModalProps {
    isOpen: boolean;
    userName: string;
    onSelectRole: (role: 'business' | 'customer') => void;
    onCancel: () => void;
}

const GoogleRoleSelectionModal: React.FC<GoogleRoleSelectionModalProps> = ({
    isOpen,
    userName,
    onSelectRole,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="liquid-glass-card rounded-[2rem] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">

                <div className="p-8 text-center bg-gradient-to-br from-slate-50 to-slate-100/50">
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Welcome, {userName}!</h2>
                    <p className="text-slate-500 font-medium text-sm">How would you like to use SalePilot today?</p>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
                    {/* Business Option */}
                    <button
                        onClick={() => onSelectRole('business')}
                        className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/30 transition-all duration-300 text-center active:scale-95 transition-all duration-300"
                    >
                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-blue-200">
                            <HiOutlineBuildingStorefront className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Create a Store</h3>
                        <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                            Manage inventory, track sales, and grow your business.
                        </p>
                    </button>

                    {/* Customer Option */}
                    <button
                        onClick={() => onSelectRole('customer')}
                        className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50/30 transition-all duration-300 text-center active:scale-95 transition-all duration-300"
                    >
                        <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm group-hover:shadow-orange-200">
                            <HiOutlineShoppingBag className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-orange-600 transition-colors">Start Shopping</h3>
                        <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                            Browse products, track orders, and discover deals.
                        </p>
                    </button>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-center">
                    <button
                        onClick={onCancel}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors py-2 px-4"
                    >
                        Cancel Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleRoleSelectionModal;
