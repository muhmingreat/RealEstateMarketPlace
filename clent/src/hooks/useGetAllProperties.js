import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { useDispatch } from "react-redux";
import { setProperties, setError, setLoading } from "../../redux/slices/realEstateSlice";
import { toast } from "react-toastify";

export const useGetAllProperties = () => {
  const contract = useContractInstance(true);
  const dispatch = useDispatch();

  return useCallback(async () => {
    dispatch(setLoading(true));
    try {
      if (!contract) return [];

      const rawProps = await contract.getAllProperties();
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
      dispatch(setError("Failed to fetch properties"));
      toast.error("Failed to fetch properties");
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }, [contract, dispatch]);
};
