import React, { useState, useMemo, useEffect } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { ethers } from "ethers";
import { useDispatch, useSelector } from "react-redux";
import {
  useDepositPayment,
  useConfirmPurchase,
  useResolveDispute,
  useGetRequiredEth,
  useClaimExpiredEscrow,
} from "../hooks/useBlockchain";

import useContractInstance from "../hooks/useContractInstance";
import {
  escrowStart,
  escrowSuccess,
  escrowFail,
  escrowReset,
} from "../redux/slices/escrowSlice";

export default function PropertyActions({ property, adminAddress, refetchProperty }) {
  const { address } = useAppKitAccount();
  const dispatch = useDispatch();
  const { loading, txHash } = useSelector((state) => state.escrow);
  const contract = useContractInstance(true);

  const depositPayment = useDepositPayment();
  const confirmPurchase = useConfirmPurchase();
  const resolveDispute = useResolveDispute();
  const getRequiredEth = useGetRequiredEth();
  const claimExpiredEscrow = useClaimExpiredEscrow();

  const [pending, setPending] = useState(null);
  const [onChainEscrow, setOnChainEscrow] = useState(null);
  const [expiresAtMs, setExpiresAtMs] = useState(null);
  const [escrowExpired, setEscrowExpired] = useState(false);

  if (!property) {
    return <div className="p-4 border rounded-lg bg-gray-50">No property selected</div>;
  }

  // --- normalize addresses ---
  const currentAddress = address ? ethers.getAddress(address) : null;
  const sellerAddress = property.seller ? ethers.getAddress(property.seller) : null;
  const adminAddr = adminAddress ? ethers.getAddress(adminAddress) : null;

  // --- fetch escrow from chain ---
  useEffect(() => {
    let mounted = true;
    async function fetchEscrowFromChain() {
      try {
        if (!contract || property?.id == null) return;
        const id = BigInt(property.id);
        const raw = await contract.escrows(id);
        const escrow = {
          buyer: raw[0],
          amount: BigInt(raw[1].toString()),
          confirmed: Boolean(raw[2]),
          refunded: Boolean(raw[3]),
          createdAtSeconds: Number(raw[4].toString()),
          expiresAtSeconds: Number(raw[5].toString()),
        };
        if (mounted) setOnChainEscrow(escrow);
      } catch (err) {
        console.error("fetchEscrowFromChain error", err);
      }
    }
    fetchEscrowFromChain();
    return () => { mounted = false; };
  }, [contract, property?.id]);

  // --- calculate expiresAt in ms ---
  useEffect(() => {
    if (!onChainEscrow) return;
    if (onChainEscrow.expiresAtSeconds && onChainEscrow.expiresAtSeconds > 0) {
      setExpiresAtMs(onChainEscrow.expiresAtSeconds * 1000);
    } else if (onChainEscrow.createdAtSeconds > 0) {
      // fallback: derive from createdAt + MAX_ESCROW_DURATION
      (async () => {
        try {
          const maxDuration = await contract.MAX_ESCROW_DURATION();
          setExpiresAtMs((onChainEscrow.createdAtSeconds + Number(maxDuration)) * 1000);
        } catch (err) {
          console.error("MAX_ESCROW_DURATION fetch failed", err);
        }
      })();
    }
  }, [onChainEscrow, contract]);

  // --- expiry watcher ---
  useEffect(() => {
    if (!expiresAtMs || !onChainEscrow) {
      setEscrowExpired(false);
      return;
    }
    const now = Date.now();
    if (now >= expiresAtMs) {
      setEscrowExpired(true);
      return;
    }
    const timeout = setTimeout(() => setEscrowExpired(true), expiresAtMs - now);
    return () => clearTimeout(timeout);
  }, [expiresAtMs, onChainEscrow]);

  // --- determine role ---
  let role = "guest";
  if (currentAddress) {
    if (currentAddress === sellerAddress) role = "seller";
    else if (currentAddress === adminAddr) role = "admin";
    else role = "buyer";
  }

  // --- derive status ---
  const amountWei = onChainEscrow?.amount ?? 0n;
  const chainStatus = onChainEscrow?.confirmed
  ? "Confirmed"
  : onChainEscrow?.refunded
  ? "Listed"   // after refund or claim, reset back to Listed
  : amountWei > 0n
  ? "Deposited"
  : "Listed";


  const status = useMemo(() => {
    if (escrowExpired && !onChainEscrow?.refunded) return "Expired";

    if (chainStatus === "Listed" && pending === "deposit") return "DepositedPending";
    return chainStatus;
  }, [chainStatus, pending, escrowExpired, onChainEscrow?.refunded]);

  // --- Handlers ---
  const handleDeposit = async () => {
    try {
      dispatch(escrowStart());
      setPending("deposit");
      const result = await getRequiredEth(property.id);
      if (!result?.raw) throw new Error("Required ETH missing");
      const duration = 10 * 60;
      const txHash = await depositPayment(property.id, duration, result.raw);
      dispatch(escrowSuccess(txHash));
      if (refetchProperty) await refetchProperty();
    } catch (err) {
      console.error("Deposit failed:", err);
      dispatch(escrowFail(err?.message || "Deposit failed"));
    } finally {
      setPending(null);
    }
  };

  const handleConfirm = async () => {
    try {
      // extra guard: block confirm if expired
      if (expiresAtMs && Date.now() >= expiresAtMs) {
        console.warn("Escrow expired  cannot confirm");
        dispatch(escrowFail("Escrow expired  claim refund instead"));
        return;
      }
      dispatch(escrowStart());
      const tx = await confirmPurchase(property.id);
      await tx?.wait?.();
      dispatch(escrowSuccess(tx.hash));
      if (refetchProperty) await refetchProperty();
    } catch (err) {
      console.error("Confirm failed:", err);
      dispatch(escrowFail(err?.message || "Confirm failed"));
    }
  };

  const handleResolve = async (refundBuyer) => {
    try {
      dispatch(escrowStart());
      const tx = await resolveDispute(property.id, refundBuyer);
      await tx?.wait?.();
      dispatch(escrowSuccess(tx.hash));
      if (refetchProperty) await refetchProperty();
    } catch (err) {
      console.error("Resolve failed:", err);
      dispatch(escrowFail(err?.message || "Resolve failed"));
    }
  };


  const handleClaimExpired = async () => {
  try {
    dispatch(escrowStart());
    const tx = await claimExpiredEscrow(property.id);
    await tx?.wait?.();
    dispatch(escrowSuccess(tx.hash));

    // ✅ reset UI to "Listed" after claim
    setOnChainEscrow({
      buyer: ethers.ZeroAddress,
      amount: 0n,
      confirmed: false,
      refunded: true,   // mark as refunded
      createdAtSeconds: 0,
      expiresAtSeconds: 0,
    });
    setEscrowExpired(false);

    if (refetchProperty) await refetchProperty();
  } catch (err) {
    console.error("Claim expired escrow failed:", err);
    dispatch(escrowFail(err?.message || "Claim expired escrow failed"));
  }
};


  useEffect(() => () => dispatch(escrowReset()), [dispatch]);

  // --- Render ---
  const getActionUI = () => {
    if (status === "Confirmed") {
      return <button disabled className="px-4 py-2
       bg-green-600 text-white rounded-lg">Deal sealed!</button>;
    }
    if (status === "Expired") {
      if (role === "buyer") {
        return <button onClick={handleClaimExpired} disabled={loading} 
        className="px-4 py-2 bg-red-600 text-white rounded-lg">
          {loading ? "Claiming..." : "Claim Refund (Escrow Expired)"}</button>;
      }
      return <button disabled className="px-4 py-2 bg-red-500
       text-white rounded-lg cursor-not-allowed">Escrow expired</button>;
    }
    if (role === "guest") {
      return <p className="text-gray-500">Connect wallet to perform actions.</p>;
    }
    if (role === "seller" && status === "Listed") {
      return <button disabled className="px-4 py-2
       bg-green-600 text-white rounded-lg cursor-not-allowed">
        available to purchase</button>;
    }
    if (role === "buyer") {
      if (status === "Listed") {
        return <button onClick={handleDeposit} disabled={loading || pending === "deposit"} 
        
        className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60">
          {loading || pending === "deposit" ? "Processing..." : "Buy Property"}</button>;
      }
      if (status === "Deposited" || status === "DepositedPending") {
        return <button onClick={handleConfirm} disabled={loading} 
        className="px-4 py-2 bg-green-600 text-white rounded-lg">
          {loading ? "Confirming..." : "Confirm Payment"}</button>;
      }
    }
    if (role === "admin") {
      if (status === "Deposited" || status === "DepositedPending") {
        return <button onClick={() => handleResolve(false)} disabled={loading} 
        className="px-4 py-2 bg-green-600 text-white rounded-lg">
          {loading ? "Processing..." : "Release to Seller"}</button>;
      }
      if (status === "Disputed") {
        return (
          <div className="flex gap-3 mt-3">
            <button onClick={() => handleResolve(true)} 
            disabled={loading} className="px-4 py-2
             bg-red-600 text-white rounded-lg">
              {loading ? "Resolving..." : "Refund Buyer"}</button>
            <button onClick={() => handleResolve(false)

            } disabled={loading} className="px-4 py-2
             bg-green-600 text-white rounded-lg">
              {loading ? "Resolving..." : "Release to Seller"}</button>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-4 p-2 border rounded-lg bg-gradient-to-bl from-yellow-400 via-pink-100 to-pink-200">
      <p className="text-sm bg-gradient-to-br from-blue-500 via-pink-300 to-pink-700 bg-clip-text">
        Role: {role} | Status: {status}
      </p>
      {getActionUI()}
      {txHash && (
        <p className="text-sm text-gray-500">
          Tx: <a href={`https://celoscan.io/tx/${txHash}`} target="_blank" rel="noreferrer">{txHash}</a>
        </p>
      )}
    </div>
  );
}



