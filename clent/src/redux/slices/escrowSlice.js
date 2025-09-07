// src/redux/slices/escrowSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  success: false,
  error: null,
  txHash: null,
};

const escrowSlice = createSlice({
  name: "escrow",
  initialState,
  reducers: {
    escrowStart(state) {
      state.loading = true;
      state.error = null;
      state.success = false;
      state.txHash = null;
    },
    escrowSuccess(state, action) {
      state.loading = false;
      state.success = true;
      state.error = null;
      state.txHash = action.payload || null;
    },
    escrowFail(state, action) {
      state.loading = false;
      state.success = false;
      state.error = action.payload || "Transaction failed";
      state.txHash = null;
    },
    escrowReset(state) {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.txHash = null;
    },
  },
});

export const { escrowStart, escrowSuccess, escrowFail, escrowReset } = escrowSlice.actions;
export default escrowSlice.reducer;
