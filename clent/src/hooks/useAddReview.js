import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify";

export const useAddReview = () => {
  const contract = useContractInstance(true);

  return useCallback(
    async (productId, rating, comment) => {
      if (!contract) return false;
      try {
        const tx = await contract.addReview(productId, rating, comment);
        await tx.wait();
        toast.success("Review added successfully");
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Failed to add review");
        return false;
      }
    },
    [contract]
  );
};
