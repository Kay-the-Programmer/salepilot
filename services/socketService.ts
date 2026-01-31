import { io, Socket } from 'socket.io-client';

class SocketService {
    private static instance: SocketService;
    private socket: Socket;

    private constructor() {
        // Assume backend is on port 5000
        const SOCKET_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            autoConnect: true
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
        });
    }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public getSocket(): Socket {
        return this.socket;
    }

    public joinOffer(offerId: string) {
        this.socket.emit('join_offer', offerId);
    }

    public joinStore(storeId: string) {
        this.socket.emit('join_store', storeId);
    }

    public leaveStore(storeId: string) {
        this.socket.emit('leave_store', storeId);
    }

    public on(event: string, callback: (...args: any[]) => void) {
        this.socket.on(event, callback);
    }

    public off(event: string, callback: (...args: any[]) => void) {
        this.socket.off(event, callback);
    }

    public sendLocation(offerId: string, userId: string, lat: number, lng: number) {
        this.socket.emit('send_location', { offerId, userId, lat, lng });
    }

    public onLocationReceive(callback: (data: { userId: string, lat: number, lng: number }) => void) {
        this.socket.off('receive_location');
        this.socket.on('receive_location', callback);
    }

    public onNewMessage(callback: (message: any) => void) {
        // Prevent adding multiple listeners
        // In real app, might want to manage listeners more carefully with IDs
        this.socket.off('new_message');
        this.socket.on('new_message', callback);
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export default SocketService;
