import { useCallback } from "react";
import useContractInstance from "../useContractInstance";
import { useDispatch } from "react-redux";
import { setError, setLoading } from "../../redux/slices/realEstateSlice";

export const useGetProperty = () => {
  const contract = useContractInstance(true);
  const dispatch = useDispatch();

  return useCallback(
    async (propertyId) => {
      if (!propertyId) return null;

      dispatch(setLoading(true));
      try {
        if (!contract) return null;
        const p = await contract.getProperty(propertyId);

        return {
          productID: p.productID.toString(),
          owner: p.owner,
          title: p.title,
          category: p.category,
          price: p.price.toString(),
          location: p.propertyAddress,
          description: p.description,
          images: p.images,
          sold: p.sold || false,
        };
      } catch (error) {
        console.error(error);
        dispatch(setError("Failed to fetch property"));
        return null;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, dispatch]
  );
};
