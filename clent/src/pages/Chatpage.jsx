import React, { useEffect } from "react";
import Chat from "../components/Chat";
import { useSelector, useDispatch } from "react-redux";
import {
  addChatMessage,
  setCurrentUser,
  setChatTarget,
} from "../redux/slices/chatSlice";
import { useAppKitAccount } from "@reown/appkit/react"; 

export default function ChatPage() {
  const dispatch = useDispatch();
  const { address, isConnected } = useAppKitAccount(); 

  const {
    currentUserId,
    currentUserFullName,
    targetUserId,
    targetFullName,
    chatMessages,
  } = useSelector((state) => state.chat);

  useEffect(() => {
    if (isConnected && address) {
      dispatch(
        setCurrentUser({
          id: address,
          fullName: `${address.slice(0, 6)}`, 
        })
      );
    } else if (!currentUserId) {
      dispatch(setCurrentUser({ id: "guest-001", fullName: "Guest User" }));
    }

    
    if (!targetUserId) {
      dispatch(setChatTarget({ id: "admin-001", fullName: "Admin Support" }));
    }
  }, [dispatch, isConnected, address, currentUserId, targetUserId]);

  if (!currentUserId || !targetUserId) {
    return <p>Loading chat...</p>;
  }

  return (
    <Chat
      userObjectId={currentUserId}
      currentUserFullName={currentUserFullName}
      receiverId={targetUserId}
      receiverFullName={targetFullName}
      chatMessages={chatMessages}
      onNewMessage={(msg) => dispatch(addChatMessage(msg))}
    />
  );
}
