import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface LocationPickerProps {
    onLocationSelect: (location: Location) => void;
    initialAddress?: string;
    onClose: () => void;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: -15.4167, // Lusaka
    lng: 28.2833
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, initialAddress, onClose }) => {
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const [position, setPosition] = useState<google.maps.LatLngLiteral>(defaultCenter);
    const [address, setAddress] = useState(initialAddress || '');
    const [isLoading, setIsLoading] = useState(false);

    const mapRef = useRef<google.maps.Map | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    // Attempt to get current location or use initial address if we can geocode it
    useEffect(() => {
        if ("geolocation" in navigator && !initialAddress) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
                reverseGeocode(newPos.lat, newPos.lng);
            }, undefined, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        }
    }, [initialAddress]);

    const reverseGeocode = async (lat: number, lng: number) => {
        if (!window.google || !window.google.maps) return;

        setIsLoading(true);
        const geocoder = new window.google.maps.Geocoder();

        try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
                const displayName = response.results[0].formatted_address;
                setAddress(displayName);
            } else {
                setAddress(`${lat}, ${lng}`);
            }
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            setAddress(`${lat}, ${lng}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setPosition({ lat, lng });
            reverseGeocode(lat, lng);
        }
    }, []);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setPosition({ lat, lng });
                const displayName = place.formatted_address || place.name || `${lat}, ${lng}`;
                setAddress(displayName);

                if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(16);
                }
            }
        }
    };

    const handleConfirm = () => {
        onLocationSelect({
            lat: position.lat,
            lng: position.lng,
            address: address
        });
    };

    if (loadError) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Maps Error</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">Failed to load Google Maps. Please check your internet connection and API key.</p>
                    <button onClick={onClose} className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="liquid-glass-card rounded-[2.5rem] w-full max-w-5xl overflow-hidden flex flex-col h-[85vh] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/10">
                <div className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-white/5 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Store Location</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Search or click on the map to set your address</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                    {!isLoaded ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <span className="text-slate-500 font-medium">Initializing Maps...</span>
                        </div>
                    ) : (
                        <div className="h-full w-full relative">
                            {/* Autocomplete Overlay */}
                            <div className="absolute top-6 left-6 right-6 z-10 max-w-md">
                                <Autocomplete
                                    onLoad={onLoadAutocomplete}
                                    onPlaceChanged={onPlaceChanged}
                                >
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search for an address or place..."
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        />
                                    </div>
                                </Autocomplete>
                            </div>

                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                zoom={15}
                                center={position}
                                onClick={handleMapClick}
                                onLoad={onMapLoad}
                                options={{
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false,
                                    zoomControlOptions: {
                                        position: window.google?.maps?.ControlPosition?.RIGHT_CENTER,
                                    },
                                    styles: [
                                        {
                                            featureType: "poi",
                                            elementType: "labels",
                                            stylers: [{ visibility: "off" }]
                                        }
                                    ]
                                }}
                            >
                                <Marker
                                    position={position}
                                    draggable={true}
                                    onDragEnd={handleMapClick}
                                    animation={window.google?.maps?.Animation?.DROP}
                                />
                            </GoogleMap>

                            {/* Floating Address Indicator */}
                            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-auto md:max-w-md z-10 slide-in-bottom">
                                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">Selected Location</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {isLoading ? "Fetching address..." : address || "Pin a location"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {isLoading && (
                                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!address || isLoading}
                        className="px-10 py-3 bg-blue-600 dark:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                    >
                        Confirm Location
                    </button>
                </div>
            </div>

            <style>{`
                .slide-in-bottom {
                    animation: slide-in-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                }
                @keyframes slide-in-bottom {
                    0% { transform: translateY(100px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default LocationPicker;
