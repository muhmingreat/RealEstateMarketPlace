import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { useAppKitAccount } from "@reown/appkit/react";
import { useDispatch } from "react-redux";
import { setError, setLoading } from "../../redux/slices/realEstateSlice";

export const useGetUserReviews = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const dispatch = useDispatch();

  return useCallback(async () => {
    if (!address) return [];
    dispatch(setLoading(true));
    try {
      if (!contract) return [];
      const reviews = await contract.getUserReviews(address);
      return reviews;
    } catch (error) {
      console.error(error);
      dispatch(setError("Failed to fetch user reviews"));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }, [contract, address, dispatch]);
};
