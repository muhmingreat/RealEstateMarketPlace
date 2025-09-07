// hooks/useChat.js
import { io } from "socket.io-client";
import { useState, useEffect, useMemo } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const socketUrl = apiBaseUrl.replace("/api", "");

export default function useChat(currentUserId) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!currentUserId) return;

    const s = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      setConnected(true);
      console.log("✅ Socket connected:", s.id);
      s.emit("joinRoom", currentUserId);
    });

    s.on("disconnect", () => {
      setConnected(false);
      console.log("❌ Socket disconnected");
    });

    s.off("receiveMessage").on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev; // avoid duplicates
        return [...prev, msg];
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [currentUserId]);

const sendMessage = (receiverId, text) => {
  if (!socket || !currentUserId) return;

  const payload = {
    senderWallet: currentUserId,   // ✅ changed
    receiverWallet: receiverId,    // ✅ changed
    message: text,
  };

  console.log("📤 Sending message:", payload);
  socket.emit("sendMessage", payload);
};

  const typingApi = useMemo(() => {
    return {
      typing: (room) => socket?.emit("typing", { room, userId: currentUserId }),
      stopTyping: (room) =>
        socket?.emit("stopTyping", { room, userId: currentUserId }),
    };
  }, [socket, currentUserId]);

  return {
    socket,
    connected,
    messages,
    sendMessage,
    typingApi,
  };
}
