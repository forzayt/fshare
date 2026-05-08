import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
    socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
    });
  }
  return socket;
};
