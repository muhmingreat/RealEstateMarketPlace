import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setLoading, setError } from "../../redux/slices/realEstateSlice";

export const useUpdatePrice = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(
    async (propertyId, newPrice) => {
      if (!propertyId || !newPrice) return;
      dispatch(setLoading(true));
      try {
        if (!contract) return;
        const tx = await contract.updatePrice(propertyId, newPrice);
        await tx.wait();
        toast.success("Price updated successfully");
        return true;
      } catch (error) {
        console.error(error);
         const errorDecoder = ErrorDecoder.create();
                const decodeError = await errorDecoder.decode(error);
                console.error("Error from updating price", error);
                toast.error(decodeError?.reason || "Error updating price");
                dispatch(setError(decodeError?.reason || error.message));
                dispatch(setLoading(false));
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, dispatch]
  );
};
