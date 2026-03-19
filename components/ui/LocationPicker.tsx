import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HiOutlineMagnifyingGlass, HiOutlineCursorArrowRays, HiMapPin } from 'react-icons/hi2';

// Fix Leaflet's default icon path issues in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface LocationData {
    lat: number;
    lng: number;
    address: string;
    details?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
}

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
    onLocationSelect: (location: LocationData) => void;
    className?: string;
    showAddressCard?: boolean;
}

// MapController handles center updates and flyTo animations
const MapController = ({
    centerPosition
}: {
    centerPosition?: { lat: number, lng: number } | null
}) => {
    const map = useMap();
    const isFlyingRef = useRef(false);

    useEffect(() => {
        if (centerPosition && !isFlyingRef.current) {
            const current = map.getCenter();
            const dist = map.distance(current, centerPosition);
            if (dist > 10) {
                isFlyingRef.current = true;
                map.flyTo(centerPosition, map.getZoom(), {
                    duration: 1.5
                });
                map.once('moveend', () => {
                    isFlyingRef.current = false;
                });
            }
        }
    }, [centerPosition, map]);

    return null;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
    initialLat,
    initialLng,
    initialAddress,
    onLocationSelect,
    className = "h-[400px]",
    showAddressCard = true
}) => {
    const defaultCenter = { lat: initialLat || -15.416667, lng: initialLng || 28.283333 };
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [address, setAddress] = useState<string>(initialAddress || '');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchAddress = useCallback(async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await res.json();
            const newAddress = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            const details = data?.address ? {
                street: data.address.road || data.address.suburb || data.address.neighbourhood,
                city: data.address.city || data.address.town || data.address.village,
                state: data.address.state,
                zip: data.address.postcode,
                country: data.address.country
            } : undefined;

            setAddress(newAddress);
            onLocationSelect({ lat, lng, address: newAddress, details });
        } catch (error) {
            console.error("Failed to fetch address", error);
            const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setAddress(fallback);
            onLocationSelect({ lat, lng, address: fallback });
        } finally {
            setIsLoadingAddress(false);
        }
    }, [onLocationSelect]);

    const handleMapMoveEnd = (center: L.LatLng) => {
        const newPos = { lat: center.lat, lng: center.lng };

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            fetchAddress(newPos.lat, newPos.lng);
        }, 800);
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                setMapCenter(newPos);
                setAddress(display_name);
                onLocationSelect({
                    lat: newPos.lat,
                    lng: newPos.lng,
                    address: display_name,
                    details: data[0].address ? {
                        street: data[0].address.road,
                        city: data[0].address.city || data[0].address.town,
                        state: data[0].address.state,
                        zip: data[0].address.postcode,
                        country: data[0].address.country
                    } : undefined
                });
            }
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLocateMe = () => {
        if (navigator.geolocation) {
            setIsSearching(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMapCenter({ lat: latitude, lng: longitude });
                    setIsSearching(false);
                },
                (err) => {
                    console.error("Geolocation error", err);
                    setIsSearching(false);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    };

    const MapEvents = () => {
        const map = useMap();
        useMapEvents({
            moveend: () => {
                handleMapMoveEnd(map.getCenter());
            }
        });
        return null;
    };

    return (
        <div className={`relative w-full overflow-hidden rounded-[2.5rem] border border-white/20 dark:border-white/10 bg-slate-50 dark:bg-slate-900 shadow-xl group transition-all duration-500 ${className}`}>
            {/* Top Bar: Search & Locate Me */}
            <div className="absolute top-4 left-4 right-4 z-[400] flex gap-3 pointer-events-none">
                <form
                    onSubmit={handleSearch}
                    className="flex-1 relative shadow-lg rounded-2xl pointer-events-auto transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <HiOutlineMagnifyingGlass className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search address or landmark..."
                        className="block w-full pl-12 pr-4 h-14 rounded-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl text-sm font-semibold text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-200/50 dark:ring-white/10 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-all outline-none"
                    />
                </form>
                <button
                    type="button"
                    onClick={handleLocateMe}
                    className="h-14 w-14 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all ring-1 ring-slate-200/50 dark:ring-white/10 pointer-events-auto active:scale-95 shadow-blue-500/10"
                    title="Locate Me"
                >
                    {isSearching ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <HiOutlineCursorArrowRays className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* Center Fixed Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] z-[400] pointer-events-none drop-shadow-2xl flex flex-col items-center">
                <div className="relative transform transition-transform group-active:scale-110 duration-300">
                    <HiMapPin className="w-12 h-12 text-blue-600 dark:text-blue-500 mb-1" />
                    <div className="absolute bottom-[4px] left-1/2 -translate-x-1/2 w-4 h-2 bg-black/30 rounded-[100%] blur-[2px]"></div>
                </div>
            </div>

            {/* Bottom Address Card */}
            {showAddressCard && (
                <div className="absolute bottom-6 left-6 right-6 z-[400] pointer-events-none">
                    <div className="liquid-glass-card rounded-[2.5rem] p-5 border border-white/40 dark:border-white/10 pointer-events-auto transition-all animate-in slide-in-from-bottom-5 fade-in duration-500 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-5">
                            <div className="flex-shrink-0 w-12 h-12 rounded-[1.25rem] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                                <HiMapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Selected Location</h4>
                                {isLoadingAddress ? (
                                    <div className="flex flex-col gap-1.5 mt-1.5">
                                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 tracking-tight">
                                        {address || "Drag the map or search to select"}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <MapContainer
                center={defaultCenter}
                zoom={14}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <MapController centerPosition={mapCenter} />
                <MapEvents />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
            </MapContainer>

            <style>{`
                .leaflet-container { z-index: 0 !important; cursor: crosshair !important; }
                .leaflet-grab { cursor: crosshair !important; }
                .leaflet-dragging .leaflet-grab { cursor: grabbing !important; }
                .liquid-glass-card {
                    background: rgba(255, 255, 255, 0.7);
                }
                .dark .liquid-glass-card {
                    background: rgba(15, 23, 42, 0.8);
                }
            `}</style>
        </div>
    );
};

export default LocationPicker;
