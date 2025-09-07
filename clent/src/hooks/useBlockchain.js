



import { useCallback, useEffect, useState } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { celoAlfajores } from "@reown/appkit/networks";
import { ErrorDecoder } from "ethers-decode-error";
import { useDispatch } from "react-redux";
import {
  setProperties,
  setMyProperties,
  setHighestRated,
  setReviews,
  setUserReviews,
  addProperty,
  updateProperty,
  updatePrice,
  addReview,
  likeReview,
  setLoading,
  setError,
} from "../redux/slices/realEstateSlice";

/** ---------------------------
 *  READ HOOKS WITH REDUX
 *  ---------------------------
 */

export function useGetLatestEthPrice() {
  const [ethPrice, setEthPrice] = useState(null);
  const contract = useContractInstance("realEstate", false);

  useEffect(() => {
    const fetchPrice = async () => {
      if (!contract) return;
      try {
        const price = await contract.getLatestEthPrice();
        const formatted = Number(price) / 1e18;
        setEthPrice(formatted.toFixed(2));
      } catch (err) {
        console.error("Error fetching ETH price:", err);
      }
    };
    fetchPrice();
  }, [contract]);

  return { ethPrice };
}

export const useGetAllProperties = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(async () => {
    dispatch(setLoading(true));
    try {
      if (!contract) return [];

      const rawProps = await contract.getAllProperties();
      const properties = rawProps.map((p) => ({
        productID: p.productID.toString(), // convert BigInt -> string
        owner: p.owner,
        title: p.title,
        category: p.category,
        price: p.price.toString(),         // convert BigInt -> string
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

export const useGetUserProperties = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(
    async (userAddress) => {
      dispatch(setLoading(true));
      try {
        const userPropsRaw = await contract.getUserProperties(userAddress);
        const userProps = userPropsRaw.map((p) => ({
          ...p,
          productID: p.productID.toString(),
          price: p.price.toString(),
        }));
        dispatch(setMyProperties(userProps));
        return userProps;
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch user properties");
        return [];
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, dispatch]
  );
};

export const useGetProductReview = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(
    async (productId) => {
      try {
        const reviews = await contract.getProductReview(productId);
        dispatch(setReviews({ productID: productId.toString(), reviews }));
        return reviews;
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch product reviews");
        return [];
      }
    },
    [contract, dispatch]
  );
};

export const useGetUserReviews = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(
    async (userAddress) => {
      try {
        const reviews = await contract.getUserReviews(userAddress);
        dispatch(setUserReviews(reviews));
        return reviews;
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch user reviews");
        return [];
      }
    },
    [contract, dispatch]
  );
};

export const useGetHighestRatedProduct = () => {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(async () => {
    try {
      const product = await contract.getHighestRatedProduct();
      if (product?.productID) {
        product.productID = product.productID.toString(); // convert BigInt
        product.price = product.price.toString();
      }
      dispatch(setHighestRated(product || null));
      return product || null;
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch highest rated product");
      return null;
    }
  }, [contract, dispatch]);
};

/** ---------------------------
 *  WRITE HOOKS WITH REDUX
 *  ---------------------------
 */

const useValidation = (contract, address, chainId) => {
  if (!address) {
    toast.error("Please connect your wallet");
    return false;
  }
  if (!contract) {
    toast.error("Contract not found");
    return false;
  }
  if (Number(chainId) !== Number(celoAlfajores.id)) {
    toast.error("You're not connected to Celo Alfajores");
    return false;
  }
  return true;
};

// List Property
export const useListProperty = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (owner, price, title, category, images, propertyAddress, description) => {
      if (!useValidation(contract, address, chainId)) return false;

      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.listProperty.estimateGas(
          owner, price, title, category, images, propertyAddress, description
        );

        const tx = await contract.listProperty(
          owner, price, title, category, images, propertyAddress, description,
          { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) }
        );

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Property listed successfully");
          const newProperty = {
            productID: Date.now().toString(), // generate serializable ID
            owner,
            title,
            category,
            price: price.toString(),
            location: propertyAddress,
            description,
            images,
            sold: false,
          };
          dispatch(addProperty(newProperty));
          return true;
        }
        toast.error("Transaction failed");
        return false;
      } catch (error) {
        console.error(error);
        toast.error(error.reason || error.message || "Transaction failed");
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};

// Update Property
export const useUpdateProperty = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (owner, productId, images, propertyAddress, title, category, description) => {
      if (!useValidation(contract, address, chainId)) return false;

      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.updateProperty.estimateGas(
          owner, productId, images, propertyAddress, title, category, description
        );

        const tx = await contract.updateProperty(
          owner, productId, images, propertyAddress, title, category, description,
          { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) }
        );

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Property updated");
          dispatch(updateProperty({
            productID: productId.toString(),
            images,
            propertyAddress,
            title,
            category,
            description,
          }));
          return true;
        }
        toast.error("Failed to update property");
        return false;
      } catch (error) {
        console.error(error);
        toast.error(error.reason || error.message || "Transaction failed");
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};

