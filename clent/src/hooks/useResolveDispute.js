import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";

export const useResolveDispute = () => {
  const contract = useContractInstance(true);

  return useCallback(
    async (propertyId, resolution) => {
      if (!contract) return false;
      try {
        const tx = await contract.resolveDispute(propertyId, resolution);
        await tx.wait();
        toast.success("Dispute resolved successfully");
        return true;
      } catch (error) {
      const errorDecoder = ErrorDecoder.create();
             const decodeError = await errorDecoder.decode(error);
             console.error("Error from resolving", error);
             toast.error(decodeError?.reason || "Error from resolving");
             dispatch(setError(decodeError?.reason || error.message));
             dispatch(setLoading(false));
        return false;
      }
    },
    [contract]
  );
};
