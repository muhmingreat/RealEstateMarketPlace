import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  chatMessages: [],  
  currentUserId: null,
  currentUserFullName: null,
  targetUserId: null,
  targetFullName: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // ✅ User setup
    setCurrentUser: (state, action) => {
      const { id, fullName } = action.payload || {};
      state.currentUserId = id || null;
      state.currentUserFullName = fullName || null;
    },
    setChatTarget: (state, action) => {
      const { id, fullName } = action.payload || {};
      state.targetUserId = id || null;
      state.targetFullName = fullName || null;
    },

    // ✅ Chat message handling
    setChatMessages: (state, action) => {
      state.chatMessages = action.payload || [];
    },
    addChatMessage: (state, action) => {
      if (action.payload) state.chatMessages.push(action.payload);
    },
    clearChatMessages: (state) => {
      state.chatMessages = [];
    },
  },
});

export const {
  setCurrentUser,
  setChatTarget,
  setChatMessages,
  addChatMessage,
  clearChatMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
