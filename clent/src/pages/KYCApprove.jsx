import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useKYC from "../hooks/useKycVerifier";
import { ethers } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";

export default function KYCApprove() {
  const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS;
  const checkAddress = ADMIN_ADDRESS ? ethers.getAddress(ADMIN_ADDRESS) : null;
  const { 
    approveKYC, 
    rejectKYC, 
    uploadKYC,  // ✅ get it from your hook
    loading, 
    error,
    status 
  } = useKYC();

  const { address } = useAppKitAccount();
  const [requests, setRequests] = useState([]);
  const [fetching, setFetching] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const isAdmin = address && checkAddress && ethers.getAddress(address) === checkAddress;

  useEffect(() => {
    if (isAdmin) fetchRequests();
  }, [isAdmin]);

  const fetchRequests = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${apiBaseUrl}/kyc/requests`);
      const data = await res.json();
      setRequests(data.filter((r) => r.status === "pending"));
    } catch {
      toast.error("Failed to fetch KYC requests");
    } finally {
      setFetching(false);
    }
  };

  // ✅ Handle KYC upload (if you need it in admin panel)
  const handleKYCUpload = async (user) => {
    try {
      const response = await uploadKYC(
        user.walletAddress,
        user.fullName,
        user.email,
        user.phoneNumber,
        user.documentType,
        user.idDocumentFile,
        user.selfieFile
      );

      if (response?.verification) {
        toast.success(`KYC uploaded for ${user.walletAddress}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("KYC upload failed");
    }
  };

  const handleApprove = async (wallet) => {
    try {
      await approveKYC(wallet);
      toast.success(`Approved ${wallet}`);
      fetchRequests();
    } catch {
      toast.error("Approve failed");
    }
  };

  const handleReject = async (wallet) => {
    try {
      await rejectKYC(wallet);
      toast.success(`Rejected ${wallet}`);
      fetchRequests();
    } catch {
      toast.error("Reject failed");
    }
  };

  if (!isAdmin)
    return (
      <p className="text-center mt-10 text-red-600 font-semibold">
        Access Denied — Admins only
      </p>
    );

  if (fetching) return <p className="text-center mt-10">Loading requests...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md space-y-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Pending KYC Requests</h1>

      {requests.length === 0 ? (
        <p className="text-center text-gray-600">No pending KYC requests.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div
              key={r.walletAddress}
              className="flex flex-col sm:flex-row justify-between p-4 border rounded-lg shadow-sm bg-gray-50"
            >
              <div className="mb-2 sm:mb-0 space-y-1">
                <p className="font-mono text-sm text-gray-800 break-words">
                  {r.walletAddress}
                </p>
                <p className="text-gray-600">Name: {r.fullName}</p>
                <p className="text-gray-600">Email: {r.email}</p>
                <p className="text-gray-600">Phone: {r.phoneNumber}</p>
                <p className="text-gray-600">Document: {r.documentType}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleApprove(r.walletAddress)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(r.walletAddress)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 mt-2 text-center">
          {typeof error === "string" ? error : JSON.stringify(error)}
        </p>
      )}
    </div>
  );
}


