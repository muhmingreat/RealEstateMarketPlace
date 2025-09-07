import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  address: null,
  kycApproved: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAddress: (state, action) => {
      state.address = action.payload;
    },
    setKycApproved: (state, action) => {
      state.kycApproved = action.payload;
    },
  },
});

export const { setAddress, setKycApproved } = userSlice.actions;
export default userSlice.reducer;
