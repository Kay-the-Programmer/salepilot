// pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        storeName: '',
        subdomain: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.storeName.trim()) newErrors.storeName = 'Store name is required';
        if (!formData.subdomain.trim()) {
            newErrors.subdomain = 'Subdomain is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.subdomain)) {
            newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
        }

        if (!formData.ownerName.trim()) newErrors.ownerName = 'Your name is required';

        if (!formData.ownerEmail.trim()) {
            newErrors.ownerEmail = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
            newErrors.ownerEmail = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await api.post<{ user: any, store: { subdomain: string } }>('/stores/register', {
                storeName: formData.storeName,
                subdomain: formData.subdomain,
                ownerName: formData.ownerName,
                ownerEmail: formData.ownerEmail,
                password: formData.password
            });

            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.user));

            // Redirect to the new store dashboard
            window.location.href = `https://${response.store.subdomain}.yourdomain.com/dashboard`;
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
            setErrors({ submit: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mesh-light dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans transition-colors duration-500 font-google">
            {/* Ambient Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/40 dark:bg-blue-900/10 blur-[100px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 dark:bg-indigo-900/10 blur-[100px] pointer-events-none" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                <img className="mx-auto h-16 w-auto drop-shadow-sm dark:invert dark:brightness-200" src="/assets/logo.png" alt="SalePilot" />
                <h2 className="mt-8 text-center text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Create your store
                </h2>
                <p className="mt-3 text-center text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Start your 14-day free trial.
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-in slide-in-from-bottom-6 duration-700">
                <div glass-effect="" className="liquid-glass-card rounded-[2rem] /80 dark:bg-slate-900/80 py-10 px-6 -slate-200/50 dark:-black/50 border border-white/50 dark:border-slate-800/50 backdrop-blur-xl sm:rounded-[2.5rem] sm:px-12">
                    {errors.submit && (
                        <div className="mb-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-4 rounded-2xl text-center">
                            <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wide">{errors.submit}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="storeName" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-2">
                                Store name
                            </label>
                            <div className="relative group">
                                <input
                                    id="storeName"
                                    name="storeName"
                                    type="text"
                                    required
                                    className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-0 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold"
                                    placeholder="Your Store Name"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                />
                                {errors.storeName && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-wider px-2">{errors.storeName}</p>}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="subdomain" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 px-2">
                                Subdomain
                            </label>
                            <div className="mt-1 flex rounded-2xl overflow-hidden shadow-sm group">
                                <input
                                    id="subdomain"
                                    name="subdomain"
                                    type="text"
                                    required
                                    className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-0 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-bold"
                                    placeholder="my-store"
                                    value={formData.subdomain}
                                    onChange={handleChange}
                                />
                                <span className="inline-flex items-center px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold border-l border-slate-200 dark:border-slate-700">
                                    .yourdomain.com
                                </span>
                            </div>
                            {errors.subdomain && <p className="mt-2 text-[10px] font-bold text-rose-500 uppercase tracking-wider px-2">{errors.subdomain}</p>}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-5 px-4 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-slate-900/20 dark:shadow-white/10 transform transition-all active:scale-[0.98] hover:translate-y-[-2px] active:scale-95 transition-all duration-300"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" />
                                ) : (
                                    'CREATE STORE'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Already have a store?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;