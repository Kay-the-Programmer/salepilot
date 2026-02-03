import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon using CDN
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
    onLocationPicked: (address: string, lat: number, lng: number) => void;
    initialAddress?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationPicked, initialAddress }) => {
    const [position, setPosition] = useState<L.LatLngExpression>([-1.286389, 36.817223]); // Default to Nairobi
    const [address, setAddress] = useState(initialAddress || '');
    const [isLoading, setIsLoading] = useState(false);

    // Get user's current location on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const newPos: L.LatLngExpression = [pos.coords.latitude, pos.coords.longitude];
                setPosition(newPos);
                reverseGeocode(pos.coords.latitude, pos.coords.longitude);
            }, (err) => {
                console.warn("Geolocation failed or denied", err);
            });
        }
    }, []);

    const reverseGeocode = async (lat: number, lng: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            const displayName = data.display_name || `${lat}, ${lng}`;
            setAddress(displayName);
            onLocationPicked(displayName, lat, lng);
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            const fallback = `${lat}, ${lng}`;
            setAddress(fallback);
            onLocationPicked(fallback, lat, lng);
        } finally {
            setIsLoading(false);
        }
    };

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                reverseGeocode(e.latlng.lat, e.latlng.lng);
            },
        });

        return position ? <Marker position={position} /> : null;
    };

    return (
        <div className="space-y-3">
            <div className="relative h-64 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-sm z-0">
                <MapContainer
                    center={position}
                    zoom={13}
                    scrollWheelZoom={false}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker />
                </MapContainer>

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
                        {address || "Click on the map to set your store location"}
                    </p>
                </div>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center italic">
                You can also drag the marker or click anywhere on the map to update the location.
            </p>
        </div>
    );
};

export default LocationPicker;
