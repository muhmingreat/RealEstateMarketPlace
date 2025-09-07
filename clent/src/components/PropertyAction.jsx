import React, { useEffect, useMemo, useState } from "react";
import {
  useResolveDispute,
  useConfirmPurchase,
  useDepositPayment,
  useGetRequiredEth,
} from "../hooks/useBlockchain";
import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";

export default function PropertyActions({ property, adminAddress, refetchProperty }) {
  const depositPayment = useDepositPayment();
  const confirmPurchase = useConfirmPurchase();
  const resolveDispute = useResolveDispute();
  const getRequiredEth = useGetRequiredEth();
  const { address } = useAppKitAccount();

  const [loading, setLoading] = useState(false);
  // 'deposit' | 'confirm' | 'resolve' | null
  const [pending, setPending] = useState(null);

  if (!property) return null;

  // ---- helpers ----
  const toBigInt = (v) => {
    try {

      if (value == null) return Number(0);
      if (typeof value === "bigint") return value;
      if (typeof value === "number") return BigInt(value);
      if (typeof value === "string") return value ? BigInt(value) : Number(0);
      if (typeof value === "object" && value.toString) return BigInt(value.toString());
    } catch {}
    return Number(0);
  };

  // fallback escrow
  const escrow = property.escrow || {
    buyer: ethers.ZeroAddress,
    amount: 0, // may be number/string/bignumber
    confirmed: false,
    refunded: false,
  };

  const amountWei = toBigInt(escrow.amount);

  // normalize addresses
  const currentAddress = address ? ethers.getAddress(address) : null;
  const sellerAddress = property.seller ? ethers.getAddress(property.seller) : null;
  const buyerAddress =
    escrow.buyer && escrow.buyer !== ethers.ZeroAddress ? ethers.getAddress(escrow.buyer) : null;
  const adminAddr = adminAddress ? ethers.getAddress(adminAddress) : null;

  // derive role
  let role = "guest";
  if (currentAddress) {
    if (sellerAddress && currentAddress === sellerAddress) role = "seller";
    else if (adminAddr && currentAddress === adminAddr) role = "admin";
    else role = "buyer";
  }

  // chain-derived status
  const chainStatus = escrow.confirmed
    ? "Confirmed"
    : escrow.refunded
    ? "Disputed"
    : amountWei > 0n
    ? "Deposited"
    : "Listed";

  // optimistic UI: if we just sent a deposit tx but haven't refetched yet
  const status = useMemo(() => {
    if (chainStatus === "Listed" && pending === "deposit") return "DepositedPending";
    return chainStatus;
  }, [chainStatus, pending]);

  const someoneElseDeposited =
    (status === "Deposited" || status === "DepositedPending") &&
    buyerAddress &&
    currentAddress !== buyerAddress;

  // when chain state catches up, clear pending
  useEffect(() => {
    if (chainStatus === "Deposited" || chainStatus === "Confirmed" || chainStatus === "Disputed") {
      setPending(null);
    }
  }, [chainStatus]);

  // on wallet switch, refetch the property so UI reflects who’s connected
  useEffect(() => {
    if (refetchProperty) refetchProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // ---- handlers ----
  const handleDeposit = async () => {
    try {
      setLoading(true);
      setPending("deposit"); // optimistic: hide the button immediately
      const requiredEth = await getRequiredEth(property.id);
      if (!requiredEth) return;
      const duration = 7 * 24 * 60 * 60;
      const tx = await depositPayment(property.id, duration, requiredEth);
      // if hook returns a tx object (ethers v6), wait for mining
      await tx?.wait?.();
      await refetchProperty?.();
    } catch (error) {
      console.error("Deposit failed:", error);
      setPending(null); // rollback optimistic state on error
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const tx = await confirmPurchase(property.id);
      await tx?.wait?.();
      await refetchProperty?.();
    } catch (error) {
      console.error("Confirm failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (refundBuyer) => {
    try {
      setLoading(true);
      const tx = await resolveDispute(property.id, refundBuyer);
      await tx?.wait?.();
      await refetchProperty?.();
    } catch (error) {
      console.error("Resolve failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---- UI decision ----
  function getActionUI() {
    // always show sealed if confirmed
    if (status === "Confirmed") {
      return <p className="text-green-600 font-semibold">Deal sealed!</p>;
    }

    // guest
    if (role === "guest") {
      return <p className="text-gray-500">Connect wallet to perform actions.</p>;
    }

    // seller
    if (role === "seller") {
      if (status === "Listed") {
        return <p className="text-blue-600 font-semibold">Waiting for Buyer</p>;
      }
      if (status === "Deposited" || status === "DepositedPending") {
        return (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            {loading ? "Confirming..." : "Confirm Payment"}
          </button>
        );
      }
    }

    // buyer
    if (role === "buyer") {
      if (status === "Listed") {
        // prevent showing deposit while we have an optimistic pending deposit
        return (
          <button
            onClick={handleDeposit}
            disabled={loading || pending === "deposit"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {loading || pending === "deposit" ? "Processing..." : "Deposit Payment"}
          </button>
        );
      }
      if (status === "Deposited" || status === "DepositedPending") {
        return (
          <p className="text-yellow-600 font-semibold">
            Transaction in progress, waiting for seller confirmation…
          </p>
        );
      }
    }

    // admin
    if (role === "admin") {
      if (status === "Listed") {
        return (
          <button
            onClick={handleDeposit}
            disabled={loading || pending === "deposit"}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {loading || pending === "deposit" ? "Processing..." : "Deposit Payment"}
          </button>
        );
      }
      if (status === "Deposited" || status === "DepositedPending") {
        return (
          <button
            onClick={() => handleResolve(false)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            {loading ? "Processing..." : "Release to Seller"}
          </button>
        );
      }
      if (status === "Disputed") {
        return (
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => handleResolve(true)}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              {loading ? "Resolving..." : "Refund Buyer"}
            </button>
            <button
              onClick={() => handleResolve(false)}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              {loading ? "Resolving..." : "Release to Seller"}
            </button>
          </div>
        );
      }
    }

    // other accounts (non-seller/non-admin) when someone else already deposited
    if (someoneElseDeposited) {
      return (
        <p className="text-yellow-600 font-semibold">
          Transaction in progress, waiting for seller confirmation…
        </p>
      );
    }

    return null;
  }

  return <div>{getActionUI()}</div>;
}




// import React, { useState } from "react";
// import {
//   useResolveDispute,
//   useConfirmPurchase,
//   useDepositPayment,
//   useGetRequiredEth
// } from "../hooks/useBlockchain";
// import { useAppKitAccount } from "@reown/appkit/react";
// import { ethers } from "ethers";

// export default function PropertyActions({ property, adminAddress }) {
//   const depositPayment = useDepositPayment();
//   const confirmPurchase = useConfirmPurchase();
//   const resolveDispute = useResolveDispute();
//   const { address } = useAppKitAccount();
//   const [loading, setLoading] = useState(false);
//   const getRequiredEth = useGetRequiredEth();

//   if (!property) return null;

//   // fallback escrow
//   const escrow = property.escrow || {
//     buyer: ethers.ZeroAddress,
//     amount: Number(0),
//     confirmed: false,
//     refunded: false,
//   };

//   // derive status
//   const status =
//     escrow.amount > 0
//       ? escrow.confirmed
//         ? "Confirmed"
//         : escrow.refunded
//         ? "Disputed"
//         : "Deposited"
//       : "Listed";

//   const currentAddress = address ? ethers.getAddress(address) : null;
//   const sellerAddress = ethers.getAddress(property.seller);
//   const buyerAddress =
//     escrow.buyer && escrow.buyer !== ethers.ZeroAddress
//       ? ethers.getAddress(escrow.buyer)
//       : null;
//   const adminAddr = ethers.getAddress(adminAddress);

//   let role = "guest";
//   if (currentAddress) {
//     if (currentAddress === sellerAddress) {
//       role = "seller";
//     } else if (currentAddress === adminAddr) {
//       role = "admin";
//     } else {
//       role = "buyer";
//     }
//   }

//   // ------------------------
//   // Handlers
//   // ------------------------
//   const handleDeposit = async () => {
//     try {
//       setLoading(true);
//       const requiredEth = await getRequiredEth(property.id);
//       if (!requiredEth) return;
//       const duration = 7 * 24 * 60 * 60;
//       await depositPayment(property.id, duration, requiredEth);
//     } catch (error) {
//       console.error("Deposit failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleConfirm = async () => {
//     try {
//       setLoading(true);
//       await confirmPurchase(property.id);
//     } catch (error) {
//       console.error("Confirm failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResolve = async (refundBuyer) => {
//     try {
//       setLoading(true);
//       await resolveDispute(property.id, refundBuyer);
//     } catch (error) {
//       console.error("Resolve failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ------------------------
//   // Role/Status Decision Logic
//   // ------------------------
//   function getActionUI() {
//     // ✅ Always show when deal is sealed
//     if (status === "Confirmed") {
//       return <p className="text-green-600 font-semibold">Deal sealed!</p>;
//     }

//     // 🕵 Guest
//     if (role === "guest") {
//       return (
//         <p className="text-gray-500">Connect wallet to perform actions.</p>
//       );
//     }

//     // 🏠 Seller
//     if (role === "seller") {
//       if (status === "Listed") {
//         return (
//           <p className="text-blue-600 font-semibold">Waiting for Buyer</p>
//         );
//       }
//       if (status === "Deposited") {
//         return (
//           <button
//             onClick={handleConfirm}
//             disabled={loading}
//             className="px-4 py-2 bg-green-600 text-white rounded-lg"
//           >
//             {loading ? "Confirming..." : "Confirm Payment"}
//           </button>
//         );
//       }
//     }

//     // 💳 Buyer
//     if (role === "buyer") {
//       if (status === "Listed") {
//         return (
//           <button
//             onClick={handleDeposit}
//             disabled={loading}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg"
//           >
//             {loading ? "Processing..." : "Deposit Payment"}
//           </button>
//         );
//       }
//       if (status === "Deposited") {
//         // someone already deposited
//         return (
//           <p className="text-yellow-600 font-semibold">
//             Transaction in progress, waiting for seller confirmation…
//           </p>
//         );
//       }
//     }

//     // 🛠 Admin
//     if (role === "admin") {
//       if (status === "Listed") {
//         return (
//           <button
//             onClick={handleDeposit}
//             disabled={loading}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg"
//           >
//             {loading ? "Processing..." : "Deposit Payment"}
//           </button>
//         );
//       }
//       if (status === "Deposited") {
//         return (
//           <button
//             onClick={() => handleResolve(false)}
//             disabled={loading}
//             className="px-4 py-2 bg-green-600 text-white rounded-lg"
//           >
//             {loading ? "Processing..." : "Release to Seller"}
//           </button>
//         );
//       }
//       if (status === "Disputed") {
//         return (
//           <div className="flex gap-3 mt-3">
//             <button
//               onClick={() => handleResolve(true)}
//               disabled={loading}
//               className="px-4 py-2 bg-red-600 text-white rounded-lg"
//             >
//               {loading ? "Resolving..." : "Refund Buyer"}
//             </button>
//             <button
//               onClick={() => handleResolve(false)}
//               disabled={loading}
//               className="px-4 py-2 bg-green-600 text-white rounded-lg"
//             >
//               {loading ? "Resolving..." : "Release to Seller"}
//             </button>
//           </div>
//         );
//       }
//     }

//     return null;
//   }

//   // ------------------------
//   // Render
//   // ------------------------
//   return <div>{getActionUI()}</div>;
// }




// // import React, { useState } from "react";
// // import {
// //   useResolveDispute,
// //   useConfirmPurchase,
// //   useDepositPayment
// // } from "../hooks/useBlockchain";
// // import { useAppKitAccount } from "@reown/appkit/react";
// // import { ethers } from "ethers";
// // import { useGetRequiredEth } from "../hooks/useBlockchain";

// // export default function PropertyActions({ property, adminAddress }) {
// //   const depositPayment = useDepositPayment();
// //   const confirmPurchase = useConfirmPurchase();
// //   const resolveDispute = useResolveDispute();
// //   const { address } = useAppKitAccount();
// //   const [loading, setLoading] = useState(false);
// //   const getRequiredEth = useGetRequiredEth();

// //   if (!property) return null;

// //   // fallback escrow
// //   const escrow = property.escrow || {
// //     buyer: ethers.ZeroAddress,
// //     amount: Number(0),
// //     confirmed: false,
// //     refunded: false,
// //   };

// //   // derive status
// //   const status =
// //     escrow.amount > Number(0)
// //       ? escrow.confirmed
// //         ? "Confirmed"
// //         : escrow.refunded
// //         ? "Disputed"
// //         : "Deposited"
// //       : "Listed";

  
// //   const currentAddress = address ? ethers.getAddress(address) : null;
// //   const sellerAddress = ethers.getAddress(property.seller);
// //   const buyerAddress = escrow.buyer ? ethers.getAddress(escrow.buyer) : null;
// //   const adminAddr = ethers.getAddress(adminAddress);

  
// //   let role = "guest";
// //   if (currentAddress) {
// //     if (currentAddress === sellerAddress) {
// //       role = "seller";
// //     } else if (currentAddress === adminAddr) {
// //       role = "admin";
// //     } else {
// //       role = "buyer";
// //     }
// //   }


// //   const handleDeposit = async () => {
// //     try {
// //       setLoading(true);
// //       const requiredEth = await getRequiredEth(property.id);
// //       if (!requiredEth) return;
// //       const duration = 7 * 24 * 60 * 60;
// //       await depositPayment(property.id, duration, requiredEth);
// //     } catch (error) {
// //       console.error("Deposit failed:", error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleConfirm = async () => {
// //     try {
// //       setLoading(true);
// //       await confirmPurchase(property.id);
// //     } catch (error) {
// //       console.error("Confirm failed:", error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleResolve = async (refundBuyer) => {
// //     try {
// //       setLoading(true);
// //       await resolveDispute(property.id, refundBuyer);
// //     } catch (error) {
// //       console.error("Resolve failed:", error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div>
// //       {/* <h2 className="text-lg font-bold mb-3">Actions</h2> */}

// //       {status === "Confirmed" &&  (
// //         <p className="text-green-600 font-semibold">
// //             Deal sealed!
// //         </p>
// //       )}

    
// //       {role === "guest" && status !== "Confirmed" && (
// //         <p className="text-gray-500">Connect wallet to perform actions.</p>
// //       )}

    
// //       {role === "seller" && status === "Listed" && (
// //         <p className="text-blue-600 font-semibold">
// //              Waiting for Buyer
// //         </p>
// //       )}
// //       {role === "seller" && status === "Deposited" && (
// //         <button
// //           onClick={handleConfirm}
// //           disabled={loading}
// //           className="px-4 py-2 bg-green-600 text-white rounded-lg"
// //         >
// //           {loading ? "Confirming..." : "Confirm Payment"}
// //         </button>
// //       )}

    
// //       {role === "buyer" && status === "Listed" && (
// //         <button
// //           onClick={handleDeposit}
// //           disabled={loading}
// //           className="px-4 py-2 bg-blue-600 text-white rounded-lg"
// //         >
// //           {loading ? "Processing..." : "Deposit Payment"}
// //         </button>
// //       )}

      
// //       {role === "admin" && (
// //         <>
// //           {status === "Listed" && (
// //             <button
// //               onClick={handleDeposit}
// //               disabled={loading}
// //               className="px-4 py-2 bg-blue-600 text-white rounded-lg"
// //             >
// //               {loading ? "Processing..." : "Deposit Payment"}
// //             </button>
// //           )}

// //           {status === "Deposited" && (
// //             <button
// //               onClick={() => handleResolve(false)}
// //               disabled={loading}
// //               className="px-4 py-2 bg-green-600 text-white rounded-lg"
// //             >
// //               {loading ? "Processing..." : "Release to Seller"}
// //             </button>
// //           )}

// //           {status === "Disputed" && (
// //             <div className="flex gap-3 mt-3">
// //               <button
// //                 onClick={() => handleResolve(true)}
// //                 disabled={loading}
// //                 className="px-4 py-2 bg-red-600 text-white rounded-lg"
// //               >
// //                 {loading ? "Resolving..." : "Refund Buyer"}
// //               </button>
// //               <button
// //                 onClick={() => handleResolve(false)}
// //                 disabled={loading}
// //                 className="px-4 py-2 bg-green-600 text-white rounded-lg"
// //               >
// //                 {loading ? "Resolving..." : "Release to Seller"}
// //               </button>
// //             </div>
// //           )}
// //         </>
// //       )}
// //     </div>
// //   );
// // }




