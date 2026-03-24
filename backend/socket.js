const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join a specific event room
    socket.on('joinEvent', (eventId) => {
      socket.join(eventId);
      console.log(`👤 Socket ${socket.id} joined event room: ${eventId}`);
    });

    // Handle explicit disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

/**
 * Broadcasts a seat update to all users in the event room
 * @param {string} eventId 
 * @param {object} update - { seatId, status, userId }
 */
const broadcastSeatUpdate = (eventId, update) => {
  if (io) {
    io.to(eventId).emit('seatUpdate', update);
  }
};

module.exports = { initSocket, getIO, broadcastSeatUpdate };