// Update Price
export const useUpdatePrice = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (owner, productId, price) => {
      if (!useValidation(contract, address, chainId)) return false;

      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.updatePrice.estimateGas(owner, productId, price);
        const tx = await contract.updatePrice(owner, productId, price, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Price updated");
          dispatch(updatePrice({ productID: productId.toString(), price: price.toString() }));
          return true;
        }
        toast.error("Failed to update price");
        return false;
      } catch (error) {
        console.error(error);
        toast.error(error.reason || error.message || "Transaction failed");
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};

// Deposit Payment
export function useDepositPayment() {
  const contract = useContractInstance("realEstate", true);
  const dispatch = useDispatch();

  return useCallback(
    async (propertyId, duration, requiredEth) => {
      dispatch(setLoading(true));
      try {
        if (!contract) throw new Error("Contract not loaded");

        let valueToSend;
        if (typeof requiredEth === "string" || typeof requiredEth === "number") {
          valueToSend = BigInt(requiredEth);
        } else if (typeof requiredEth === "bigint") {
          valueToSend = requiredEth;
        } else {
          throw new Error("Invalid requiredEth type");
        }

        const tx = await contract.depositPayment(propertyId, duration, { value: valueToSend });
        await tx.wait();

        toast.success("Payment deposited successfully!");
        return true;
      } catch (error) {
        console.error("Deposit error:", error);
        toast.error(`Deposit error: ${error.message || error}`);
        dispatch(setError(error.message || "Deposit failed"));
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, dispatch]
  );
};

// Confirm Purchase
export const useConfirmPurchase = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (id) => {
      if (!useValidation(contract, address, chainId)) return false;
      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.confirmPurchase.estimateGas(id);
        const tx = await contract.confirmPurchase(id, { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) });
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Purchase confirmed");
          return true;
        }
        toast.error("Failed to confirm purchase");
        return false;
      } catch (error) {
        console.error(error);
        let errorMsg = "Transaction failed";
        try {
          const errorDecoder = ErrorDecoder.create();
          const decoded = await errorDecoder.decode(error);
          errorMsg = decoded?.reason || errorMsg;
        } catch {}
        toast.error(errorMsg);
        dispatch(setError(errorMsg));
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};

// Resolve Dispute
export const useResolveDispute = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (id, refundBuyer) => {
      if (!useValidation(contract, address, chainId)) return false;
      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.resolveDispute.estimateGas(id, refundBuyer);
        const tx = await contract.resolveDispute(id, refundBuyer, { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) });
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          toast.success("Dispute resolved");
          return true;
        }
        toast.error("Failed to resolve dispute");
        return false;
      } catch (error) {
        console.error(error);
        let errorMsg = "Transaction failed";
        try {
          const errorDecoder = ErrorDecoder.create();
          const decoded = await errorDecoder.decode(error);
          errorMsg = decoded?.reason || errorMsg;
        } catch {}
        toast.error(errorMsg);
        dispatch(setError(errorMsg));
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};

export const useGetRequiredEth = () => {
  const contract = useContractInstance("realEstate", true);

  return useCallback(
    async (propertyId) => {
      try {
        const requiredEth = await contract.getRequiredEth(propertyId);
        return requiredEth; 
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch required ETH");
        return null;
      }
    },
    [contract]
  );
};
export const useAddReview = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (productId, rating, comment, user) => {
      if (!useValidation(contract, address, chainId)) return false;

      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.addReview.estimateGas(productId, rating, comment, user);
        const tx = await contract.addReview(productId, rating, comment, user, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Review added");
          dispatch(addReview({ productID: productId, review: { rating, comment, user } }));
          return true;
        }
        toast.error("Failed to add review");
        return false;
      } catch (error) {
        console.error(error);
        toast.error(error.reason || error.message || "Transaction failed");
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};

