import { useMemo } from "react";
import useSignerOrProvider from "../hooks/useSignerOrProvider";
import { Contract } from "ethers";

// Import both ABIs
import RealEstateABI from "../abi/RealEstate.json";
import KYCABI from "../abi/KYC.json";

const useContractInstance = (contractType = "realEstate", withSigner = false) => {
  const { signer, readOnlyProvider } = useSignerOrProvider();

  // Choose contract address & ABI based on type
  const { address, abi } = useMemo(() => {
    switch (contractType) {
      case "kyc":
        return {
          address: import.meta.env.VITE_KYC_CONTRACT_ADDRESS,
          abi: KYCABI
        };
      case "realEstate":
      default:
        return {
          address: import.meta.env.VITE_REALESTATE_CONTRACT_ADDRESS,
          abi: RealEstateABI
        };
    }
  }, [contractType]);

  return useMemo(() => {
    if (!address) {
      console.error(`Address not set for ${contractType} contract`);
      return null;
    }

    if (withSigner) {
      if (!signer) return null;
      return new Contract(address, abi, signer);
    }

    return new Contract(address, abi, readOnlyProvider);
  }, [signer, readOnlyProvider, withSigner, address, abi]);
};

export default useContractInstance;
