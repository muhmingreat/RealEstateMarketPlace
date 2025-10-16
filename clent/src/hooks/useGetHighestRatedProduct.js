import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { useDispatch } from "react-redux";
import { setError, setLoading } from "../../redux/slices/realEstateSlice";

export const useGetHighestRatedProduct = () => {
  const contract = useContractInstance(true);
  const dispatch = useDispatch();

  return useCallback(async () => {
    dispatch(setLoading(true));
    try {
      if (!contract) return null;
      const product = await contract.getHighestRatedProduct();
      return product;
    } catch (error) {
      console.error(error);
      dispatch(setError("Failed to fetch highest rated product"));
      return null;
    } finally {
      dispatch(setLoading(false));
    }
  }, [contract, dispatch]);
};
