import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify"
import { ErrorDecoder } from "ethers-decode-error";

export const useLikeReview = () => {
  const contract = useContractInstance(true);

  return useCallback(
    async (reviewId) => {
      if (!contract) return false;
      try {
        const tx = await contract.likeReview(reviewId);
        await tx.wait();
        toast.success("Review liked successfully");
        return true;
      } catch (error) {
     const errorDecoder = ErrorDecoder.create();
            const decodeError = await errorDecoder.decode(error);
            console.error("Error from Review property", error);
            toast.error(decodeError?.reason || "Error Review property");
            dispatch(setError(decodeError?.reason || error.message));
            dispatch(setLoading(false));
        return false;
      }
    },
    [contract]
  );
};
