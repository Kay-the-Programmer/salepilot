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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <img src={logo} alt="SalePilot" className="h-16 w-auto object-contain" />
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-3xl sm:px-10 border border-transparent dark:border-white/5 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">Create Your Store</h2>
          <p className="text-center text-gray-600 dark:text-slate-400 mt-2">Finish setup by creating your first store. Your data will be isolated to this store.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" aria-live="polite">
            <div>
              <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Name</label>
              <input
                id="store-name"
                type="text"
                required
                minLength={MIN_LEN}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-3 rounded-md border placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${nameError ? 'border-red-500 bg-red-50 dark:bg-red-500/10 dark:border-red-500' : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white'
                  }`}
                placeholder="e.g., Acme Market"
                aria-invalid={!!nameError}
                aria-describedby="store-name-help"
                autoFocus
              />
              {nameError && <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{nameError}</p>}
              {isCheckingName && <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 animate-pulse">Scanning store name availability...</p>}
              <div id="store-name-help" className="mt-2 text-xs text-gray-600 dark:text-slate-400 flex items-center justify-between">
                <span>
                  Minimum {MIN_LEN} characters. Use your business or branch name. You can change this later in Settings.
                </span>
                <span className={`tabular-nums ${isValid ? 'text-gray-400 dark:text-slate-500' : 'text-red-600 dark:text-red-400'}`}>{trimmedName.length}/{MIN_LEN}+</span>
              </div>
            </div>

            <div>
              <label htmlFor="store-phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Store Phone Number</label>
              <input
                id="store-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., +260 971 234 567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Store Location</label>
              <LocationPicker
                onLocationPicked={(addr) => setAddress(addr)}
                initialAddress={address}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">What does your business sell?</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={`
                      relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                      ${selectedTypes.includes(type.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 shadow-sm scale-[1.02]'
                        : 'border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-400 hover:border-gray-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200'
                      }
                    `}
                  >
                    <span className="text-2xl mb-1">{type.icon}</span>
                    <span className="text-xs font-semibold text-center leading-tight">{type.label}</span>

                    {selectedTypes.includes(type.id) && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-500">Select one or more categories that best describe your store.</p>
            </div>

            {/* Process helper */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 text-sm text-blue-800 dark:text-blue-200">
              <div className="flex items-start">
                <svg className="h-5 w-5 mr-3 text-blue-500 dark:text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11a.75.75 0 011.5 0v4.25a.75.75 0 01-1.5 0V7zm.75 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">What happens next?</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 opacity-90">
                    <li>We’ll create your store and make you its admin.</li>
                    <li>You’ll be redirected to the dashboard to start using SalePilot.</li>
                    <li>Requires internet connection. If you’re offline, please try again later.</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}

            <button
              type="submit"
              disabled={isLoading || !isValid}
              className="w-full py-3 px-4 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              <span>{isLoading ? 'Creating your store…' : 'Create Store'}</span>
            </button>

            <div className="text-xs text-gray-500 dark:text-slate-500 text-center">By continuing, you agree to follow your local tax and business rules.</div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoreSetupPage;
