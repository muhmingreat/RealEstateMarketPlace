import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify";

export const useConfirmPurchase = () => {
  const contract = useContractInstance(true);

  return useCallback(
    async (propertyId) => {
      if (!contract) return false;
      try {
        const tx = await contract.confirmPurchase(propertyId);
        await tx.wait();
        toast.success("Purchase confirmed successfully");
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Failed to confirm purchase");
        return false;
      }
    },
    [contract]
  );
};
