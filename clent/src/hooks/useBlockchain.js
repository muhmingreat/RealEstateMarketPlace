import { useCallback, useEffect, useState } from "react";
import useContractInstance from "./useContractInstance";
import { useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { toast } from "react-toastify";
// import { celoAlfajores } from "@reown/appkit/networks"
import { celoSepolia, } from "../config/sepolia";;
import { ErrorDecoder } from "ethers-decode-error";
import { useDispatch } from "react-redux";
import { ethers, formatEther } from "ethers";
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
  deleteProperty,
  setSelectedProperty,

} from "../redux/slices/realEstateSlice";
import { escrowStart, escrowSuccess, escrowFail, escrowReset } from "../redux/slices/escrowSlice";
/** ---------------------------
 *  READ HOOKS WITH REDUX
 *  ---------------------------
 */



export const useGetProperty = () => {
  const contract = useContractInstance(false);
  const dispatch = useDispatch();

  return useCallback(
    async (id) => {
      if (!contract) return null;
      dispatch(setLoading(true));
      try {
        const basic = await contract.getPropertyBasic(id);
        const extended = await contract.getPropertyExtended(id);
        const escrow = await contract.escrows(id);

        const [
          productID,
          owner,
          price,
          propertyTitle,
          category,
          images,
        ] = basic;

        const [
          propertyAddress,
          description,
          sold,
          verified,
          verifiedAt,
          verifiedDocHash,
        ] = extended;

        const [buyer, amount, confirmed, refunded] = escrow;

        const property = {
          productID: productID.toString(),
          owner,
          price: price.toString(),
          propertyTitle,
          category,
          images,
          propertyAddress,
          description,
          sold,
          verified,
          verifiedAt: verifiedAt.toString(),
          verifiedDocHash,
          escrow: {
            buyer,
            amount: amount.toString(),
            confirmed,
            refunded,
          },
        };

        dispatch(setSelectedProperty(property));
        return property; // ✅ always return data
      } catch (err) {
        console.error("Failed to fetch property:", err);
        dispatch(setError("Failed to fetch property"));
        toast.error("Failed to fetch property");
        return null;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, dispatch]
  );
};


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
      const validProps = rawProps.filter(p => p && p.title);
      console.log("Valid properties after filtering:", validProps);
      console.log("Fetched properties:", properties);
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
  const contract = useContractInstance(true);
  const dispatch = useDispatch();

  return useCallback(
    async (userAddress) => {
      if (!contract) return [];

      dispatch(setLoading(true));
      try {
        const userPropsRaw = await contract.getUserProperties(userAddress);

        // ✅ Format everything here
        const userProps = userPropsRaw.map((p) => ({
          productID: Number(p.productID),
          title: p.propertyTitle,
          category: p.category,
          price: p.price ? ethers.formatEther(p.price) : "0",
          description: p.description,
          location: p.propertyAddress,
          images: p.images ? p.images.map((img) => String(img)) : [],
          sold: Boolean(p.sold),
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
  const contract = useContractInstance(false);
  const dispatch = useDispatch();

  return useCallback(
    async (productId) => {
      try {
        if (!contract) return [];

        const reviews = await contract.getProductReview(productId);

        const normalized = reviews.map(r => ({
          reviewer: r.reviewer,
          productId: r.productId?.toString(),
          rating: Number(r.rating),
          comment: r.comment,
          likes: Number(r.likes)
        }));

        dispatch(setReviews({ productID: productId.toString(), reviews: normalized }));
        return normalized;
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
  const contract = useContractInstance(false);
  const dispatch = useDispatch();

  return useCallback(
    async (userAddress) => {
      try {

        const reviews = await contract.getUserReviews(userAddress);
        const normalized = reviews.map(r => ({
          ...r,
          rating: r.rating?.toString(),
          user: r.user,
          comment: r.comment,
        }));
        dispatch(setUserReviews(normalized));

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
  const contract = useContractInstance(false);
  const dispatch = useDispatch();

  return useCallback(async () => {
    try {
      let productId = await contract.getHighestRatedProduct();


      if (typeof productId === "bigint") {
        productId = productId.toString();
      }


      dispatch(setHighestRated(productId));

      return productId;
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch highest rated product");
      return null;
    }
  }, [contract, dispatch]);
};


const useValidation = (contract, address, chainId) => {
  if (!address) {
    toast.error("Please connect your wallet");
    return false;
  }
  if (!contract) {
    toast.error("Contract not found");
    return false;
  }
  if (Number(chainId) !== Number(celoSepolia.id)) {
    toast.error("You're not connected to Celo Sepolia");
    return false;
  }
  return true;
};


export const useUpdateProperty = () => {
  const contract = useContractInstance( true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (productId, title, category, images, propertyAddress, description) => {
      if (!useValidation(contract, address, chainId)) return false;

      dispatch(setLoading(true));
      try {
        const formattedImages = Array.isArray(images) ? images : [images];
        const formattedAddress = Array.isArray(propertyAddress)
          ? propertyAddress[0]
          : propertyAddress;

        const estimatedGas = await contract.updateProperty.estimateGas(
          address,
          productId,
          formattedImages,
          formattedAddress,
          title,
          category,
          description
        );

        const tx = await contract.updateProperty(
          address,
          productId,
          formattedImages,
          formattedAddress,
          title,
          category,
          description,
          { gasLimit: (estimatedGas * BigInt(120)) / BigInt(100) }
        );

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Property updated successfully");
          dispatch(
            updateProperty({
              owner: address,
              productID: productId.toString(),
              propertyTitle: title,
              category,
              images: formattedImages,
              propertyAddress: formattedAddress,
              description,
            })
          );
          return true;
        }
        toast.error("Failed to update property");
        return false;
      } catch (error) {
        console.error("UpdateProperty error:", error);
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
  const contract = useContractInstance(true);
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



export function useDepositPayment() {
  const contract = useContractInstance(true);
  const { address, provider } = useAppKitAccount();

  return useCallback(
    async (propertyId, duration, requiredWei) => {
      if (!contract) throw new Error("Contract not initialized");
      if (!address) throw new Error("Wallet not connected");

      // Normalize requiredWei to BigInt
      let valueToSend;
      if (typeof requiredWei === "bigint") valueToSend = requiredWei;
      else if (requiredWei && requiredWei._isBigNumber) valueToSend = BigInt(requiredWei.toString());
      else if (typeof requiredWei === "string") valueToSend = ethers.parseEther(requiredWei);
      else valueToSend = BigInt(requiredWei?.toString() || "0");

      try {


        const estimatedGas = await contract.depositPayment.estimateGas(propertyId, duration, { value: valueToSend });
        // const gasLimit = (BigInt(estimatedGas) * 120n) / 100n;

        const tx = await contract.depositPayment(propertyId, duration, {
          gasLimit:


            (estimatedGas * BigInt(120)) / BigInt(100), value: valueToSend
        });



        toast.info("Transaction sent — awaiting confirmation");
        const receipt = await tx.wait();
        toast.success("Deposit successful");
        return receipt.transactionHash;
      } catch (err) {
        // try to get a readable reason
        console.error("Deposit failed:", err);
        const reason = err?.reason || err?.message || "Deposit failed";
        toast.error(reason);
        throw err;
      }
    },
    [contract, address, provider]
  );
}




export const useGetRequiredEth = () => {
  const contract = useContractInstance();

  return useCallback(
    async (propertyId) => {
      if (!contract) throw new Error("Contract not loaded");
      // returns BigInt (ethers v6) or BigNumber depending on your setup - normalize
      const amount = await contract.getRequiredEth(propertyId);
      return {
        raw: BigInt(amount.toString()),
        formatted: ethers.formatEther(amount),
      };
    },
    [contract]
  );
};

export const useConfirmPurchase = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (id) => {
      if (!useValidation(contract, address, chainId)) return false;
      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.confirmPurchase.estimateGas(id);
        const tx = await contract.confirmPurchase(id, {
          gasLimit:
            (estimatedGas * BigInt(120)) / BigInt(100)
        });
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
        } catch { }
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
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (id, refundBuyer) => {
      if (!useValidation(contract, address, chainId)) return false;
      dispatch(setLoading(true));
      try {
        const estimatedGas = await contract.resolveDispute.estimateGas(id, refundBuyer);
        const tx = await contract.resolveDispute(id, refundBuyer, {
          gasLimit:
            (estimatedGas * BigInt(120)) / BigInt(100)
        });
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
        } catch { }
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


export const useAddReview = () => {
  const contract = useContractInstance(true);
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

          dispatch(addReview({
            productID: productId.toString(),
            review: { rating: rating.toString(), comment, user },
          }));

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
  const contract = useContractInstance(true);
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

          dispatch(likeReview({
            productID: productId.toString(),
            reviewIndex: reviewIndex.toString()
          }));

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

export const useDeleteProperty = () => {
  const contract = useContractInstance(true);
  const { address } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const dispatch = useDispatch();

  return useCallback(
    async (propertyId) => {
      if (!useValidation(contract, address, chainId)) return false;

      dispatch(setLoading(true));
      try {
        // Estimate gas
        const estimatedGas = await contract.deleteProperty.estimateGas(propertyId);

        // Call deleteProperty
        const tx = await contract.deleteProperty(propertyId, {
          gasLimit: (estimatedGas * BigInt(120)) / BigInt(100),
        });

        const receipt = await tx.wait();
        if (receipt.status === 1) {
          toast.success("Property deleted");

          // Update Redux state
          dispatch(deleteProperty(propertyId.toString()));

          return true;
        }

        toast.error("Failed to delete property");
        return false;
      } catch (error) {
        console.error("Delete property failed:", error);
        toast.error(error.reason || error.message || "Transaction failed");
        dispatch(setError(error.message));
        return false;
      } finally {
        dispatch(setLoading(false));
      }
    },
    [contract, address, chainId, dispatch]
  );
};
export function useClaimExpiredEscrow() {
  const contract = useContractInstance(true);
  const dispatch = useDispatch();

  return useCallback(
    async (propertyId) => {
      dispatch(setLoading(true));
      try {
        if (!contract) throw new Error("Contract not loaded");

        // Estimate gas
        const gasEstimate = await contract.claimExpiredEscrow.estimateGas(propertyId);

        // Send tx
        const tx = await contract.claimExpiredEscrow(propertyId, {
          gasLimit: (gasEstimate * BigInt(120)) / BigInt(100),
        });
        toast.loading("Claiming refund...");

        const receipt = await tx.wait();
        dispatch(escrowSuccess(receipt.transactionHash));
        toast.success("Refund claimed successfully ");

        return receipt;
      } catch (error) {
        console.error("Claim refund error:", error);
        dispatch(setError(error.message));
        toast.error(error.reason || error.message || "Failed to claim refund");
        throw error;
      } finally {
        dispatch(setLoading(false));
        setTimeout(() => dispatch(escrowReset()), 5000);
      }
    },
    [contract, dispatch]
  );
}