export const useLikeReview = () => {
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (productId, reviewIndex, user) => {
      if (!useValidation(contract, address, chainId)) return false;

      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.likeReview.estimateGas(productId, reviewIndex, user);
        const tx = await contract.likeReview(productId, reviewIndex, user, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Review liked");
          dispatch(likeReview({ productID: productId, reviewIndex }));
          return true;
        }
        toast.error("Failed to like review");
        return false;
      } catch (error) {
        console.error(error);
        toast.error(error.reason || error.message || "Transaction failed");
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};


// import { useCallback, useEffect,useState } from "react";
// import useContractInstance from "./useContractInstance";
// import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
// import { toast } from "react-toastify";
// import { celoAlfajores } from "@reown/appkit/networks";
// import { ErrorDecoder } from "ethers-decode-error";
// import { formatEther, ethers } from "ethers";
// import { useDispatch } from "react-redux";
// import {
//   setProperties,
//   setMyProperties,
//   setHighestRated,
//   setReviews,
//   setUserReviews,
//   addProperty,
//   updateProperty,
//   updatePrice,
//   addReview,
//   likeReview,
//   setLoading,
//   setError,
// } from "../redux/slices/realEstateSlice";

// /** ---------------------------
//  *  READ HOOKS WITH REDUX
//  *  ---------------------------
//  */

// export function useGetLatestEthPrice() {
//   const [ethPrice, setEthPrice] = useState(null);
//   const contract = useContractInstance("realEstate", false);

//   useEffect(() => {
//     const fetchPrice = async () => {
//       if (!contract) return;
//       try {
//         const price = await contract.getLatestEthPrice();
//         const formatted = Number(price) / 1e18;
//         setEthPrice(formatted.toFixed(2));
//       } catch (err) {
//         console.error("Error fetching ETH price:", err);
//       }
//     };
//     fetchPrice();
//   }, [contract]);

//   return { ethPrice };
// }

// export const useGetAllProperties = () => {
//   const contract = useContractInstance("realEstate", true);
//   const dispatch = useDispatch();

//   return useCallback(async () => {
//     dispatch(setLoading(true));
//     try {
//       if (!contract) return [];

//       const rawProps = await contract.getAllProperties();
//       const properties = rawProps.map((p) => ({
//         productID: p.productID,
//         owner: p.owner,
//         title: p.title,
//         category: p.category,
//         price: p.price.toString(),
//         location: p.propertyAddress,
//         description: p.description,
//         images: p.images,
//         sold: p.sold || false,
//       }));

//       dispatch(setProperties(properties));
//       return properties;
//     } catch (error) {
//       console.error(error);
//       dispatch(setError("Failed to fetch properties"));
//       toast.error("Failed to fetch properties");
//       return [];
//     } finally {
//       dispatch(setLoading(false));
//     }
//   }, [contract, dispatch]);
// };

// export const useGetUserProperties = () => {
//   const contract = useContractInstance("realEstate", true);
//   const dispatch = useDispatch();

//   return useCallback(
//     async (userAddress) => {
//       dispatch(setLoading(true));
//       try {
//         const userProps = await contract.getUserProperties(userAddress);
//         dispatch(setMyProperties(userProps));
//         return userProps;
//       } catch (error) {
//         console.error(error);
//         toast.error("Failed to fetch user properties");
//         return [];
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, dispatch]
//   );
// };

// export const useGetProductReview = () => {
//   const contract = useContractInstance("realEstate", true);
//   const dispatch = useDispatch();

//   return useCallback(
//     async (productId) => {
//       try {
//         const reviews = await contract.getProductReview(productId);
//         dispatch(setReviews({ productID: productId, reviews }));
//         return reviews;
//       } catch (error) {
//         console.error(error);
//         toast.error("Failed to fetch product reviews");
//         return [];
//       }
//     },
//     [contract, dispatch]
//   );
// };

// export const useGetUserReviews = () => {
//   const contract = useContractInstance("realEstate", true);
//   const dispatch = useDispatch();

//   return useCallback(
//     async (userAddress) => {
//       try {
//         const reviews = await contract.getUserReviews(userAddress);
//         dispatch(setUserReviews(reviews));
//         return reviews;
//       } catch (error) {
//         console.error(error);
//         toast.error("Failed to fetch user reviews");
//         return [];
//       }
//     },
//     [contract, dispatch]
//   );
// };

// export const useGetHighestRatedProduct = () => {
//   const contract = useContractInstance("realEstate", true);
//   const dispatch = useDispatch();

//   return useCallback(async () => {
//     try {
//       const product = await contract.getHighestRatedProduct();
//       dispatch(setHighestRated(product));
//       return product;
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to fetch highest rated product");
//       return null;
//     }
//   }, [contract, dispatch]);
// };

// /** ---------------------------
//  *  WRITE HOOKS WITH REDUX
//  *  ---------------------------
//  */

