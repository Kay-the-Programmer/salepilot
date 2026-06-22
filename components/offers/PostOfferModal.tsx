import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';
import LocationPicker from '../ui/LocationPicker';
import { offersService } from '../../services/offersService';

interface PostOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOfferCreated: (offer: any) => void;
}

export default function PostOfferModal({ isOpen, onClose, onOfferCreated }: PostOfferModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!location) {
            setError('Please select a location on the map.');
            return;
        }

        setLoading(true);
        try {
            const offer = await offersService.create({
                title,
                description,
                latitude: location.lat,
                longitude: location.lng
            });
            onOfferCreated(offer);
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setLocation(null);
        } catch (err: any) {
            setError(typeof err === 'string' ? err : err.message || 'Failed to post offer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-warm-900/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="bg-surface border border-brand-border rounded-2xl shadow-xl w-full max-w-2xl transform overflow-hidden p-6 text-left align-middle transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-extrabold tracking-tight leading-6 text-brand-text">
                                        Post New Offer
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text">
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-brand-text">Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="mt-1 block w-full rounded-xl border border-brand-border bg-surface px-3 py-2 text-brand-text placeholder-brand-text-muted shadow-sm focus:border-sp-green focus:outline-none focus:ring-1 focus:ring-sp-green"
                                            placeholder="I need..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-brand-text">Description</label>
                                        <textarea
                                            rows={3}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="mt-1 block w-full rounded-xl border border-brand-border bg-surface px-3 py-2 text-brand-text placeholder-brand-text-muted shadow-sm focus:border-sp-green focus:outline-none focus:ring-1 focus:ring-sp-green"
                                            placeholder="Details about what you are looking for..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-brand-text mb-2">Location (Required)</label>
                                        <p className="text-xs text-brand-text-muted mb-2">Drag the marker to your location.</p>
                                        <LocationPicker
                                            onLocationSelect={(loc) => setLocation({ lat: loc.lat, lng: loc.lng })}
                                        />
                                        {location && (
                                            <p className="text-xs text-success mt-1">
                                                Selected: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                            </p>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="text-danger text-sm">{error}</div>
                                    )}

                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-xl border border-brand-border bg-surface-variant px-4 py-2 text-sm font-semibold text-brand-text hover:bg-brand-border focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-border focus-visible:ring-offset-2 mr-2 active:scale-95 transition-all"
                                            onClick={onClose}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex justify-center rounded-xl border border-transparent bg-sp-green px-4 py-2 text-sm font-bold text-white hover:bg-sp-green-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-sp-green focus-visible:ring-offset-2 disabled:opacity-50 active:scale-95 transition-all"
                                        >
                                            {loading ? 'Posting...' : 'Post Offer'}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
