import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { ErrorDecoder } from "ethers-decode-error";

export const useDepositPayment = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();

  return useCallback(
    async (propertyId, duration, requiredWei) => {
      if (!contract) throw new Error("Contract not initialized");
      if (!address) throw new Error("Wallet not connected");

      try {
        const estimatedGas = await contract.depositPayment.estimateGas(
          propertyId,
          duration,
          { value: requiredWei }
        );

        const tx = await contract.depositPayment(propertyId, duration, {
          value: requiredWei,
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Deposit successful");
          return true;
        }
        toast.error("Deposit failed");
        return false;
      } catch (error) {
        const errorDecoder = ErrorDecoder.create();
               const decodeError = await errorDecoder.decode(error);
               console.error("Error from creating property", error);
               toast.error(decodeError?.reason || "Error listing property");
               dispatch(setError(decodeError?.reason || error.message));
               dispatch(setLoading(false));
        return false;
      }
    },
    [contract, address]
  );
};
