import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon not finding images in webpack/vite environments
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface LocationPickerProps {
    onLocationSelect: (location: Location) => void;
    initialAddress?: string; // Optional: try to geocode this initially if provided (feature for later)
    onClose: () => void;
}

const LocationMarker = ({ onSelect }: { onSelect: (loc: Location) => void }) => {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            // Reverse geocode
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
                .then(res => res.json())
                .then(data => {
                    onSelect({
                        lat: e.latlng.lat,
                        lng: e.latlng.lng,
                        address: data.display_name
                    });
                })
                .catch(err => {
                    console.error("Geocoding failed", err);
                    onSelect({
                        lat: e.latlng.lat,
                        lng: e.latlng.lng,
                        address: `${e.latlng.lat}, ${e.latlng.lng}` // Fallback
                    });
                });
        },
    });

    return position === null ? null : (
        <Marker position={position} />
    );
};

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationSelect, onClose }) => {
    // Default to a central location (e.g., Lusaka, Zambia as per context implies African region logic earlier with Airtel/MTN)
    // Or just 0,0. Let's pick a neutral start or try to get user location.
    const [center, setCenter] = useState<[number, number]>([-15.4167, 28.2833]); // Lusaka roughly

    // Attempt to get current location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setCenter([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Select Location</h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 relative">
                    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker onSelect={onLocationSelect} />
                    </MapContainer>

                    {/* Overlay instruction */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-[400] text-sm font-medium text-slate-700 dark:text-slate-200 pointer-events-none">
                        Click on the map to set location
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPicker;
