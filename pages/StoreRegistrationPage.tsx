import React, { useMemo, useState, useEffect } from 'react';
import { SnackbarType } from '../App';
import { registerStoreAndRefreshUser, checkStoreNameAvailability } from '../services/storesService';
import { login, register, verifyRegistration } from '../services/authService';
import { User } from '../types';
import Logo from '../assets/salepilot.png';
import LocationPicker from '../components/ui/LocationPicker';
import { StepArt, StepArtKey } from '../components/registration/StepArt';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineBuildingStorefront,
    HiOutlinePhone,
    HiOutlineArrowLeft,
    HiCheckCircle,
    HiOutlineEnvelope,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineEye,
    HiOutlineEyeSlash,
} from 'react-icons/hi2';

interface StoreRegistrationPageProps {
    onCompleted: (user: User) => void;
    showSnackbar: (message: string, type?: SnackbarType) => void;
    requireAccount?: boolean;
}

const MIN_LEN = 2;

export const BUSINESS_TYPES = [
    { id: 'retail_grocery', label: 'Grocery & Supermarket', icon: '🛒' },
    { id: 'retail_fashion', label: 'Fashion & Apparel', icon: '👗' },
    { id: 'retail_electronics', label: 'Electronics & Gadgets', icon: '📱' },
    { id: 'food_beverage', label: 'Restaurant / Cafe', icon: '☕' },
    { id: 'pharmacy', label: 'Pharmacy & Health', icon: '💊' },
    { id: 'hardware', label: 'Hardware & Auto', icon: '🔧' },
    { id: 'other', label: 'Other', icon: '✨' },
];

type StepKey = 'account' | 'store' | 'type' | 'location';

const STORE_STEPS: { key: StepKey; label: string }[] = [
    { key: 'store', label: 'Store Info' },
    { key: 'type', label: 'Business Type' },
    { key: 'location', label: 'Location' },
];

const emailIsValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const StoreRegistrationPage: React.FC<StoreRegistrationPageProps> = ({
    onCompleted,
    showSnackbar,
    requireAccount = false
}) => {
    const navigate = useNavigate();

    const steps = useMemo(
        () => (requireAccount ? [{ key: 'account' as StepKey, label: 'Create Account' }, ...STORE_STEPS] : STORE_STEPS),
        [requireAccount],
    );

    const [currentStep, setCurrentStep] = useState(0);

    // Account state
    const [ownerName, setOwnerName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPendingOtp, setIsPendingOtp] = useState(false);
    const [emailOtp, setEmailOtp] = useState('');

    // Store state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingName, setIsCheckingName] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref') || params.get('referral');
        if (ref) setReferralCode(ref.toUpperCase());
    }, []);

    const trimmedName = useMemo(() => name.replace(/\s+/g, ' ').trim(), [name]);

    const isAccountValid = emailIsValid(email) && password.length >= 8 && password === confirmPassword;
    const isStoreValid = trimmedName.length >= MIN_LEN && !nameError && !isCheckingName;
    const isTypeValid = selectedTypes.length > 0;
    const isLocationValid = address.trim().length > 0;

    // Real-time store name availability
    useEffect(() => {
        if (trimmedName.length < MIN_LEN) {
            setNameError(null);
            setIsCheckingName(false);
            return;
        }
        setIsCheckingName(true);
        setNameError(null);
        const timer = setTimeout(async () => {
            try {
                const isAvailable = await checkStoreNameAvailability(trimmedName);
                if (!isAvailable) setNameError('This store name is already taken.');
                else setNameError(null);
            } catch (err) {
                console.error('Check failed', err);
            } finally {
                setIsCheckingName(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [trimmedName]);

    const toggleType = (id: string) => {
        setSelectedTypes(prev => (prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]));
    };

    const submitAccount = async () => {
        setError(null);
        if (!emailIsValid(email)) { setError('Please enter a valid email address.'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        setIsLoading(true);
        try {
            const accountName = ownerName.trim() || email.trim().split('@')[0];
            await register(accountName, email.trim(), password, referralCode.trim() || undefined);
            setIsPendingOtp(true);
            showSnackbar('Verification code sent to your email.', 'info');
        } catch (err: any) {
            const msg = err?.message ?? 'Could not create your account.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async () => {
        setError(null);
        if (emailOtp.length < 4) { setError('Please enter the verification code.'); return; }
        setIsLoading(true);
        try {
            await verifyRegistration(email.trim(), emailOtp);
            await login(email.trim(), password);
            setIsPendingOtp(false);
            setEmailOtp('');
            setCurrentStep(s => s + 1);
        } catch (err: any) {
            const msg = err?.message ?? 'Verification failed. Please try again.';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateStore = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { store, user } = await registerStoreAndRefreshUser(trimmedName, selectedTypes, phone, address);
            showSnackbar(`Store "${store.name}" created successfully! 🎉`, 'success');
            onCompleted(user);
        } catch (err: any) {
            const msg = err?.message || 'Failed to register store';
            setError(msg);
            showSnackbar(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const currentKey = steps[currentStep].key;
    // The OTP sub-state of the account step gets its own illustration.
    const artKey: StepArtKey = (currentKey === 'account' && isPendingOtp) ? 'otp' : (currentKey as StepArtKey);

    const handleNext = () => {
        setError(null);
        if (currentKey === 'account') {
            if (isPendingOtp) return verifyOtp();
            return submitAccount();
        }
        if (currentKey === 'store' && isStoreValid) return setCurrentStep(s => s + 1);
        if (currentKey === 'type' && isTypeValid) return setCurrentStep(s => s + 1);
        if (currentKey === 'location' && isLocationValid) return handleCreateStore();
    };

    const handleBack = () => {
        setError(null);
        if (currentKey === 'account' && isPendingOtp) {
            setIsPendingOtp(false);
            setEmailOtp('');
            return;
        }
        if (currentStep > 0) setCurrentStep(s => s - 1);
    };

    const progress = ((currentStep + 1) / steps.length) * 100;

    const isCurrentActionable = (() => {
        if (currentKey === 'account') return isPendingOtp ? emailOtp.length >= 4 : isAccountValid;
        if (currentKey === 'store') return isStoreValid;
        if (currentKey === 'type') return isTypeValid;
        return isLocationValid;
    })();

    const nextLabel = (() => {
        if (currentKey === 'account') return isPendingOtp ? 'Verify & Continue' : 'Continue';
        if (currentKey === 'location') return 'Create Store';
        return 'Continue';
    })();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-surface border-b border-brand-border flex items-center justify-between h-16 px-6">
                <img src={Logo} alt="SalePilot" className="h-7 object-contain" />
                {requireAccount && (
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Sign In
                    </button>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-2xl mx-auto px-4 py-8 w-full">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-brand-text-muted">
                            Step {currentStep + 1} of {steps.length}
                        </span>
                        <span className="text-sm font-medium text-brand-text">
                            {steps[currentStep].label}
                        </span>
                    </div>
                    <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-surface rounded-2xl shadow-sm border border-brand-border p-6">
                    {/* Animated step illustration (keyed so entrance anims replay per step) */}
                    <div key={artKey} className="mb-5 animate-in fade-in zoom-in-95 duration-300">
                        <StepArt step={artKey} />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-danger-muted border border-danger/30 rounded-lg">
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}

                    {/* Account Step */}
                    {currentKey === 'account' && !isPendingOtp && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1.5">
                                    Full Name <span className="text-brand-text-muted font-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                                    <input
                                        type="text"
                                        autoFocus
                                        className="w-full pl-9 pr-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        placeholder="Your name"
                                        value={ownerName}
                                        onChange={(e) => setOwnerName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1.5">Email Address</label>
                                <div className="relative">
                                    <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-9 pr-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1.5">Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="w-full pl-9 pr-10 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        placeholder="Minimum 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        className="w-full pl-9 pr-10 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && password !== confirmPassword && (
                                    <p className="mt-1 text-xs text-danger">Passwords do not match.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1.5">
                                    Referral Code <span className="text-brand-text-muted font-normal">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                    placeholder="Enter referral code"
                                    value={referralCode}
                                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>
                    )}

                    {/* OTP Verification */}
                    {currentKey === 'account' && isPendingOtp && (
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-sm text-brand-text-muted">
                                    We sent a 6-digit code to<br />
                                    <strong className="text-brand-text">{email}</strong>
                                </p>
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                autoFocus
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                placeholder="000000"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                disabled={isLoading}
                            />
                        </div>
                    )}

                    {/* Store Info Step */}
                    {currentKey === 'store' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1.5">
                                    Store Name <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <HiOutlineBuildingStorefront className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent ${nameError ? 'border-danger/50 bg-danger-muted/40' : 'border-brand-border'
                                            }`}
                                        placeholder="Your store name"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {isCheckingName ? (
                                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        ) : nameError ? (
                                            <span className="text-danger text-sm">✕</span>
                                        ) : isStoreValid && name.length > 0 ? (
                                            <HiCheckCircle className="w-4 h-4 text-success" />
                                        ) : null}
                                    </div>
                                </div>
                                {nameError && <p className="mt-1 text-xs text-danger">{nameError}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text mb-1.5">
                                    Phone Number <span className="text-brand-text-muted font-normal">(optional)</span>
                                </label>
                                <div className="relative">
                                    <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent"
                                        placeholder="+260 971 234 567"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Business Type Step */}
                    {currentKey === 'type' && (
                        <div className="space-y-4">
                            <p className="text-sm text-brand-text-muted">Select all categories that describe your store.</p>
                            <div className="grid grid-cols-2 gap-2">
                                {BUSINESS_TYPES.map((type) => {
                                    const active = selectedTypes.includes(type.id);
                                    return (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => toggleType(type.id)}
                                            className={`p-3 rounded-lg border-2 text-center transition-all ${active
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-brand-border hover:border-brand-border'
                                                }`}
                                        >
                                            <div className="text-2xl">{type.icon}</div>
                                            <div className={`text-xs font-medium mt-1 ${active ? 'text-primary' : 'text-brand-text'}`}>
                                                {type.label}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedTypes.length === 0 && (
                                <p className="text-xs text-warning">Please select at least one category.</p>
                            )}
                        </div>
                    )}

                    {/* Location Step */}
                    {currentKey === 'location' && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-brand-text mb-1.5">
                                Store Location <span className="text-danger">*</span>
                            </label>
                            <LocationPicker
                                onLocationSelect={(loc) => setAddress(loc.address)}
                                initialAddress={address}
                            />
                            {!address && (
                                <p className="text-xs text-warning">Please set your store location.</p>
                            )}

                            {/* Summary */}
                            <div className="mt-6 p-4 bg-surface-variant rounded-xl border border-brand-border">
                                <p className="text-xs font-semibold text-brand-text-muted uppercase tracking-wider mb-3">Summary</p>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-brand-text-muted">Store: </span>
                                        <span className="font-medium text-brand-text">{name || '—'}</span>
                                    </div>
                                    <div>
                                        <span className="text-brand-text-muted">Type: </span>
                                        <span className="font-medium text-brand-text">
                                            {selectedTypes.length > 0
                                                ? selectedTypes.map(id => BUSINESS_TYPES.find(t => t.id === id)?.label).join(', ')
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-brand-border">
                        {(currentStep > 0 || isPendingOtp) && (
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isLoading}
                                className="px-4 py-2.5 text-sm font-medium text-brand-text hover:text-brand-text border border-brand-border rounded-lg hover:bg-surface-variant transition-colors disabled:opacity-50"
                            >
                                <HiOutlineArrowLeft className="w-4 h-4 inline mr-1" />
                                Back
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={!isCurrentActionable || isLoading}
                            className={`flex-1 py-2.5 rounded-lg font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${currentKey === 'location'
                                ? 'bg-secondary hover:bg-secondary/90'
                                : 'bg-primary hover:bg-primary/90'
                                }`}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                nextLabel
                            )}
                        </button>
                    </div>
                </div>

                <p className="mt-4 text-center text-xs text-brand-text-muted">
                    Step {currentStep + 1} of {steps.length}
                </p>
            </main>

            {/* Footer */}
            <footer className="border-t border-brand-border bg-surface px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-xs text-brand-text-muted">© 2026 SalePilot Inc.</p>
                <div className="flex gap-4 text-xs">
                    <a href="#" className="text-brand-text-muted hover:text-brand-text">Help</a>
                    <a href="/privacy" className="text-brand-text-muted hover:text-brand-text">Privacy</a>
                    <a href="#" className="text-brand-text-muted hover:text-brand-text">Terms</a>
                </div>
            </footer>
        </div>
    );
};

export default StoreRegistrationPage;