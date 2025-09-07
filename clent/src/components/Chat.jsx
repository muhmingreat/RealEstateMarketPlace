import React, { useEffect, useState, useRef, useMemo } from "react";
import useChat from "../hooks/useChat"; 

export default function Chat({
  receiverId,
  currentUserFullName,
  receiverFullName,
  chatMessages = [],
  onNewMessage,
  userObjectId, 
}) {
  const {
    socket,
    connected,
    typingApi,
    messages: hookMessages,
    sendMessage: sendMsg,
  } = useChat(userObjectId) || {};

  const [messages, setMessages] = useState(chatMessages || []);
  const [message, setMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  
  const room = useMemo(() => {
    if (!userObjectId || !receiverId) return null;
    return [String(userObjectId), String(receiverId)].sort().join("_");
  }, [userObjectId, receiverId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync chat messages from props
  useEffect(() => {
    setMessages(chatMessages || []);
  }, [chatMessages]);

  // Join room + listen for events
  useEffect(() => {
    if (!socket || !room) return;

    socket.emit("joinRoom", room);

    const handleReceive = (msg) => {
      if (msg.room !== room) return;
      setMessages((prev) => [...prev, msg]);
      onNewMessage?.(msg);
    };

    const handleTyping = ({ userId }) => {
      if (String(userId) === String(receiverId)) setTyping(true);
    };

    const handleStopTyping = ({ userId }) => {
      if (String(userId) === String(receiverId)) setTyping(false);
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, room, receiverId, onNewMessage]);

  // Input typing
  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    if (!socket || !connected || !room) return;
    typingApi.typing(room);

    clearTimeout(window.__typingTimeout);
    window.__typingTimeout = setTimeout(() => typingApi.stopTyping(room), 1000);
  };

  // Send message
  const handleSend = () => {
    if (!message.trim() || !socket || !connected || !room) return;

    
    sendMsg(receiverId, message);

    setMessages((prev) => [
  ...prev,
  {
    _id: `tmp_${Date.now()}`,
    sender: { _id: userObjectId, fullName: currentUserFullName },
    receiver: { _id: receiverId, fullName: receiverFullName },
    message,
    room,
    createdAt: new Date().toISOString(),
  },
]);


    console.log(" Message sent:", message);

    setMessage("");
    typingApi.stopTyping(room);
  };

  return (
    <div className="flex flex-col h-[80vh] w-lg max-w-full mx-auto border mt-10 mb-10
     border-gray-300 rounded-xl shadow-md bg-gray-50">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 bg-green-500 rounded-t-xl text-white">
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-sm text-white font-bold">
          {currentUserFullName?.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-black">{currentUserFullName}</h2>
          {typing && <p className="text-xs opacity-90">Typing...</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
        {messages.map((msg, idx) => {
          const isSender = String(msg.sender?._id) === String(userObjectId);

          return (
            <div
              key={msg._id || idx}
              className={`flex ${isSender ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-[70%] p-3 rounded-2xl break-words ${
                  isSender
                    ? "bg-green-500 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none"
                } shadow-sm`}
              >
                {!isSender && (
                  <p className="text-[11px] mb-1 opacity-80">
                    {receiverFullName || "User"}
                  </p>
                )}
                {isSender && (
                  <p className="text-[11px] mb-1 opacity-80 text-right">Me</p>
                )}

                <p className="text-sm">{msg.message}</p>
                <div className="flex justify-between items-center mt-1 text-xs opacity-80">
                  <span>
                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2 bg-white">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message"
          className="flex-1 border rounded-full px-4 py-2 focus:outline-none
           focus:ring focus:ring-green-300 text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!connected}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="bg-green-500 text-white px-4 py-2 rounded-full
           text-sm hover:bg-green-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
