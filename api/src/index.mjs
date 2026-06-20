import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server as SocketServer } from 'socket.io';
import authRoutes from './auth/routes.mjs';
import { requireAuth } from './auth/middleware.mjs';
import { toPublicUser } from './users.mjs';
import { db } from './db.mjs';

const app = express();
app.use(cors());
app.use(express.json());

// Health check — used to confirm the phone can reach the server.
app.get('/health', async (_req, res) => {
  try {
    const { rows } = await db.execute('SELECT COUNT(*) AS n FROM users');
    res.json({ ok: true, users: rows[0].n });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.use('/auth', authRoutes);

// First protected route — proves the WorkOS JWT verification works end to end.
app.get('/users/me', requireAuth, (req, res) => {
  if (!req.user) return res.status(404).json({ error: 'user_not_provisioned' });
  res.json({ user: toPublicUser(req.user) });
});

// ── Realtime (consolidated from the old standalone server.js) ──────
const httpServer = createServer(app);
const io = new SocketServer(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  socket.on('joinGame', ({ gameId, userId }) => {
    socket.join(gameId);
    socket.to(gameId).emit('playerJoined', { userId });
  });

  socket.on('countryGuessed', ({ gameId, userId, country }) => {
    io.to(gameId).emit('countryGuessedUpdate', { userId, country });
  });

  socket.on('disconnect', () => console.log('socket disconnected:', socket.id));
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => console.log(`Worldly API + realtime listening on :${port}`));
