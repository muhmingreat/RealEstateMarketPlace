import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setLoading, setError } from "../../redux/slices/realEstateSlice"
import { ErrorDecoder } from "ethers-decode-error";

export const useUpdateProperty = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(
    async (propertyId, title, description, location, images) => {
      if (!propertyId) return;
      dispatch(setLoading(true));
      try {
        if (!contract) return;
        const tx = await contract.updateProperty(propertyId, title, description, location, images);
        await tx.wait();
        toast.success("Property updated successfully");
        return true;
      } catch (error) {
            const errorDecoder = ErrorDecoder.create();
            const decodeError = await errorDecoder.decode(error);
            console.error("Error from updating property", error);
            toast.error(decodeError?.reason || "Error updating property");
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
