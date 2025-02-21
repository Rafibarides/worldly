// Import io from the socket.io-client package
import { io } from 'socket.io-client';

// Set the URL of your socket server (adjust to your production/development URL)
const SOCKET_URL = 'http://localhost:3000'; // or your production URL

// Create the socket instance with desired options. 
const socket = io(SOCKET_URL, {
  transports: ['websocket'], // Use WebSocket for faster and more reliable connection
  autoConnect: true,         // Automatically connect on import
});

export default socket; 