import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { useDispatch } from "react-redux";
import { setError, setLoading } from "../../redux/slices/realEstateSlice";

export const useGetProductReview = () => {
  const contract = useContractInstance(true);
  const dispatch = useDispatch();

  return useCallback(
    async (productId) => {
      if (!productId) return [];
      dispatch(setLoading(true));
      try {
        if (!contract) return [];
        const reviews = await contract.getProductReviews(productId);
        return reviews;
      } catch (error) {
        console.error(error);
        dispatch(setError("Failed to fetch product reviews"));
        return [];
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, dispatch]
  );
};
