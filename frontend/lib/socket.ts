import { io, Socket } from 'socket.io-client';

const WS_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000').replace('/api', '');

let socket: Socket | null = null;

export function getTaskSocket(): Socket {
  if (socket?.connected) return socket;

  if (socket) socket.disconnect();

  socket = io(`${WS_URL}/tasks`, {
    withCredentials: true,
    transports: ['websocket'],
    autoConnect: true,
  });

  return socket;
}

export function disconnectTaskSocket() {
  socket?.disconnect();
  socket = null;
}
