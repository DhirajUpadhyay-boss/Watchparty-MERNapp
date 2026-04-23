import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001').replace(/\/$/, '');

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'], // Allow fallback but prioritize websocket
  reconnectionAttempts: 5,
  timeout: 10000
});
