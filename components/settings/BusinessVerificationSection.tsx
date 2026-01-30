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
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                    <h4 className="font-semibold text-slate-900">Verification Status</h4>
                    <p className="text-sm text-slate-500">
                        {verificationStatus?.isVerified
                            ? "Your business is verified. You have access to all features."
                            : "Upload business documents to verify your store."}
                    </p>
                </div>
                <div>
                    {verificationStatus?.isVerified ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            Verified
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                            Pending / Unverified
                        </span>
                    )}
                </div>
            </div>

            <div>
                <h4 className="font-medium text-slate-900 mb-2">Uploaded Documents</h4>
                {verificationStatus?.verificationDocuments && verificationStatus.verificationDocuments.length > 0 ? (
                    <ul className="space-y-2">
                        {verificationStatus.verificationDocuments.map((doc) => (
                            <li key={doc.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                                        <p className="text-xs text-slate-500">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-800 font-medium">View</a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400 italic">No documents uploaded yet.</p>
                )}
            </div>

            {isEditing && (
                <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Upload New Document</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all text-sm">
                            <span className="mr-2">Choose File</span>
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" disabled={uploading} />
                        </label>
                        {uploading && <span className="text-sm text-blue-600 animate-pulse">Uploading...</span>}
                    </div>
                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                    <p className="text-xs text-slate-500 mt-2">Accepted formats: PDF, PNG, JPG (Max 5MB)</p>
                </div>
            )}
        </div>
    );
};

export default BusinessVerificationSection;
