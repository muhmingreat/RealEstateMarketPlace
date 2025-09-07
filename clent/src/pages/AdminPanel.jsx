import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import useKYC from "../hooks/useKycVerifier";
import { ethers } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";

export default function KycAdminPanel() {
  const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS;
  const checkAddress = ADMIN_ADDRESS ? ethers.getAddress(ADMIN_ADDRESS) : null;
  const { approveKYC, rejectKYC, loading, error ,status } = useKYC();
  const { address } = useAppKitAccount();
  const [verificationResult, setVerificationResult] = useState(null);
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
const fetchKycData = async () => {
   const response = await uploadKYC(
      address,
      fullName,
      email,
      phoneNumber,
      documentType,
      idDocumentFile,
      selfieFile
    );

    if (response?.verification) {
      setVerificationResult(response.verification);
    }
  };
fetchKycData();

  if (!isAdmin)
    return <p className="text-center mt-10 text-red-600 font-semibold">Access Denied. Admins only.</p>;

  if (fetching) return <p className="text-center mt-10">Loading requests...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md space-y-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Pending KYC Requests</h1>
          {verificationResult && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Verification Results:
                </h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>
                    <strong>Extracted Name:</strong>{" "}
                    {verificationResult.documentExtractedName || "N/A"}
                  </li>
                  <li>
                    <strong>Document Verified:</strong>{" "}
                    {verificationResult.documentVerified ? "✅ Yes" : "❌ No"}
                  </li>
                  <li>
                    <strong>Face Match:</strong>{" "}
                    {verificationResult.faceMatch ? "✅ Match" : "❌ No Match"}
                  </li>
                  <li>
                    <strong>Liveness Score:</strong>{" "}
                    {verificationResult.livenessScore || "N/A"}
                  </li>
                </ul>
              </div>
            )}
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
                <p className="font-mono text-sm text-gray-800 break-words">{r.walletAddress}</p>
                <p className="text-gray-600">Name: {r.fullName}</p>
                <p className="text-gray-600">Email: {r.email}</p>
                <p className="text-gray-600">Phone: {r.phoneNumber}</p>
                <p className="text-gray-600">Document: {r.documentType}</p>
              


              </div>
             
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleApprove(r.walletAddress)}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded
                   hover:bg-green-700 disabled:bg-gray-400"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(r.walletAddress)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded
                   hover:bg-red-700 disabled:bg-gray-400"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
           
      {error && <p className="text-red-600 mt-2 text-center">{typeof error 
      === "string" ? error : JSON.stringify(error)}</p>}
    </div>
  );
}





// import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import useKYC from "../hooks/useKycVerifier";
// import {ethers} from 'ethers'
// import { useAppKitAccount } from "@reown/appkit/react";


// export default function KycAdminPanel() {

//   const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS
  
//   const checkAddress = ADMIN_ADDRESS ? ethers.getAddress(ADMIN_ADDRESS) : null;

  
//   const { approveKYC, rejectKYC, loading, error } = useKYC();
//   const { address } = useAppKitAccount();
  
//   const [requests, setRequests] = useState([]);
//   const [fetching, setFetching] = useState(false);
  
//   console.log("Admin Address:", checkAddress);

  
//   const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

//   const isAdmin =
//   address &&
//   checkAddress &&
//   ethers.getAddress(address) === checkAddress;

 
  
//   useEffect(() => {
//   if (isAdmin) {
//     fetchRequests();
//   }
// }, [isAdmin]);
  
//   // Fetch pending KYC requests
//   const fetchRequests = async () => {
//     setFetching(true);
//     try {
//       const res = await fetch(`${apiBaseUrl}/kyc/requests`);
//       const data = await res.json();
//       const pending = data.filter((r) => r.status === "pending");
//       setRequests(pending);
//     } catch {
//       toast.error("Failed to fetch KYC requests");
//     } finally {
//       setFetching(false);
//     }
//   };


//   const handleApprove = async (wallet) => {
//     try {
//       await approveKYC(wallet);
//       toast.success(`Approved ${wallet}`);
//       console.log("Approved wallet:", wallet);
//       fetchRequests();
//     } catch {
//       toast.error("Approve failed");
//     }
//   };

//   const handleReject = async (wallet) => {
//     try {
//       await rejectKYC(wallet);
//       toast.success(`Rejected ${wallet}`);
//       fetchRequests();
//     } catch {
//       toast.error("Reject failed");
//     }
//   };

//     if (!isAdmin) {
//     return (
//       <p className="text-center mt-10 text-red-600 font-semibold">
//         Access Denied. Admins only.
//       </p>
//     );
//   }

//   if (fetching) {
//     return <p className="text-center mt-10">Loading requests...</p>;
//   }


//   return (
//     <div className="max-w-4xl mx-auto p-6 mt-10 bg-white rounded-lg shadow-md">
//       <h1 className="text-3xl font-bold mb-6 text-center">Pending KYC Requests</h1>

//       {requests.length === 0 ? (
//         <p className="text-center text-gray-600">No pending KYC requests.</p>
//       ) : (
//         <ul>
//           {requests.map(({ walletAddress, fullName }) => (
//             <li
//               key={walletAddress}
//               className="flex items-center justify-between p-4 border-b"
//             >
//               <div>
//                 <p className="font-mono text-sm text-gray-800">{walletAddress}</p>
//                 <p className="text-gray-600">{fullName || "No name provided"}</p>
//               </div>
//               <div className="space-x-2">
//                 <button
//                   onClick={() => handleApprove(walletAddress)}
//                   disabled={loading}
//                   className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
//                 >
//                   Approve
//                 </button>
//                 <button
//                   onClick={() => handleReject(walletAddress)}
//                   disabled={loading}
//                   className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
//                 >
//                   Reject
//                 </button>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}

//       {error && (
//         <p className="text-red-600 mt-2 text-center">
//           Error: {typeof error === "string" ? error : JSON.stringify(error)}
//         </p>
//       )}
//     </div>
//   );
// }




