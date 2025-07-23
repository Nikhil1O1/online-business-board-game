const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow connections from Vite dev server
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes
app.use(cors());

// Store active rooms and their data
const rooms = new Map();
const connectedUsers = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, users: connectedUsers.size });
});

// Get available rooms endpoint
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([roomId, roomData]) => ({
    id: roomId,
    hostId: roomData.hostId,
    players: roomData.players.length,
    created: roomData.created
  }));
  res.json(roomList);
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  connectedUsers.set(socket.id, { socket, roomId: null });

  // Create a new room
  socket.on('createRoom', (callback) => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const roomData = {
        id: roomId,
        hostId: socket.id,
        players: [{
          id: socket.id,
          name: `Player 1`,
          isHost: true
        }],
        created: new Date(),
        gameState: null
      };

      rooms.set(roomId, roomData);
      socket.join(roomId);
      
      // Update user's room info
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.roomId = roomId;
      }

      console.log(`Room created: ${roomId} by ${socket.id}`);
      
      if (callback) {
        // Include host/player information so the frontend knows its own id and host id
        callback({ success: true, roomId, players: roomData.players, playerId: socket.id, hostId: socket.id });
      }
      
      // Notify room about new player
      socket.to(roomId).emit('playerJoined', roomData.players);
      
    } catch (error) {
      console.error('Error creating room:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // Join existing room
  socket.on('joinRoom', (roomId, callback) => {
    try {
      const room = rooms.get(roomId);
      
      if (!room) {
        if (callback) {
          callback({ success: false, error: 'Room not found' });
        }
        return;
      }

      if (room.players.length >= 4) {
        if (callback) {
          callback({ success: false, error: 'Room is full' });
        }
        return;
      }

      const newPlayer = {
        id: socket.id,
        name: `Player ${room.players.length + 1}`,
        isHost: false
      };

      room.players.push(newPlayer);
      socket.join(roomId);
      
      // Update user's room info
      const user = connectedUsers.get(socket.id);
      if (user) {
        user.roomId = roomId;
      }

      console.log(`Player ${socket.id} joined room ${roomId}`);
      
      if (callback) {
        // Send additional context to joiner
        callback({ success: true, roomId, players: room.players, playerId: socket.id, hostId: room.hostId });
      }
      
      // Notify everyone in room about new player
      io.to(roomId).emit('playerJoined', room.players);
      
    } catch (error) {
      console.error('Error joining room:', error);
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  });

  // WebRTC signaling for P2P connections
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      ...data,
      from: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      ...data,
      from: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      ...data,
      from: socket.id
    });
  });

  // Generic signal relay (offer/answer/ice) used by client
  socket.on('signal', (data) => {
    const { to, signal, type } = data;
    // Relay signal to the intended recipient
    socket.to(to).emit('signal', {
      from: socket.id,
      type,
      signal
    });
  });
  
  // Game state management
  socket.on('gameStateUpdate', (gameState) => {
    const user = connectedUsers.get(socket.id);
    if (user && user.roomId) {
      const room = rooms.get(user.roomId);
      if (room && room.hostId === socket.id) {
        room.gameState = gameState;
        socket.to(user.roomId).emit('gameStateUpdate', gameState);
        console.log(`Game state updated for room ${user.roomId}`);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const user = connectedUsers.get(socket.id);
    if (user && user.roomId) {
      const room = rooms.get(user.roomId);
      if (room) {
        // Remove player from room
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          // Delete empty room
          rooms.delete(user.roomId);
          console.log(`Room ${user.roomId} deleted (empty)`);
        } else {
          // If host left, assign new host
          if (room.hostId === socket.id && room.players.length > 0) {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
            console.log(`New host assigned for room ${user.roomId}: ${room.hostId}`);
          }
          
          // Notify remaining players
          socket.to(user.roomId).emit('playerLeft', room.players);
        }
      }
    }
    
    connectedUsers.delete(socket.id);
  });

  // Manual leave room
  socket.on('leaveRoom', () => {
    const user = connectedUsers.get(socket.id);
    if (user && user.roomId) {
      socket.leave(user.roomId);
      
      const room = rooms.get(user.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          rooms.delete(user.roomId);
          console.log(`Room ${user.roomId} deleted (empty)`);
        } else {
          if (room.hostId === socket.id && room.players.length > 0) {
            room.hostId = room.players[0].id;
            room.players[0].isHost = true;
          }
          socket.to(user.roomId).emit('playerLeft', room.players);
        }
      }
      
      user.roomId = null;
      console.log(`Player ${socket.id} left room`);
    }
  });
});

// Clean up empty rooms periodically
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.length === 0) {
      rooms.delete(roomId);
      console.log(`Cleaned up empty room: ${roomId}`);
    }
  }
}, 300000); // Every 5 minutes

const PORT = process.env.GAME_SERVER_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Game server running on port ${PORT}`);
  console.log(`🌍 CORS enabled for all origins`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
}); 