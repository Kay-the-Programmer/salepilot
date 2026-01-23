import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useState, useEffect, useRef, useCallback } from 'react';
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

interface LocationPickerProps {
    initialLat?: number;
    initialLng?: number;
    onLocationSelect: (lat: number, lng: number) => void;
}

// Component to handle map center updates and external control
const MapController = ({
    onMoveEnd,
    centerPosition
}: {
    onMoveEnd: (center: L.LatLng) => void,
    centerPosition?: { lat: number, lng: number } | null
}) => {
    const map = useMap();
    const isFlyingRef = useRef(false);

    // Handle external center updates
    useEffect(() => {
        if (centerPosition && !isFlyingRef.current) {
            // Check if we are already close to prevent jitter/loops if logic isn't perfect
            const current = map.getCenter();
            const dist = map.distance(current, centerPosition); // meters
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

    useMapEvents({
        moveend: () => {
            if (!isFlyingRef.current) {
                onMoveEnd(map.getCenter());
            }
        },
        dragstart: () => {
            // User interaction started
        }
    });

    return null;
}

const LocationPicker = ({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) => {
    // Default to a sensible location (e.g., Lusaka center or previous loc)
    const defaultCenter = { lat: initialLat || -15.416667, lng: initialLng || 28.283333 };

    // The visual center of the map (coordinates)
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    // The last "confirmed" location sent to parent
    const [selectedLocation, setSelectedLocation] = useState(defaultCenter);

    // UI states
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [address, setAddress] = useState<string>('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // Debounce ref for address fetching
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reverse geocoding helper
    const fetchAddress = useCallback(async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
            } else {
                setAddress('Unknown location');
            }
        } catch (error) {
            console.error("Failed to fetch address", error);
            setAddress('Network error');
        } finally {
            setIsLoadingAddress(false);
        }
    }, []);

    // Handle map movement ending
    const handleMapMoveEnd = (center: L.LatLng) => {
        const newPos = { lat: center.lat, lng: center.lng };

        // Notify parent immediately or wait? 
        // Usually good to notify parent on selection, but maybe just on "confirm"?
        // For this UI, we can update parent live.
        onLocationSelect(newPos.lat, newPos.lng);
        setSelectedLocation(newPos);

        // Debounce address fetch
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            fetchAddress(newPos.lat, newPos.lng);
        }, 800);
    };

    // Initial load
    useEffect(() => {
        if (initialLat && initialLng) {
            fetchAddress(initialLat, initialLng);
        } else {
            // Fetch address for default center too if needed
            fetchAddress(defaultCenter.lat, defaultCenter.lng);
        }
    }, [initialLat, initialLng, fetchAddress]); // Depend on initial props only if they change significantly (unlikely for mounted component)

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

                // Update map center - this triggers MapController to flyTo
                setMapCenter(newPos);
                // Also explicitly set address now to avoid waiting for moveend debounce
                setAddress(display_name);
                onLocationSelect(newPos.lat, newPos.lng);
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
                    const newPos = { lat: latitude, lng: longitude };
                    setMapCenter(newPos);
                    // MapController handles the flyTo and subsequent events
                    setIsSearching(false);
                },
                (err) => {
                    console.error("Geolocation error", err);
                    setIsSearching(false);
                    alert("Could not access your location. Please check browser permissions.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser");
        }
    };

    return (
        <div className="relative w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50 group">

            {/* Top Bar: Search & Locate Me */}
            <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2 pointer-events-none">
                <form
                    onSubmit={handleSearch}
                    className="flex-1 relative shadow-lg rounded-xl pointer-events-auto transition-transform hover:scale-[1.01]"
                >
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HiOutlineMagnifyingGlass className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Where to?"
                        className="block w-full pl-10 pr-4 h-12 rounded-xl border-0 bg-white/95 backdrop-blur text-sm font-medium text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                </form>
                <button
                    onClick={handleLocateMe}
                    className="h-12 w-12 bg-white/95 backdrop-blur rounded-xl flex items-center justify-center shadow-lg text-slate-600 hover:text-indigo-600 hover:bg-white transition-all ring-1 ring-slate-200 pointer-events-auto"
                    title="Locate Me"
                >
                    {
                        isSearching ? (
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <HiOutlineCursorArrowRays className="w-6 h-6" />
                        )
                    }
                </button>
            </div>

            {/* Center Fixed Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100%] z-[400] pointer-events-none drop-shadow-2xl">
                <div className="relative">
                    <HiMapPin className="w-10 h-10 text-indigo-600 mb-1" />
                    {/* Shadow dot */}
                    <div className="absolute bottom-[2px] left-1/2 -translate-x-1/2 w-3 h-1.5 bg-black/20 rounded-[100%] blur-[1px]"></div>
                </div>
            </div>

            {/* Bottom Address Card */}
            <div className="absolute bottom-6 left-6 right-6 z-[400] pointer-events-none">
                <div className="bg-white/95 backdrop-blur rounded-xl p-4 shadow-xl border border-slate-100 pointer-events-auto transition-all animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                            <HiMapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Selected Location</h4>
                            {isLoadingAddress ? (
                                <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse mt-1"></div>
                            ) : (
                                <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-2">
                                    {address || "Drag map to select location"}
                                </p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">
                                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <MapContainer
                center={defaultCenter}
                zoom={14}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <MapController onMoveEnd={handleMapMoveEnd} centerPosition={mapCenter} />

                {/* CartoDB Voyager Tiles for better aesthetics */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
            </MapContainer>
        </div>
    );
};

export default LocationPicker;
