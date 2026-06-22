import React, { useState } from 'react';
import { VerificationDocument } from '../../types';
import { api } from '../../services/api';
import '../../pages/assistant/assistant.css';

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
        setUploading(true); setError(null);
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

    const verified = !!verificationStatus?.isVerified;
    const docs = verificationStatus?.verificationDocuments || [];

    return (
        <div className="sp-assistant space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between gap-3 p-4 m3-bg-surface-container rounded-2xl">
                <div className="min-w-0">
                    <h4 className="font-bold m3-text-on-surface">Verification status</h4>
                    <p className="text-sm m3-text-on-surface-variant mt-0.5">{verified ? 'Your business is verified. You have access to all features.' : 'Upload business documents to verify your store.'}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 ${verified ? 'm3-bg-primary-container m3-text-on-primary-container' : 'm3-bg-secondary-fixed m3-text-secondary'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${verified ? 'm3-bg-primary' : 'm3-bg-secondary'}`} />{verified ? 'Verified' : 'Unverified'}
                </span>
            </div>

            {/* Documents */}
            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider m3-text-on-surface-variant mb-2 flex items-center gap-1.5"><span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 18 }}>description</span>Uploaded documents</h4>
                {docs.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {docs.map((doc) => (
                            <li key={doc.id} className="m3-bg-surface-lowest rounded-xl border m3-border-outline-variant shadow-sm flex items-center justify-between gap-2 p-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="w-9 h-9 rounded-lg m3-bg-primary-fixed m3-text-primary flex items-center justify-center shrink-0"><span className="material-symbols-outlined" style={{ fontSize: 20 }}>draft</span></span>
                                    <div className="min-w-0"><p className="text-sm font-bold m3-text-on-surface truncate">{doc.name}</p><p className="text-[10px] m3-text-on-surface-variant uppercase tracking-wide">{new Date(doc.uploadedAt).toLocaleDateString()}</p></div>
                                </div>
                                <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold m3-text-primary m3-bg-primary-fixed px-3 py-1.5 rounded-lg transition">View</a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 m3-bg-surface-container border-2 border-dashed m3-border-outline-variant rounded-2xl">
                        <span className="material-symbols-outlined m3-text-outline" style={{ fontSize: 32 }}>folder_open</span>
                        <p className="text-sm m3-text-on-surface-variant mt-1">No documents uploaded yet</p>
                    </div>
                )}
            </div>

            {/* Upload */}
            {isEditing && (
                <div className="pt-4 border-t m3-border-outline-variant">
                    <label className="block text-sm font-bold m3-text-on-surface mb-3">Upload document</label>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 m3-bg-surface-lowest border-2 m3-border-outline-variant rounded-xl font-bold text-sm m3-text-on-surface hover:m3-border-primary transition active:scale-95">
                            <span className="material-symbols-outlined m3-text-primary" style={{ fontSize: 20 }}>upload_file</span>Choose documentation
                            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" disabled={uploading} />
                        </label>
                        {uploading && (
                            <div className="flex items-center gap-2 px-4 py-2 m3-bg-primary-fixed m3-text-primary rounded-xl text-xs font-bold"><span className="material-symbols-outlined animate-spin" style={{ fontSize: 16 }}>progress_activity</span>Uploading…</div>
                        )}
                    </div>
                    {error && <div className="mt-3 p-3 m3-bg-error-container rounded-xl"><span className="text-sm m3-text-error font-medium">{error}</span></div>}
                    <div className="mt-4 flex items-start gap-3 p-4 m3-bg-surface-container rounded-xl">
                        <span className="material-symbols-outlined m3-text-primary shrink-0" style={{ fontSize: 20 }}>info</span>
                        <p className="text-xs m3-text-on-surface-variant leading-relaxed">Documents should be clearly legible. Accepted formats: <strong className="m3-text-on-surface">PDF, PNG, JPG</strong>. Maximum size <strong className="m3-text-on-surface">5MB</strong>.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessVerificationSection;
