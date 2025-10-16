import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setLoading, setError } from "../../redux/slices/realEstateSlice";
import { ErrorDecoder } from "ethers-decode-error";

export const useDeleteProperty = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(
    async (propertyId) => {
      if (!propertyId) return false;
      dispatch(setLoading(true));
      try {
        if (!contract) return false;
        const tx = await contract.deleteProperty(propertyId);
        await tx.wait();
        toast.success("Property deleted successfully");
        return true;
      } catch (error) {
        const errorDecoder = ErrorDecoder.create();
               const decodeError = await errorDecoder.decode(error);
               console.error("Error from deleting property", error);
               toast.error(decodeError?.reason || "Error deleting property");
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
