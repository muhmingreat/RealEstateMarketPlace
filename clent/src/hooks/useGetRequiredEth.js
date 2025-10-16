import { useCallback } from "react";
import useContractInstance from "../useContractInstance";

export const useGetRequiredEth = () => {
  const contract = useContractInstance(true);

  return useCallback(
    async (propertyId, duration) => {
      if (!contract) return "0";
      try {
        const amount = await contract.getRequiredEth(propertyId, duration);
        return amount.toString();
      } catch (error) {
        console.error("Failed to calculate required ETH", error);
        return "0";
      }
    },
    [contract]
  );
};
