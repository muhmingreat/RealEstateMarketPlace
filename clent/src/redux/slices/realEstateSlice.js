import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  properties: [],
  myProperties: [],
  highestRated: null,
  reviews: {}, 
  userReviews: [],
  loading: false,
  error: null,
  searchQuery: "",
};

const realEstateSlice = createSlice({
  name: "realEstate",
  initialState,
  reducers: {
    setProperties: (state, action) => {
      state.properties = action.payload || [];
    },
    setMyProperties: (state, action) => {
      state.myProperties = action.payload || [];
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload || "";
    },
    addProperty: (state, action) => {
      if (action.payload) state.properties.push(action.payload);
    },
    updateProperty: (state, action) => {
      const updatedProperty = action.payload;
      if (!updatedProperty?.productID) return;

      const index = state.properties.findIndex(
        (p) => p.productID === updatedProperty.productID
      );
      if (index !== -1)
        state.properties[index] = { ...state.properties[index], ...updatedProperty };
    },
    updatePrice: (state, action) => {
      const { productID, price } = action.payload || {};
      const index = state.properties.findIndex((p) => p.productID === productID);
      if (index !== -1) state.properties[index].price = price;
    },
    setHighestRated: (state, action) => {
      state.highestRated = action.payload || null;
    },
    setReviews: (state, action) => {
      const { productID, reviews } = action.payload || {};
      if (productID) state.reviews[productID] = reviews || [];
    },
    addReview: (state, action) => {
      const { productID, review } = action.payload || {};
      if (!productID || !review) return;
      if (!state.reviews[productID]) state.reviews[productID] = [];
      state.reviews[productID].push(review);
    },
    likeReview: (state, action) => {
      const { productID, reviewIndex } = action.payload || {};
      const reviews = state.reviews[productID];
      if (reviews && reviews[reviewIndex]) {
        reviews[reviewIndex].likes = (reviews[reviewIndex].likes || 0) + 1;
      }
    },
    setUserReviews: (state, action) => {
      state.userReviews = action.payload || [];
    },
    setLoading: (state, action) => {
      state.loading = !!action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload || null;
    },
  },
});

export const {
  setProperties,
  setMyProperties,
  addProperty,
  updateProperty,
  updatePrice,
  setHighestRated,
  setReviews,
  addReview,
  likeReview,
  setUserReviews,
  setLoading,
  setError,
  setSearchQuery,
} = realEstateSlice.actions;

export default realEstateSlice.reducer;





