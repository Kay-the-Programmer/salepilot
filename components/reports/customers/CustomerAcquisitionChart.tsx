import React from 'react';
import UsersIcon from '../../icons/UsersIcon';

export const CustomerAcquisitionChart: React.FC = () => {
    return (
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg mb-6">Customer Acquisition</h3>
            <div className="h-48 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <div className="text-center">
                    <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Customer trend data visualization would go here</p>
                    <p className="text-slate-400 text-xs mt-1">(Requires more detailed historical data)</p>
                </div>
            </div>
        </div>
    );
};
