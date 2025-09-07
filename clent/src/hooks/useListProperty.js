import { useCallback } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { celoAlfajores } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";
import { useDispatch } from "react-redux";
import { addProperty, setLoading, setError } from
 "../redux/slices/realEstateSlice"; 

const useListProperty = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (owner, price, title, category, images, propertyAddress, description) => {
      if (!owner || !price || !title || !category || !images || !propertyAddress || !description) {
        toast.error("All fields are required");
        return;
      }
      if (!address) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!contract) {
        toast.error("Contract not found");
        return;
      }
      if (Number(chainId) !== Number(celoAlfajores.id)) {
        toast.error("You're not connected to celoAfajores");
        return;
      }

      try {
        dispatch(setLoading(true));

        const estimatedGas = await contract.listProperty.estimateGas(
          owner,
          price,
          title,
          category,
          images,
          propertyAddress,
          description
        );

        const tx = await contract.listProperty(
          owner,
          price,
          title,
          category,
          images,
          propertyAddress,
          description,
          {
            gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
          }
        );

        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Property listed successfully");

          // Push the new property into Redux
          dispatch(
            addProperty({
              productID: receipt.logs[0]?.topics[1], // or fetch from contract
              owner,
              price,
              title,
              category,
              images,
              propertyAddress,
              description,
            })
          );

          dispatch(setLoading(false));
          return true;
        }

        toast.error("Failed to list property");
        dispatch(setLoading(false));
        return false;
      } catch (error) {
        const errorDecoder = ErrorDecoder.create();
        const decodeError = await errorDecoder.decode(error);
        console.error("Error from creating property", error);
        toast.error(decodeError?.reason || "Error listing property");
        dispatch(setError(decodeError?.reason || error.message));
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};

export default useListProperty;



