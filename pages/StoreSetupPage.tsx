import React, { useMemo, useState, useEffect } from 'react';
import { SnackbarType } from '../App';
import { registerStoreAndRefreshUser, checkStoreNameAvailability } from '../services/storesService';
import { User } from '../types';
import logo from '../assets/salepilot.png';
import LocationPicker from '../components/common/LocationPicker';


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

  const trimmedName = useMemo(() => name.replace(/\s+/g, ' ').trim(), [name]);
  const isValid = trimmedName.length >= MIN_LEN && selectedTypes.length > 0 && !nameError && !isCheckingName;

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
      // For now, let's allow multiple selection, or maybe restrict to 1 main type?
      // User request implies "business type" (singular or plural).
      // Let's allow multiple for flexibility, but usually businesses have one primary.
      // Actually backend logic supports multiple.
      return [...prev, id];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError(`Store name must be at least ${MIN_LEN} characters.`);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const { store, user } = await registerStoreAndRefreshUser(trimmedName, selectedTypes, phone, address);
      // Persist updated user immediately (ensure token unchanged and currentStoreId present)
      localStorage.setItem('salePilotUser', JSON.stringify(user));
      showSnackbar(`Store "${store.name}" created! You're now the admin.`, 'success');
      onCompleted(user);
    } catch (err: any) {
      const msg = err?.message || 'Failed to register store';
      setError(msg);
      showSnackbar(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh-light dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 font-google">
      <div className="w-full max-w-2xl flex flex-col items-center mb-8">
        <div className="h-20 w-20 bg-white/60 dark:bg-slate-800/60 rounded-3xl shadow-sm border border-white/40 dark:border-white/5 backdrop-blur-xl flex items-center justify-center p-3 mb-6">
          <img src={logo} alt="SalePilot" className="w-full h-full object-contain drop-shadow-sm" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white tracking-tight">Welcome to SalePilot</h2>
        <p className="text-center text-gray-600 dark:text-slate-400 mt-3 text-lg">Let's set up your first store. It only takes a minute.</p>
      </div>

      <div className="w-full max-w-2xl">
        <div className="liquid-glass-card rounded-[2.5rem] dark:bg-slate-900/90 py-8 px-6 sm:px-12 border border-white/60 dark:border-white/5 backdrop-blur-2xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-10" aria-live="polite">

            {/* Step 1: Basics */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shadow-sm">1</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 tracking-tight">Store Details</h3>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2 relative">
                  <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Store Name <span className="text-red-500">*</span></span>
                    {isValid && !isCheckingName && (
                      <span className="text-emerald-500 text-xs font-semibold flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Looks good
                      </span>
                    )}
                  </label>
                  <div className="relative group">
                    <input
                      id="store-name"
                      type="text"
                      required
                      minLength={MIN_LEN}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-4 pr-12 py-3.5 rounded-2xl border placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm ${nameError ? 'border-red-500 bg-red-50 dark:bg-red-500/10 focus:ring-red-500/50' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white hover:border-gray-300 dark:hover:border-slate-600'}`}
                      placeholder="e.g., Downtown Minimart"
                      aria-invalid={!!nameError}
                      autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      {isCheckingName ? (
                        <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : nameError ? (
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      ) : null}
                    </div>
                  </div>
                  {nameError ? (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {nameError}
                    </p>
                  ) : (
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        This is what your customers and staff will see.
                      </span>
                      <span className={`tabular-nums font-medium ${trimmedName.length >= MIN_LEN ? 'text-emerald-500 font-semibold' : ''}`}>{trimmedName.length}/{MIN_LEN}+</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="store-phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Store Phone Number <span className="text-gray-400 font-normal ml-1">(Optional)</span></span>
                  </label>
                  <input
                    id="store-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm hover:border-gray-300 dark:hover:border-slate-600"
                    placeholder="e.g., +260 971 234 567"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Used for customer receipts and official communication.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Location & Type */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shadow-sm">2</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100 tracking-tight">Location & Category</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Store Location <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                <LocationPicker
                  onLocationPicked={(addr) => setAddress(addr)}
                  initialAddress={address}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">What does your business sell? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleType(type.id)}
                      className={`
                        relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden group
                        ${selectedTypes.includes(type.id)
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 shadow-md transform scale-[1.02]'
                          : 'border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-gray-600 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-sm'
                        }
                      `}
                    >
                      {/* Selection indicator background flare */}
                      {selectedTypes.includes(type.id) && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
                      )}

                      <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{type.icon}</span>
                      <span className="text-xs font-semibold text-center leading-tight z-10">{type.label}</span>

                      {selectedTypes.includes(type.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center shadow-sm z-10 animate-in zoom-in">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                {selectedTypes.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-500 font-medium flex items-center gap-1.5 animate-in fade-in">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Please select at least one category.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-800">
              {/* Process helper block - cleaner design */}
              <div className="rounded-2xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-100/50 dark:border-blue-500/20 p-5 mb-6 backdrop-blur-sm shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-xl shrink-0">
                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 text-sm">Almost there!</h4>
                    <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                      Clicking create will set up your secure workspace. You'll instantly become the store admin and can start adding inventory or teammates right away.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3 animate-in shake" role="alert">
                  <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="w-full py-4 text-base font-semibold rounded-2xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span>Setting up your workspace…</span>
                  </>
                ) : (
                  <>
                    <span>Create My Store</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

              <div className="mt-5 text-xs text-center text-gray-500 dark:text-slate-500">
                By continuing, you are agreeing to establish this business in compliance with local regulations.
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoreSetupPage;
