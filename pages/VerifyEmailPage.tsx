import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import Logo from '../assets/logo.png';
import { HiCheckCircle, HiXCircle } from 'react-icons/hi2';

export default function VerifyEmailPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('Missing verification token.');
            return;
        }

        verifyEmail(token)
            .then(() => {
                setStatus('success');
                setTimeout(() => navigate('/login'), 3000);
            })
            .catch((err) => {
                setStatus('error');
                setErrorMsg(err.message || 'Verification failed. Token may be expired.');
            });
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-mesh-light flex flex-col items-center justify-center p-4 font-sans font-google">
            <div className="liquid-glass-card rounded-[2rem] w-full max-w-sm p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <img src={Logo} alt="SalePilot" className="h-10 object-contain" />
                </div>

                {status === 'verifying' && (
                    <div className="py-8">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-slate-900">Verifying Email...</h2>
                        <p className="text-slate-500 text-sm mt-2">Please wait while we verify your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-8 animate-in fade-in zoom-in">
                        <HiCheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Email Verified!</h2>
                        <p className="text-slate-500 text-sm mt-2">Your account has been successfully verified.</p>
                        <p className="text-xs text-slate-400 mt-4">Redirecting to login...</p>
                        <button onClick={() => navigate('/login')} className="mt-6 text-blue-600 font-bold hover:underline text-sm">
                            Go to Login
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-8 animate-in fade-in zoom-in">
                        <HiXCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900">Verification Failed</h2>
                        <p className="text-rose-600 text-sm mt-2 bg-rose-50 p-3 rounded-lg">{errorMsg}</p>
                        <button onClick={() => navigate('/login')} className="mt-8 w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors active:scale-95 transition-all duration-300">
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
