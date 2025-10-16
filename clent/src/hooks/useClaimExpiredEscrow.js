import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { toast } from "react-toastify";

export const useClaimExpiredEscrow = () => {
  const contract = useContractInstance(true);

  return useCallback(
    async (propertyId) => {
      if (!contract) return false;
      try {
        const tx = await contract.claimExpiredEscrow(propertyId);
        await tx.wait();
        toast.success("Escrow claimed successfully");
        return true;
      } catch (error) {
        console.error(error);
        toast.error("Failed to claim escrow");
        return false;
      }
    },
    [contract]
  );
};