// const useValidation = (contract, address, chainId) => {
//   if (!address) {
//     toast.error("Please connect your wallet");
//     return false;
//   }
//   if (!contract) {
//     toast.error("Contract not found");
//     return false;
//   }
//   if (Number(chainId) !== Number(celoAlfajores.id)) {
//     toast.error("You're not connected to Celo Alfajores");
//     return false;
//   }
//   return true;
// };

// export const useListProperty = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const dispatch = useDispatch();

//   return useCallback(
//     async (owner, price, title, category, images, propertyAddress, description) => {
//       if (!useValidation(contract, address, chainId)) return false;

//       dispatch(setLoading(true));
//       try {
//         const estimatedGas = await contract.listProperty.estimateGas(
//           owner,
//           price,
//           title,
//           category,
//           images,
//           propertyAddress,
//           description
//         );

//         const tx = await contract.listProperty(
//           owner,
//           price,
//           title,
//           category,
//           images,
//           propertyAddress,
//           description,
//           { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) }
//         );

//         const receipt = await tx.wait();

//         if (receipt.status === 1) {
//           toast.success("Property listed successfully");
//           const newProperty = {
//             productID: price + Date.now(),
//             owner,
//             title,
//             category,
//             price,
//             location: propertyAddress,
//             description,
//             images,
//             sold: false,
//           };
//           dispatch(addProperty(newProperty));
//           return true;
//         }
//         toast.error("Transaction failed");
//         return false;
//       } catch (error) {
//         console.error(error);
//         toast.error(error.reason || error.message || "Transaction failed");
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, address, chainId, dispatch]
//   );
// };

// export const useUpdateProperty = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const dispatch = useDispatch();

//   return useCallback(
//     async (owner, productId, images, propertyAddress, title, category, description) => {
//       if (!useValidation(contract, address, chainId)) return false;

//       dispatch(setLoading(true));
//       try {
//         const estimatedGas = await contract.updateProperty.estimateGas(
//           owner,
//           productId,
//           images,
//           propertyAddress,
//           title,
//           category,
//           description
//         );

//         const tx = await contract.updateProperty(
//           owner,
//           productId,
//           images,
//           propertyAddress,
//           title,
//           category,
//           description,
//           { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) }
//         );

//         const receipt = await tx.wait();
//         if (receipt.status === 1) {
//           toast.success("Property updated");
//           dispatch(
//             updateProperty({ productID: productId, images, propertyAddress, title, category, description })
//           );
//           return true;
//         }
//         toast.error("Failed to update property");
//         return false;
//       } catch (error) {
//         console.error(error);
//         toast.error(error.reason || error.message || "Transaction failed");
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, address, chainId, dispatch]
//   );
// };

// export const useUpdatePrice = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const dispatch = useDispatch();

//   return useCallback(
//     async (owner, productId, price) => {
//       if (!useValidation(contract, address, chainId)) return false;

//       dispatch(setLoading(true));
//       try {
//         const estimatedGas = await contract.updatePrice.estimateGas(owner, productId, price);
//         const tx = await contract.updatePrice(owner, productId, price, {
//           gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
//         });

//         const receipt = await tx.wait();
//         if (receipt.status === 1) {
//           toast.success("Price updated");
//           dispatch(updatePrice({ productID: productId, price }));
//           return true;
//         }
//         toast.error("Failed to update price");
//         return false;
//       } catch (error) {
//         console.error(error);
//         toast.error(error.reason || error.message || "Transaction failed");
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, address, chainId, dispatch]
//   );
// };

// export const useAddReview = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const dispatch = useDispatch();

//   return useCallback(
//     async (productId, rating, comment, user) => {
//       if (!useValidation(contract, address, chainId)) return false;

//       dispatch(setLoading(true));
//       try {
//         const estimatedGas = await contract.addReview.estimateGas(productId, rating, comment, user);
//         const tx = await contract.addReview(productId, rating, comment, user, {
//           gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
//         });

//         const receipt = await tx.wait();
//         if (receipt.status === 1) {
//           toast.success("Review added");
//           dispatch(addReview({ productID: productId, review: { rating, comment, user } }));
//           return true;
//         }
//         toast.error("Failed to add review");
//         return false;
//       } catch (error) {
//         console.error(error);
//         toast.error(error.reason || error.message || "Transaction failed");
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, address, chainId, dispatch]
//   );
// };

// export const useLikeReview = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const dispatch = useDispatch();

//   return useCallback(
//     async (productId, reviewIndex, user) => {
//       if (!useValidation(contract, address, chainId)) return false;

