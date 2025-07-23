const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // In production, specify your frontend URL
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all routes
app.use(cors());

// Store active rooms and their data
const rooms = new Map();
const connectedUsers = new Map();

// Serve static files (optional - for development)
app.use(express.static('public'));

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
        hostId: socket.id,
        players: [{ id: socket.id, name: 'Host', isHost: true }],
        created: Date.now(),
        signals: []
      };
      
      rooms.set(roomId, roomData);
      connectedUsers.get(socket.id).roomId = roomId;
      
      socket.join(roomId);
      
      console.log(`Room created: ${roomId} by ${socket.id}`);
      callback({ success: true, roomId, playerId: socket.id });
      
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomId }, callback) => {
    try {
      const roomData = rooms.get(roomId);
      
      if (!roomData) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      // Add player to room
      const playerData = { id: socket.id, name: `Player ${roomData.players.length + 1}`, isHost: false };
      roomData.players.push(playerData);
      
      connectedUsers.get(socket.id).roomId = roomId;
      socket.join(roomId);
      
      // Notify host about new player
      socket.to(roomId).emit('playerJoined', playerData);
      
      // Send room data to joiner
      callback({ 
        success: true, 
        roomId, 
        playerId: socket.id,
        hostId: roomData.hostId,
        players: roomData.players
      });
      
      console.log(`Player ${socket.id} joined room ${roomId}`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Send WebRTC signal
  socket.on('signal', ({ to, signal, type }) => {
    try {
      const userData = connectedUsers.get(socket.id);
      if (!userData || !userData.roomId) {
        console.error('User not in room:', socket.id);
        return;
      }
      
      const signalData = {
        id: Math.random().toString(36).substring(2, 15),
        from: socket.id,
        to,
        signal,
        type,
        timestamp: Date.now()
      };
      
      // Store signal in room data
      const roomData = rooms.get(userData.roomId);
      if (roomData) {
        roomData.signals.push(signalData);
      }
      
      // Send signal to target user
      socket.to(to).emit('signal', signalData);
      
      console.log(`Signal sent: ${type} from ${socket.id} to ${to}`);
      
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  });

  // Get room signals (for reconnection)
  socket.on('getSignals', ({ roomId }, callback) => {
    try {
      const roomData = rooms.get(roomId);
      if (!roomData) {
        callback({ success: false, error: 'Room not found' });
        return;
      }
      
      const mySignals = roomData.signals.filter(s => s.to === socket.id);
      callback({ success: true, signals: mySignals });
      
    } catch (error) {
      console.error('Error getting signals:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Update player list (host only)
  socket.on('updatePlayers', (players) => {
    try {
      const userData = connectedUsers.get(socket.id);
      if (!userData || !userData.roomId) return;
      
      const roomData = rooms.get(userData.roomId);
      if (roomData && roomData.hostId === socket.id) {
        roomData.players = players;
        socket.to(userData.roomId).emit('playerUpdate', players);
      }
      
    } catch (error) {
      console.error('Error updating players:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      const userData = connectedUsers.get(socket.id);
      if (userData && userData.roomId) {
        const roomData = rooms.get(userData.roomId);
        
        if (roomData) {
          // Remove player from room
          roomData.players = roomData.players.filter(p => p.id !== socket.id);
          
          // If host disconnected, remove room
          if (roomData.hostId === socket.id) {
            console.log(`Host disconnected, removing room: ${userData.roomId}`);
            rooms.delete(userData.roomId);
            socket.to(userData.roomId).emit('hostDisconnected');
          } else {
            // Notify other players
            socket.to(userData.roomId).emit('playerLeft', socket.id);
          }
        }
      }
      
      connectedUsers.delete(socket.id);
      console.log(`User disconnected: ${socket.id}`);
      
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📋 Available rooms: http://localhost:${PORT}/rooms`);
});

// Cleanup old rooms periodically (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [roomId, roomData] of rooms.entries()) {
    if (now - roomData.created > oneHour) {
      console.log(`Cleaning up old room: ${roomId}`);
      rooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes 