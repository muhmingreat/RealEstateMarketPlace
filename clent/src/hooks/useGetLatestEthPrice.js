import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { setError, setLoading } from "../../redux/slices/realEstateSlice";
import { useDispatch } from "react-redux";

export const useGetLatestEthPrice = () => {
  const contract = useContractInstance(true);
  const dispatch = useDispatch();

  return useCallback(async () => {
    dispatch(setLoading(true));
    try {
      if (!contract) return "0";
      const price = await contract.getLatestEthPrice();
      return price.toString();
    } catch (error) {
      console.error(error);
      dispatch(setError("Failed to fetch ETH price"));
      return "0";
    } finally {
      dispatch(setLoading(false));
    }
  }, [contract, dispatch]);
};
