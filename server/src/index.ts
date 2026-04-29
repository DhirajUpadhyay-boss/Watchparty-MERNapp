// This is our main server file! 
// We are using Express for the API and Socket.io for the real-time magic.
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Room, User, Role, RoomState } from './types.js';

const app = express();
app.use(cors()); 

// Health check endpoint - you can visit this in your browser!
app.get('/', (req, res) => {
  res.send('Server is running! 🚀');
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true // Support older socket.io clients if necessary
});

// Using a Map to keep track of rooms in memory. 
// (In a real app, I'd probably use Redis or a Database, but this works great for now!)
const rooms: Map<string, Room> = new Map();

io.on('connection', (socket) => {
  console.log('A user just connected!', socket.id);

  // When someone tries to join a room
  socket.on('join_room', ({ roomId, username }: { roomId: string, username: string }) => {
    let room = rooms.get(roomId);
    let role: Role = Role.Participant;

    if (!room) {
      // If the room doesn't exist, the first person to join is automatically the Host!
      role = Role.Host;
      room = {
        id: roomId,
        users: [],
        state: {
          playState: 'paused',
          currentTime: 0,
          videoId: 'qMtcWqzGe8M', // Starting with a default video
          lastUpdated: Date.now()
        }
      };
      rooms.set(roomId, room);
    }

    const newUser: User = {
      id: socket.id,
      username,
      role,
      roomId
    };

    room.users.push(newUser);
    socket.join(roomId);

    // Tell everyone in the room that a new friend has joined!
    io.to(roomId).emit('user_joined', {
      username,
      userId: socket.id,
      role,
      participants: room.users
    });

    // Send the current video state so the new user is in sync with everyone else
    socket.emit('sync_state', room.state);
    
    console.log(`User ${username} joined room ${roomId} as ${role}`);
  });

  socket.on('leave_room', ({ roomId }: { roomId: string }) => {
    const user = getUser(socket.id);
    if (user && user.roomId === roomId) {
      handleUserLeave(socket.id);
      socket.leave(roomId);
    }
  });

  // Playback control: Only Hosts and Moderators should be allowed to do this
  socket.on('play', () => {
    const user = getUser(socket.id);
    if (user && (user.role === 'Host' || user.role === 'Moderator')) {
      const room = rooms.get(user.roomId);
      if (room) {
        room.state.playState = 'playing';
        room.state.lastUpdated = Date.now();
        // Broadcast the 'play' state to everyone in the room
        io.to(user.roomId).emit('sync_state', room.state);
      }
    }
  });

  socket.on('pause', () => {
    const user = getUser(socket.id);
    if (user && (user.role === 'Host' || user.role === 'Moderator')) {
      const room = rooms.get(user.roomId);
      if (room) {
        room.state.playState = 'paused';
        room.state.lastUpdated = Date.now();
        io.to(user.roomId).emit('sync_state', room.state);
      }
    }
  });

  // Seeking to a specific time in the video
  socket.on('seek', ({ time }: { time: number }) => {
    const user = getUser(socket.id);
    if (user && (user.role === 'Host' || user.role === 'Moderator')) {
      const room = rooms.get(user.roomId);
      if (room) {
        room.state.currentTime = time;
        room.state.lastUpdated = Date.now();
        io.to(user.roomId).emit('sync_state', room.state);
      }
    }
  });

  // Changing the video for everyone!
  socket.on('change_video', ({ videoId }: { videoId: string }) => {
    const user = getUser(socket.id);
    if (user && (user.role === 'Host' || user.role === 'Moderator')) {
      const room = rooms.get(user.roomId);
      if (room) {
        room.state.videoId = videoId;
        room.state.currentTime = 0;
        room.state.playState = 'paused';
        room.state.lastUpdated = Date.now();
        io.to(user.roomId).emit('sync_state', room.state);
      }
    }
  });

  // Host can assign roles to other people
  socket.on('assign_role', ({ userId, role }: { userId: string, role: Role }) => {
    const requester = getUser(socket.id);
    if (requester && requester.role === 'Host') {
      const room = rooms.get(requester.roomId);
      if (room) {
        const targetUser = room.users.find(u => u.id === userId);
        if (targetUser) {
          targetUser.role = role;
          io.to(requester.roomId).emit('role_assigned', {
            userId,
            username: targetUser.username,
            role,
            participants: room.users
          });
        }
      }
    }
  });

  // Host can kick someone out if they are being annoying lol
  socket.on('remove_participant', ({ userId }: { userId: string }) => {
    const requester = getUser(socket.id);
    if (requester && requester.role === 'Host') {
      const room = rooms.get(requester.roomId);
      if (room) {
        const index = room.users.findIndex(u => u.id === userId);
        if (index !== -1) {
          room.users.splice(index, 1);
          io.to(requester.roomId).emit('participant_removed', {
            userId,
            participants: room.users
          });
          // Clean up the socket join for that user
          const targetSocket = io.sockets.sockets.get(userId);
          if (targetSocket) {
            targetSocket.leave(room.id);
          }
        }
      }
    }
  });

  socket.on('disconnect', () => {
    handleUserLeave(socket.id);
    console.log('Someone left the server:', socket.id);
  });
});

// Helper function to handle when someone leaves or disconnects
function handleUserLeave(socketId: string) {
  const user = getUser(socketId);
  if (user) {
    const room = rooms.get(user.roomId);
    if (room) {
      room.users = room.users.filter(u => u.id !== socketId);
      
      // If the Host leaves, we need to pick a new one so the party continues!
      if (user.role === Role.Host && room.users.length > 0) {
        const newHost = room.users[0];
        newHost.role = Role.Host;
        io.to(room.id).emit('role_assigned', {
          userId: newHost.id,
          username: newHost.username,
          role: Role.Host,
          participants: room.users
        });
      }

      // If everyone is gone, just delete the room to save memory
      if (room.users.length === 0) {
        rooms.delete(room.id);
      } else {
        io.to(room.id).emit('user_left', {
          username: user.username,
          userId: socketId,
          participants: room.users
        });
      }
    }
  }
}

// Simple helper to find a user by their socket ID across all rooms
function getUser(id: string): User | undefined {
  for (const room of rooms.values()) {
    const user = room.users.find(u => u.id === id);
    if (user) return user;
  }
  return undefined;
}

const PORT = process.env.PORT || 3001;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
