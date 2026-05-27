import http from 'node:http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import app from './app.js';
import connectDb from './config/db.js';

dotenv.config();

const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join:patient', (patientId) => {
    if (patientId) {
      socket.join(`patient:${patientId}`);
    }
  });

  socket.on('join:pharmacy', (pharmacyId) => {
    if (pharmacyId) {
      socket.join(`pharmacy:${pharmacyId}`);
    }
  });
});

await connectDb();

server.listen(port, () => {
  console.log(`MEDISYNC API running on port ${port}`);
});
