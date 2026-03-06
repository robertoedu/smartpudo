import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:3001`;

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem("authToken");
    socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
