import { useMemo } from "react";
import useSignerOrProvider from "../hooks/useSignerOrProvider";
import { Contract } from "ethers";

// Import both ABIs
import ABI from "../abi/RealEstate.json";


const useContractInstance = ( withSigner = false) => {
  const { signer, readOnlyProvider } = useSignerOrProvider();

   return useMemo(() => {
    if (withSigner) {
      if (!signer) return null;
      return new Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        ABI,
        signer
      );
    }
   

    return new Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS,
      ABI,
      readOnlyProvider
    );
  }, [signer, readOnlyProvider, withSigner]);

};

export default useContractInstance;
