import { createServer } from 'http';
import { Server } from 'socket.io';

// Create an HTTP server
const httpServer = createServer();

// Initialize Socket.IO with CORS settings (adjust the origin as needed)
const io = new Server(httpServer, {
  cors: {
    origin: '*',       // Replace with your specific origin in production
    methods: ['GET', 'POST']
  }
});

// Listen for incoming connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // When a user joins a game room, join them to the Socket.IO room.
  socket.on('joinGame', ({ gameId, userId }) => {
    socket.join(gameId);
    console.log(`User ${userId} joined game room: ${gameId}`);
    // Notify other participants in the room that a new player has joined
    socket.to(gameId).emit('playerJoined', { userId });
  });

  // When a country is guessed correctly, broadcast the event to everyone in the room.
  socket.on('countryGuessed', ({ gameId, userId, country }) => {
    console.log(`User ${userId} guessed ${country} in game ${gameId}`);
    io.to(gameId).emit('countryGuessedUpdate', { userId, country });
  });

  // Handle client disconnections
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Specify the port and start the server
const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Socket server running on port ${port}`);
}); 