import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { useState, useMemo, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HiOutlineMapPin, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

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

// Component to handle map center updates
const ChangeView = ({ center, zoom }: { center: { lat: number, lng: number }, zoom?: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom || map.getZoom());
    }, [center, zoom, map]);
    return null;
}

const LocationMarker = ({ position, setPosition, onLocationSelect, onAddressFound }: any) => {
    const markerRef = useRef<any>(null);

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    setPosition({ lat, lng });
                    onLocationSelect(lat, lng);
                    // Trigger reverse geocode on drag end
                    if (onAddressFound) onAddressFound(lat, lng);
                }
            },
        }),
        [onLocationSelect, setPosition, onAddressFound],
    );

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            onLocationSelect(e.latlng.lat, e.latlng.lng);
            if (onAddressFound) onAddressFound(e.latlng.lat, e.latlng.lng);
        },
    });

    return position === null ? null : (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

const LocationPicker = ({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) => {
    // Default to San Francisco if no location provided
    const defaultCenter = { lat: initialLat || 37.7749, lng: initialLng || -122.4194 };
    const [position, setPosition] = useState(initialLat && initialLng ? { lat: initialLat, lng: initialLng } : defaultCenter);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [address, setAddress] = useState<string>('');

    // Reverse geocoding helper
    const fetchAddress = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
            }
        } catch (error) {
            console.error("Failed to fetch address", error);
        }
    };

    // Initial address fetch if we have coords
    useEffect(() => {
        if (initialLat && initialLng) {
            fetchAddress(initialLat, initialLng);
        }
    }, [initialLat, initialLng]);

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
                setPosition(newPos);
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
                    setPosition(newPos);
                    onLocationSelect(latitude, longitude);
                    fetchAddress(latitude, longitude);
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
        <div className="relative w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
            {/* Search Overlay */}
            <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2">
                <form onSubmit={handleSearch} className="flex-1 relative shadow-lg rounded-lg">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search address or city..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg border-0 bg-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    />
                    <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                </form>
                <button
                    onClick={handleLocateMe}
                    className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                    title="Use my location"
                >
                    {isSearching ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <HiOutlineMapPin className="w-6 h-6" />}
                </button>
            </div>

            {/* Address Display Overlay */}
            {address && (
                <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-white/50">
                    <div className="flex items-start gap-2">
                        <HiOutlineMapPin className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                        <p className="text-xs font-bold text-slate-700 leading-tight">{address}</p>
                    </div>
                </div>
            )}

            <div className="h-80 w-full z-0">
                <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <ChangeView center={position} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        setPosition={setPosition}
                        onLocationSelect={onLocationSelect}
                        onAddressFound={fetchAddress}
                    />
                </MapContainer>
            </div>
        </div>
    );
};

export default LocationPicker;
