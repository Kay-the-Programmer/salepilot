import { Offer, offersService } from '../../services/offersService';
import { User } from 'lucide-react'; // This was unused as logic, but maybe icon? No, I used lucide-react in OfferChat.
// Actually, I don't use User icon in OfferLiveTracking.

// Custom icons
const createIcon = (color: string) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = createIcon('red');
const greenIcon = createIcon('green');

export default function OfferLiveTracking() {
    const { id } = useParams<{ id: string }>();
    const [offer, setOffer] = useState<Offer | null>(null);
    const [myPosition, setMyPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [otherPosition, setOtherPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(true);
    // In a real app, get current user from auth context
    const currentUser = JSON.parse(localStorage.getItem('salePilotUser') || '{}');
    const currentUserId = currentUser?.id;

    useEffect(() => {
        if (!id || !currentUserId) return;

        const fetchData = async () => {
            try {
                const data = await offersService.getById(id);
                setOffer(data);
                // Set initial other position to offer location (if I am seller) or seller location (if known)
                // For simplicity, let's assume offer.latitude/longitude is the "Meeting Point" or Customer's initial location
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const socket = SocketService.getInstance();
        socket.joinOffer(id);

        // Track my location
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setMyPosition({ lat: latitude, lng: longitude });
                    socket.sendLocation(id, currentUserId, latitude, longitude);
                },
                (err) => console.error(err),
                { enableHighAccuracy: true }
            );

            return () => navigator.geolocation.clearWatch(watchId);
        }

        socket.onLocationReceive((data) => {
            if (data.userId !== currentUserId) {
                setOtherPosition({ lat: data.lat, lng: data.lng });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [id, currentUserId]);

    if (loading) return <div className="p-4">Loading offer details...</div>;
    if (!offer) return <div className="p-4">Offer not found.</div>;

    const isCustomer = currentUserId === offer.user_id;

    return (
        <div className="flex flex-col h-screen md:flex-row">
            {/* Map Area */}
            <div className="flex-1 h-1/2 md:h-full relative z-0">
                <MapContainer
                    center={[offer.latitude, offer.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    {/* Offer Location (Static or Customer Initial) */}
                    <Marker position={[offer.latitude, offer.longitude]} icon={redIcon}>
                        <Popup>Offer Location: {offer.title}</Popup>
                    </Marker>

                    {/* My Position */}
                    {myPosition && (
                        <Marker position={myPosition} icon={greenIcon}>
                            <Popup>You are here</Popup>
                        </Marker>
                    )}

                    {/* Other Person's Position */}
                    {otherPosition && (
                        <Marker position={otherPosition} icon={createIcon('blue')}>
                            <Popup>{isCustomer ? 'Seller' : 'Customer'}</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* Sidebar / Chat Area */}
            <div className="w-full md:w-96 bg-white border-l border-gray-200 flex flex-col h-1/2 md:h-full">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold">{offer.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">{offer.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${offer.status === 'open' ? 'bg-green-100 text-green-800' :
                            offer.status === 'accepted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                            }`}>
                            {offer.status.toUpperCase()}
                        </span>
                        {offer.status === 'open' && !isCustomer && (
                            <button
                                onClick={async () => {
                                    await offersService.accept(offer.id);
                                    window.location.reload();
                                }}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                                Accept Offer
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-hidden p-2">
                    <OfferChat offerId={offer.id} currentUserId={currentUserId} />
                </div>
            </div>
        </div>
    );
}
