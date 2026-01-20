import React, { useMemo, useState } from 'react';
import { SnackbarType } from '../App';
import { registerStoreAndRefreshUser } from '../services/storesService';
import { User } from '../types';

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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedName = useMemo(() => name.replace(/\s+/g, ' ').trim(), [name]);
  const isValid = trimmedName.length >= MIN_LEN && selectedTypes.length > 0;

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
      const { store, user } = await registerStoreAndRefreshUser(trimmedName, selectedTypes);
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
            <svg className="h-10 w-auto text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7 21a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7zM9 5v2h6V5H9zm0 4v2h6V9H9zm0 4v2h6v-2H9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">SalePilot</h1>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-3xl sm:px-10">
          <h2 className="text-2xl font-bold text-center text-gray-800">Create Your Store</h2>
          <p className="text-center text-gray-600 mt-2">Finish setup by creating your first store. Your data will be isolated to this store.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6" aria-live="polite">
            <div>
              <label htmlFor="store-name" className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
              <input
                id="store-name"
                type="text"
                required
                minLength={MIN_LEN}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Acme Market"
                aria-invalid={!isValid}
                aria-describedby="store-name-help"
                autoFocus
              />
              <div id="store-name-help" className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                <span>
                  Minimum {MIN_LEN} characters. Use your business or branch name. You can change this later in Settings.
                </span>
                <span className={`tabular-nums ${isValid ? 'text-gray-400' : 'text-red-600'}`}>{trimmedName.length}/{MIN_LEN}+</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What does your business sell?</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={`
                      relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                      ${selectedTypes.includes(type.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm scale-[1.02]'
                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-white'
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
              <p className="mt-2 text-xs text-gray-500">Select one or more categories that best describe your store.</p>
            </div>

            {/* Process helper */}
            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <div className="flex items-start">
                <svg className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11a.75.75 0 011.5 0v4.25a.75.75 0 01-1.5 0V7zm.75 6a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium">What happens next?</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
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

            <div className="text-xs text-gray-500 text-center">By continuing, you agree to follow your local tax and business rules.</div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoreSetupPage;
