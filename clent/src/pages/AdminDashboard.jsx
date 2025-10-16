// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useGetUserProperties } from "../hooks/useBlockchain";
import { ethers } from "ethers";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { useAppKitAccount } from "@reown/appkit/react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../utils/api";

export default function AdminDashboard() {
  const { address } = useAppKitAccount();
  const getUserProperties = useGetUserProperties();
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_WALLET_ADDRESS?.toLowerCase();

  // ✅ Helper: normalize price to CELO number
  function priceToCeloNumber(price) {
    if (price === undefined || price === null || price === "") return 0;

    if (typeof price === "number") {
      return isNaN(price) ? 0 : price;
    }

    const s = String(price).trim();

    // If it's a long numeric string (wei)
    if (/^\d+$/.test(s) && s.length > 10) {
      try {
        const asEther = ethers.formatEther(s);
        const n = Number(asEther);
        return isNaN(n) ? 0 : n;
      } catch {
        return 0;
      }
    }

    // Otherwise, parse as float
    const parsed = Number(s);
    return isNaN(parsed) ? 0 : parsed;
  }

  // ✅ Redirect non-admin users
  useEffect(() => {
    if (!address) return;
    if (address.toLowerCase() !== ADMIN_ADDRESS) {
      toast.error("Access denied — Admins only");
      navigate("/user/dashboard");
    }
  }, [address]);

  // ✅ Fetch all verified users + properties
  useEffect(() => {
    const fetchKYCAndProperties = async () => {
      if (!address || address.toLowerCase() !== ADMIN_ADDRESS) return;
      try {
        setLoading(true);

        const { data: kycUsers } = await axios.get(buildApiUrl("/kyc/approved"));
        setApprovedUsers(kycUsers);

        const enriched = await Promise.all(
          kycUsers.map(async (user) => {
            try {
              const properties = await getUserProperties(user.walletAddress);

              const totalValue = properties.reduce(
                (acc, p) => acc + priceToCeloNumber(p.price),
                0
              );
              const totalSales = properties.filter((p) => p.sold).length;
              const totalAvailable = properties.length - totalSales;

              return {
                ...user,
                propertyCount: properties.length,
                totalSales,
                totalAvailable,
                totalValue: Number(totalValue.toFixed(6)), // clean precision
                properties,
              };
            } catch (err) {
              console.error("Property fetch failed:", err);
              return {
                ...user,
                properties: [],
                propertyCount: 0,
                totalSales: 0,
                totalAvailable: 0,
                totalValue: 0,
              };
            }
          })
        );

        setUserData(enriched);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchKYCAndProperties();
  }, [address, ADMIN_ADDRESS, getUserProperties]);

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#845EC2",
    "#FF6F91",
  ];

  // ✅ Chart Data
  const chartData = [
    {
      name: "Users with Properties",
      value: userData.filter((u) => u.propertyCount > 0).length,
    },
    {
      name: "Users without Properties",
      value: userData.filter((u) => u.propertyCount === 0).length,
    },
  ];

  const barData = userData.map((u) => ({
    name: u.fullName?.split(" ")[0] || "User",
    properties: u.propertyCount,
    sold: u.totalSales,
  }));

  const lineData = userData.map((u) => ({
    name: u.fullName?.split(" ")[0] || "User",
    totalValue: Number(u.totalValue) || 0,
  }));

  if (address?.toLowerCase() !== ADMIN_ADDRESS) {
    return (
      <div className="flex justify-center items-center h-screen text-lg font-semibold">
        You are not authorized to access this page.
      </div>
    );
  }

  // ✅ Total property value across all users (formatted)
  const totalPropertyValue = userData.length
    ? userData
        .reduce((sum, u) => sum + (Number(u.totalValue) || 0), 0)
        .toFixed(2)
    : "0.00";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          {/* Charts + Stats */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-10">
            {/* PIE CHART */}
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">
                Verified User Overview
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    label
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* BAR CHART */}
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">
                Properties & Sales per User
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="properties"
                    fill="#00C49F"
                    name="Total Properties"
                  />
                  <Bar dataKey="sold" fill="#FF8042" name="Sold Properties" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* LINE CHART */}
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-semibold mb-3">
                Property Value Distribution (CELO)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="totalValue"
                    stroke="#0088FE"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-4 rounded-xl shadow-md mb-8">
            <h3 className="text-xl font-semibold mb-3">Quick Stats</h3>
            <ul className="space-y-2 text-gray-700">
              <li>👥 Total Verified Users: <b>{approvedUsers.length}</b></li>
              <li>
                🏠 Total Properties:{" "}
                <b>
                  {userData.reduce(
                    (sum, u) => sum + (u.propertyCount || 0),
                    0
                  )}
                </b>
              </li>
              <li>
                💰 Total Sales:{" "}
                <b>
                  {userData.reduce((sum, u) => sum + (u.totalSales || 0), 0)}
                </b>
              </li>
              <li>
                💎 Total Property Value (CELO): <b>{totalPropertyValue}</b>
              </li>
            </ul>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold mb-4">Verified User Details</h3>
            <table className="w-full text-left border-collapse table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Avatar</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3 hidden sm:table-cell">Email</th>
                  <th className="p-3 hidden md:table-cell">Wallet</th>
                  <th className="p-3">Properties</th>
                  <th className="p-3 hidden sm:table-cell">Available</th>
                  <th className="p-3 hidden sm:table-cell">Sold</th>
                  <th className="p-3 hidden md:table-cell">
                    Total Value (CELO)
                  </th>
                </tr>
              </thead>
              <tbody>
                {userData.map((u, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2 sm:p-3">
                      <img
                        src={
                          u.selfie ||
                          `https://api.dicebear.com/9.x/identicon/svg?seed=${u.walletAddress}`
                        }
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </td>
                    <td className="p-2 sm:p-3 font-medium">{u.fullName}</td>
                    <td className="p-2 sm:p-3 hidden sm:table-cell">{u.email}</td>
                    <td className="p-2 sm:p-3 text-xs font-mono hidden md:table-cell">
                      {u.walletAddress}
                    </td>
                    <td className="p-2 sm:p-3">{u.propertyCount}</td>
                    <td className="p-2 sm:p-3 hidden sm:table-cell">
                      {u.totalAvailable}
                    </td>
                    <td className="p-2 sm:p-3 hidden sm:table-cell">
                      {u.totalSales}
                    </td>
                    <td className="p-2 sm:p-3 hidden md:table-cell">
                      {(Number(u.totalValue) || 0).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


