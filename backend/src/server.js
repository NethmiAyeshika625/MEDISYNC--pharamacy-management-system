import http from 'node:http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import app from './app.js';
import connectDb from './config/db.js';

dotenv.config();

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const allowedOrigins = new Set(
  [process.env.CORS_ORIGINS, process.env.CLIENT_URL, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value.split(',').map((origin) => origin.trim()))
    .filter(Boolean)
);

if (allowedOrigins.size === 0) {
  throw new Error('No Socket.IO origins configured. Set CORS_ORIGINS, CLIENT_URL, or FRONTEND_URL.');
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Socket.IO blocked for this origin'));
    },
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join:patient', (patientId) => {
    // expect an object { token, patientId } or raw patientId for backwards compatibility
    try {
      const payload = typeof patientId === 'object' ? patientId : { token: null, patientId };
      const token = payload.token || null;
      const pid = payload.patientId;
      if (!pid) return;
      if (!token) return; // require token to join patient room
      const pl = jwt.verify(token, process.env.JWT_SECRET);
      if (pl.sub && pl.sub.toString() === pl.sub.toString()) {
        // ensure the token belongs to the patient id
        if (pl.sub === pid || pl.sub === String(pid)) {
          socket.join(`patient:${pid}`);
        }
      }
    } catch (err) {
      // ignore invalid token
    }
  });

  socket.on('join:pharmacy', async (payload) => {
    // expect { token, pharmacyId }
    try {
      const token = payload?.token || null;
      const pharmacyId = payload?.pharmacyId || payload;
      if (!token || !pharmacyId) return;
      const pl = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(pl.sub).select('-password');
      if (!user) return;
      if (user.role === 'pharmacist' && user.pharmacyId && String(user.pharmacyId) === String(pharmacyId)) {
        socket.join(`pharmacy:${pharmacyId}`);
      }
    } catch (err) {
      // ignore invalid token
    }
  });

  // Allow authenticated admin sockets to join a global admin room
  socket.on('join:admin', async (token) => {
    try {
      if (!token) return;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select('-password');
      if (user && user.role === 'admin') {
        socket.join('admin:global');
      }
    } catch (err) {
      // ignore invalid tokens
    }
  });
});

await connectDb();

server.listen(port, () => {
  console.log(`MEDISYNC API running on port ${port}`);
});
