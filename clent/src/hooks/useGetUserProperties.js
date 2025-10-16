import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { useAppKitAccount } from "@reown/appkit/react";
import { useDispatch } from "react-redux";
import { setProperties, setLoading, setError } from "../../redux/slices/realEstateSlice";
import { toast } from "react-toastify";

export const useGetUserProperties = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const dispatch = useDispatch();

  return useCallback(async () => {
    if (!address) {
      toast.error("Wallet not connected");
      return [];
    }

    dispatch(setLoading(true));
    try {
      if (!contract) return [];

      const rawProps = await contract.getUserProperties(address);
      const properties = rawProps.map((p) => ({
        productID: p.productID.toString(),
        owner: p.owner,
        title: p.title,
        category: p.category,
        price: p.price.toString(),
        location: p.propertyAddress,
        description: p.description,
        images: p.images,
        sold: p.sold || false,
      }));

      dispatch(setProperties(properties));
      return properties;
    } catch (error) {
      console.error(error);
      dispatch(setError("Failed to fetch user properties"));
      toast.error("Failed to fetch user properties");
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }, [contract, address, dispatch]);
};
