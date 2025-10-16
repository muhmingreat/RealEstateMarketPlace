import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGetUserProperties } from "../hooks/useBlockchain";
import { ethers } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { buildApiUrl } from "../utils/api";

export default function UserDashboard() {
  const { address: userAddress } = useAppKitAccount();
  const getUserProperties = useGetUserProperties();
  const [kycData, setKycData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDashboard = async () => {
      if (!userAddress) return;
      try {
        setLoading(true);


        const { data: kyc } = await axios.get(buildApiUrl(`/kyc/requests/${userAddress}`));
        setKycData(kyc);


        const props = await getUserProperties(userAddress);
        console.log(props)
        setProperties(props);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load your dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDashboard();
  }, [userAddress, getUserProperties]);

  const totalValue = properties.reduce(
    (sum, p) => sum + Number(p.price || 0),
    0
  );
  const soldCount = properties.filter((p) => p.sold).length;
  const availableCount = properties.length - soldCount;

  // ✅ Fix: Handle status properly (ensure consistent casing)
  const kycStatus = kycData?.status?.toLowerCase();

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center md:text-left">
        My Dashboard
      </h1>

      {loading ? (
        <p className="text-center">Loading your data...</p>
      ) : !kycData ? (
        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-700">
            No KYC record found
          </h3>
          <p className="text-gray-600">
            Please complete your KYC verification to access the dashboard.
          </p>
        </div>
      ) : (
        <>
          {/* ✅ USER PROFILE SUMMARY */}
          {/* <div className="bg-white p-6 rounded-xl shadow-md mb-8 
          flex flex-col md:flex-row items-center md:items-start gap-6">
            <img
              src={
                kycData.selfie ||
                `https://api.dicebear.com/9.x/identicon/svg?seed=${kycData.walletAddress}`
              }
              alt="avatar"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border object-cover"
            />
            <div className="flex flex-col gap-1 text-center md:text-left">
              <h3 className="text-2xl font-semibold">{kycData.fullName}</h3>
              <p className="text-gray-600">{kycData.email}</p>
              {kycData.phoneNumber && (
                <p className="text-gray-600">📞 {kycData.phoneNumber}</p>
              )}
              {kycData.location && (
                <p className="text-gray-600">📍 {kycData.location}</p>
              )}
              <p className="text-gray-600 text-xs break-all">
                Wallet:{" "}
                <span className="text-xs font-mono bg-gray-100 p-1 rounded">
                  {kycData.walletAddress}
                </span>
              </p>

              <p
                className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  kycStatus === "approved"
                    ? "bg-green-100 text-green-700"
                    : kycStatus === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {kycStatus === "approved"
                  ? " KYC Verified"
                  : kycStatus === "rejected"
                  ? " Rejected"
                  : " Pending Verification"}
              </p>
            </div>
          </div> */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8 overflow-x-auto">
            <div className="flex flex-col items-center mb-6">
              <img
                src={
                  kycData.selfie ||
                  `https://api.dicebear.com/9.x/identicon/svg?seed=${kycData.walletAddress}`
                }
                alt="avatar"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border object-cover mb-4"
              />
              <p
                className={`px-3 py-1 rounded-full text-sm font-medium ${kycStatus === "approved"
                    ? "bg-green-100 text-green-700"
                    : kycStatus === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                {kycStatus === "approved"
                  ? "KYC Verified"
                  : kycStatus === "rejected"
                    ? "Rejected"
                    : "Pending Verification"}
              </p>
            </div>

            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-700 w-1/3">Full Name</td>
                  <td className="px-4 py-3 text-gray-600">{kycData.fullName}</td>
                </tr>

                <tr className="border-b">
                  <td className="px-4 py-3 font-medium text-gray-700">Email</td>
                  <td className="px-4 py-3 text-gray-600">{kycData.email}</td>
                </tr>

                {kycData.phoneNumber && (
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-gray-700">Phone Number</td>
                    <td className="px-4 py-3 text-gray-600">{kycData.phoneNumber}</td>
                  </tr>
                )}

                {kycData.location && (
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-gray-700">Location</td>
                    <td className="px-4 py-3 text-gray-600">{kycData.location}</td>
                  </tr>
                )}

                <tr>
                  <td className="px-4 py-3 font-medium text-gray-700">Wallet Address</td>
                  <td className="px-4 py-3 text-gray-600 break-all">
                    <span className="font-mono bg-gray-100 p-1 rounded">
                      {kycData.walletAddress}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl shadow text-center">
              <h4 className="text-gray-600 text-sm md:text-base">Total Properties</h4>
              <p className="text-2xl font-bold">{properties.length}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow text-center">
              <h4 className="text-gray-600 text-sm md:text-base">Available</h4>
              <p className="text-2xl font-bold text-green-600">
                {availableCount}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow text-center">
              <h4 className="text-gray-600 text-sm md:text-base">Sold</h4>
              <p className="text-2xl font-bold text-blue-600">{soldCount}</p>
            </div>
          </div>

          {/* ✅ PROPERTY TABLE */}
          <div className="bg-white p-4 rounded-xl shadow-md overflow-x-auto">
            <h3 className="text-xl font-semibold mb-4 text-center md:text-left">
              My Properties Overview
            </h3>
            {properties.length === 0 ? (
              <p className="text-gray-600 text-center">
                You haven’t added any property yet.
              </p>
            ) : (
              <table className="w-full text-left border-collapse text-sm md:text-base">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="p-3">Title</th>
                    <th className="p-3 hidden sm:table-cell">Category</th>
                    <th className="p-3 hidden md:table-cell">Price </th>
                    <th className="p-3 hidden md:table-cell">Location</th>

                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-3">{p.title}</td>
                      <td className="p-3 hidden sm:table-cell">{p.category}</td>
                      <td className="p-3 hidden md:table-cell">{p.price}</td>
                      <td className="p-3 hidden md:table-cell">{p.location}</td>


                      <td className="p-3">
                        {p.sold ? (
                          <span className="text-red-600 font-semibold">Sold</span>
                        ) : (
                          <span className="text-green-600 font-semibold">
                            Available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

