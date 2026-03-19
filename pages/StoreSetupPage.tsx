import React, { useMemo, useState, useEffect } from 'react';
import { SnackbarType } from '../App';
import { registerStoreAndRefreshUser, checkStoreNameAvailability, verifyStoreOTP } from '../services/storesService';
import { User } from '../types';
import logo from '../assets/salepilot.png';
import LocationPicker from '../components/ui/LocationPicker';

interface StoreSetupPageProps {
  onCompleted: (user: User) => void;
  showSnackbar: (message: string, type?: SnackbarType) => void;
}

const MIN_LEN = 2;

const BUSINESS_TYPES = [
  { id: 'retail_grocery', label: 'Grocery & Supermarket', icon: '🛒' },
  { id: 'retail_fashion', label: 'Fashion & Apparel', icon: '👗' },
  { id: 'retail_electronics', label: 'Electronics & Gadgets', icon: '📱' },
  { id: 'food_beverage', label: 'Restaurant / Cafe', icon: '☕' },
  { id: 'pharmacy', label: 'Pharmacy & Health', icon: '💊' },
  { id: 'hardware', label: 'Hardware & Auto', icon: '🔧' },
  { id: 'other', label: 'Other', icon: '✨' }
];

const StoreSetupPage: React.FC<StoreSetupPageProps> = ({ onCompleted, showSnackbar }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [registeredInfo, setRegisteredInfo] = useState<{ store: any; user: User } | null>(null);

  const trimmedName = useMemo(() => name.replace(/\s+/g, ' ').trim(), [name]);
  
  // Step validation
  const isStep1Valid = trimmedName.length >= MIN_LEN && !nameError && !isCheckingName;
  const isStep2Valid = selectedTypes.length > 0;
  const isStep3Valid = address.trim().length > 0;
  const isStep4Valid = otp.trim().length === 6;

  // Real-time name availability check with debouncing
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
        if (!isAvailable) {
          setNameError('This store name is already taken. Please choose another.');
        } else {
          setNameError(null);
        }
      } catch (err) {
        console.error('Check failed', err);
      } finally {
        setIsCheckingName(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [trimmedName]);

  const toggleType = (id: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(id)) return prev.filter(t => t !== id);
      return [...prev, id];
    });
  };

  const handleNextStep = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3);
    } else if (currentStep === 3 && isStep3Valid) {
      handleCreateStore();
    }
  };

  const handleCreateStore = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { store, user } = await registerStoreAndRefreshUser(trimmedName, selectedTypes, phone, address);
      setRegisteredInfo({ store, user });
      setCurrentStep(4);
      showSnackbar(`Store created! Please check your email for the verification code.`, 'success');
    } catch (err: any) {
      const msg = err?.message || 'Failed to register store';
      setError(msg);
      showSnackbar(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredInfo || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setIsVerifying(true);
    setError(null);

    try {
      await verifyStoreOTP(registeredInfo.store.id, otp);
      localStorage.setItem('salePilotUser', JSON.stringify(registeredInfo.user));
      showSnackbar(`Store "${registeredInfo.store.name}" verified! You're now the admin.`, 'success');
      onCompleted(registeredInfo.user);
    } catch (err: any) {
      const msg = err?.message || 'Verification failed';
      setError(msg);
      showSnackbar(msg, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  currentStep >= step
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-200 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                }`}
              >
                {currentStep > step ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span className={`text-xs mt-2 font-medium text-center absolute -bottom-6 w-20 ${
                currentStep >= step ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'
              }`}>
                {step === 1 ? 'Store Info' : step === 2 ? 'Business Type' : step === 3 ? 'Location' : 'Verification'}
              </span>
            </div>
            {step < 4 && (
              <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-800'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const StepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tell us about your store</h3>
              <p className="text-gray-600 dark:text-slate-400 mt-2">Let's start with the basics</p>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="store-name"
                    type="text"
                    required
                    minLength={MIN_LEN}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-4 pr-12 py-4 rounded-xl border ${
                      nameError 
                        ? 'border-red-500 bg-red-50 dark:bg-red-500/10 focus:ring-red-500/50' 
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:ring-blue-500/50'
                    } focus:outline-none focus:ring-2 focus:border-blue-500 transition-all shadow-sm`}
                    placeholder="e.g., Downtown Minimart"
                    aria-invalid={!!nameError}
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    {isCheckingName ? (
                      <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : nameError ? (
                      <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : isStep1Valid && (
                      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                {nameError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {nameError}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  This is what your customers and staff will see
                </p>
              </div>

              <div>
                <label htmlFor="store-phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                  Store Phone Number <span className="text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  id="store-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="e.g., +260 971 234 567"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                  Used for customer receipts and official communication
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-5-5A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">What does your business sell?</h3>
              <p className="text-gray-600 dark:text-slate-400 mt-2">Select the categories that best describe your store</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-4">
                Business Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={`
                      relative flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02]
                      ${selectedTypes.includes(type.id)
                        ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-md'
                        : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-gray-600 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-700'
                      }
                    `}
                  >
                    <span className="text-3xl mb-2">{type.icon}</span>
                    <span className="text-xs font-semibold text-center">{type.label}</span>
                    {selectedTypes.includes(type.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedTypes.length === 0 && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please select at least one category to continue
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Where's your store located?</h3>
              <p className="text-gray-600 dark:text-slate-400 mt-2">Help customers find you easily</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Store Location <span className="text-red-500">*</span>
              </label>
              <LocationPicker
                onLocationSelect={(loc) => setAddress(loc.address)}
                initialAddress={address}
              />
              {!address && (
                <p className="mt-2 text-sm text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Please set your store location to continue
                </p>
              )}
            </div>

            {/* Summary of previous steps */}
            <div className="mt-8 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Summary
              </h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-slate-400">
                  <span className="font-medium">Store:</span> {name || 'Not set yet'}
                </p>
                <p className="text-gray-600 dark:text-slate-400">
                  <span className="font-medium">Category:</span> {selectedTypes.length > 0 
                    ? selectedTypes.map(id => BUSINESS_TYPES.find(t => t.id === id)?.label).join(', ')
                    : 'Not selected'}
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify your email</h3>
              <p className="text-gray-600 dark:text-slate-400 max-w-sm mx-auto">
                We sent a 6-digit verification code to the email associated with your account.
                Enter it below to complete your store setup.
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 text-center">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="------"
                autoFocus
              />
              <p className="mt-3 text-xs text-gray-500 dark:text-slate-400 text-center">
                Didn't receive the code? Check your spam folder or click resend
              </p>
            </div>

            {/* Store details confirmation */}
            {registeredInfo && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Store "{registeredInfo.store.name}" created successfully!
                </p>
              </div>
            )}
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="w-full max-w-2xl">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-white/80 dark:bg-slate-800/80 rounded-2xl shadow-lg border border-white/60 dark:border-white/5 backdrop-blur-xl flex items-center justify-center p-3 mx-auto mb-4">
            <img src={logo} alt="SalePilot" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Set up your store</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-2">Complete these 4 steps to get started with SalePilot</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

        {/* Main Card */}
        <div className="bg-white/80 dark:bg-slate-900/90 rounded-2xl py-8 px-6 sm:px-8 border border-white/60 dark:border-white/5 backdrop-blur-xl shadow-xl">
          {/* Step Content */}
          {StepContent()}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3" role="alert">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3">
            {currentStep > 1 && currentStep < 4 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-4 px-4 rounded-xl border-2 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-all duration-300"
              >
                Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid) ||
                  (currentStep === 3 && !isStep3Valid) ||
                  isLoading
                }
                className={`flex-1 py-4 px-4 rounded-xl font-semibold text-white transition-all duration-300 ${
                  ((currentStep === 1 && isStep1Valid) ||
                   (currentStep === 2 && isStep2Valid) ||
                   (currentStep === 3 && isStep3Valid)) && !isLoading
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 active:scale-[0.98]'
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>Creating...</span>
                  </div>
                ) : (
                  currentStep === 3 ? 'Create Store' : 'Continue'
                )}
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleVerifyOtp}
                disabled={!isStep4Valid || isVerifying}
                className="w-full py-4 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:shadow-none transition-all duration-300 active:scale-[0.98]"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify & Complete Setup'
                )}
              </button>
            )}
          </div>

          {/* Progress text */}
          {currentStep < 4 && (
            <p className="mt-6 text-xs text-center text-gray-500 dark:text-slate-500">
              Step {currentStep} of 4: {currentStep === 1 ? 'Store Information' : currentStep === 2 ? 'Business Type' : 'Store Location'}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StoreSetupPage;