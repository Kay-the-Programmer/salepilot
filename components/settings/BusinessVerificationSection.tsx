import React, { useState } from 'react';
import { VerificationDocument } from '../../types';
import { api } from '../../services/api';

interface BusinessVerificationSectionProps {
    isEditing: boolean;
    verificationStatus: { isVerified: boolean; verificationDocuments: VerificationDocument[] } | null;
    onUploadSuccess: () => void;
}

const BusinessVerificationSection: React.FC<BusinessVerificationSectionProps> = ({ isEditing, verificationStatus, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('document', file);

        setUploading(true);
        setError(null);

        try {
            await api.postFormData('/verification/upload', formData);
            onUploadSuccess();
        } catch (err) {
            console.error('Upload failed', err);
            setError('Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Verification Status</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {verificationStatus?.isVerified
                            ? "Your business is verified. You have access to all features."
                            : "Upload business documents to verify your store."}
                    </p>
                </div>
                <div className="shrink-0">
                    {verificationStatus?.isVerified ? (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                            Verified
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>
                            Unverified
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Uploaded Documents
                </h4>
                {verificationStatus?.verificationDocuments && verificationStatus.verificationDocuments.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {verificationStatus.verificationDocuments.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{doc.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tighter">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors">View</a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No documents uploaded yet</p>
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Upload Document</label>
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="cursor-pointer inline-flex items-center px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-sm shadow-sm group">
                            <svg className="w-5 h-5 mr-2 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span>Choose Documentation</span>
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" disabled={uploading} />
                        </label>
                        {uploading && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold animate-pulse">
                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Uploading in progress...
                            </div>
                        )}
                    </div>
                    {error && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-2">
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</span>
                        </div>
                    )}
                    <div className="mt-4 flex items-start gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-900/20">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-tighter font-medium">
                            Documents should be clearly legible. Accepted formats: <span className="text-indigo-600 dark:text-indigo-400 font-bold">PDF, PNG, JPG</span>. Maximum file size <span className="text-indigo-600 dark:text-indigo-400 font-bold">5MB</span>.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessVerificationSection;