//       dispatch(setLoading(true));
//       try {
//         const estimatedGas = await contract.likeReview.estimateGas(productId, reviewIndex, user);
//         const tx = await contract.likeReview(productId, reviewIndex, user, {
//           gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
//         });

//         const receipt = await tx.wait();
//         if (receipt.status === 1) {
//           toast.success("Review liked");
//           dispatch(likeReview({ productID: productId, reviewIndex }));
//           return true;
//         }
//         toast.error("Failed to like review");
//         return false;
//       } catch (error) {
//         console.error(error);
//         toast.error(error.reason || error.message || "Transaction failed");
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, address, chainId, dispatch]
//   );
// };

// export function useDepositPayment() {
//   const contract = useContractInstance("realEstate", true);
//   const dispatch = useDispatch();

//   return useCallback(
//     async (propertyId, duration, requiredEth) => {
//       dispatch(setLoading(true));
//       try {
//         if (!contract) throw new Error("Contract not loaded");

//         let valueToSend;
//         if (typeof requiredEth === "string" || typeof requiredEth === "number") {
//           valueToSend = BigInt(requiredEth);
//         } else if (typeof requiredEth === "bigint") {
//           valueToSend = requiredEth;
//         } else {
//           throw new Error("Invalid requiredEth type");
//         }

//         const tx = await contract.depositPayment(propertyId, duration, { value: valueToSend });
//         await tx.wait();

//         toast.success("Payment deposited successfully!");
//         return true;
//       } catch (error) {
//         console.error("Deposit error:", error);
//         toast.error(`Deposit error: ${error.message || error}`);
//         dispatch(setError(error.message || "Deposit failed"));
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, dispatch]
//   );
// }

// // -------------------
// // Confirm purchase hook
// // -------------------
// export const useConfirmPurchase = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const dispatch = useDispatch();

//   return useCallback(
//     async (id) => {
//       if (!useValidation(contract, address, chainId)) return false;
//       dispatch(setLoading(true));
//       try {
//         const estimatedGas = await contract.confirmPurchase.estimateGas(id);
//         const tx = await contract.confirmPurchase(id, { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) });
//         const receipt = await tx.wait();

//         if (receipt.status === 1) {
//           toast.success("Purchase confirmed");
//           return true;
//         }
//         toast.error("Failed to confirm purchase");
//         return false;
//       } catch (error) {
//         console.error(error);
//         let errorMsg = "Transaction failed";
//         try {
//           const errorDecoder = ErrorDecoder.create();
//           const decoded = await errorDecoder.decode(error);
//           errorMsg = decoded?.reason || errorMsg;
//         } catch {}
//         toast.error(errorMsg);
//         dispatch(setError(errorMsg));
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, address, chainId, dispatch]
//   );
// };

// // -------------------
// // Resolve dispute hook
// // -------------------
// export const useResolveDispute = () => {
//   const contract = useContractInstance("realEstate", true);
//   const { address } = useAppKitAccount();
//   const { chainId } = useAppKitNetwork();
//   const dispatch = useDispatch();

//   return useCallback(
//     async (id, refundBuyer) => {
//       if (!useValidation(contract, address, chainId)) return false;
//       dispatch(setLoading(true));
//       try {
//         const estimatedGas = await contract.resolveDispute.estimateGas(id, refundBuyer);
//         const tx = await contract.resolveDispute(id, refundBuyer, { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) });
//         const receipt = await tx.wait();

//         if (receipt.status === 1) {
//           toast.success("Dispute resolved");
//           return true;
//         }
//         toast.error("Failed to resolve dispute");
//         return false;
//       } catch (error) {
//         console.error(error);
//         let errorMsg = "Transaction failed";
//         try {
//           const errorDecoder = ErrorDecoder.create();
//           const decoded = await errorDecoder.decode(error);
//           errorMsg = decoded?.reason || errorMsg;
//         } catch {}
//         toast.error(errorMsg);
//         dispatch(setError(errorMsg));
//         return false;
//       } finally {
//         dispatch(setLoading(false));
//       }
//     },
//     [contract, address, chainId, dispatch]
//   );
// };

// export const useGetRequiredEth = () => {
//   const contract = useContractInstance("realEstate", true);

//   return useCallback(
//     async (propertyId) => {
//       try {
//         const requiredEth = await contract.getRequiredEth(propertyId);
//         return requiredEth; 
//       } catch (error) {
//         console.error(error);
//         toast.error("Failed to fetch required ETH");
//         return null;
//       }
//     },
//     [contract]
//   );
// };




