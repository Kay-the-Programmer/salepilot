import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const libraries: ("places" | "geometry" | "drawing" | "localContext" | "visualization")[] = ["places"];

interface LocationPickerProps {
    onLocationPicked: (address: string, lat: number, lng: number) => void;
    initialAddress?: string;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: -1.286389, // Default to Nairobi
    lng: 36.817223
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationPicked, initialAddress }) => {
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

    // Get user's current location on mount if no initial address is set
    useEffect(() => {
        if ("geolocation" in navigator && !initialAddress) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(newPos);
                reverseGeocode(newPos.lat, newPos.lng);
            }, (err) => {
                console.warn("Geolocation failed or denied", err);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        }
    }, [initialAddress]);

    const reverseGeocode = async (lat: number, lng: number) => {
        // Ensure google maps API is loaded before using geocoder
        if (!window.google || !window.google.maps) return;

        setIsLoading(true);
        const geocoder = new window.google.maps.Geocoder();

        try {
            const response = await geocoder.geocode({ location: { lat, lng } });
            if (response.results[0]) {
                const displayName = response.results[0].formatted_address;
                setAddress(displayName);
                onLocationPicked(displayName, lat, lng);
            } else {
                const fallback = `${lat}, ${lng}`;
                setAddress(fallback);
                onLocationPicked(fallback, lat, lng);
            }
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            const fallback = `${lat}, ${lng}`;
            setAddress(fallback);
            onLocationPicked(fallback, lat, lng);
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
                onLocationPicked(displayName, lat, lng);

                if (mapRef.current) {
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(16);
                }
            }
        }
    };

    if (loadError) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Error loading Google Maps. Is your API key valid?
        </div>;
    }

    return (
        <div className="space-y-3">
            {!isLoaded ? (
                <div className="h-64 flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-800 animate-pulse w-full">
                    <svg className="animate-spin h-6 w-6 text-gray-400 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    <span className="text-sm text-gray-500 font-medium">Loading map...</span>
                </div>
            ) : (
                <div className="relative h-64 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm z-0">
                    <div className="absolute top-3 left-3 right-3 z-[10]">
                        <Autocomplete
                            onLoad={onLoadAutocomplete}
                            onPlaceChanged={onPlaceChanged}
                        >
                            <input
                                type="text"
                                placeholder="Search for your business or address..."
                                className="w-full px-4 py-3 rounded-xl border-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
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
                                position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM,
                            },
                        }}
                    >
                        <Marker
                            position={position}
                            draggable={true}
                            onDragEnd={handleMapClick}
                            animation={window.google?.maps?.Animation?.DROP}
                        />
                    </GoogleMap>

                    {isLoading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center z-[1000]">
                            <div className="flex flex-col items-center gap-2">
                                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                </svg>
                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Locating...</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50 flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Store Location</p>
                    <p className="text-sm text-gray-700 dark:text-slate-200 font-medium leading-relaxed break-words">
                        {address || "Use the search bar or click on the map to set your location"}
                    </p>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center italic mt-1">
                You can drag the marker, search for a place, or click anywhere on the map to update the location.
            </p>
        </div>
    );
};

export default LocationPicker;
