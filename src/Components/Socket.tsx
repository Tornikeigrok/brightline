import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
    // Optional: add these for better connection handling
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;