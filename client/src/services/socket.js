// Import io from the socket.io-client package
import { io } from 'socket.io-client';
import { API_URL } from './api';

// Realtime server is the same API server (consolidated). API_URL resolves to the
// Mac's LAN IP in dev so a physical phone can connect.
const socket = io(API_URL, {
  transports: ['websocket'], // Use WebSocket for faster and more reliable connection
  autoConnect: true,         // Automatically connect on import
});

export default socket; 