import React, { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useGetUserProperties } from "../hooks/useBlockchain";
import { useCeloToUSD } from "../utils/uploadToIPFS"
import { ethers } from "ethers";

const MyProperties = () => {
  const { address, isConnected } = useAppKitAccount();
  const getUserProperties = useGetUserProperties();
  
  const [properties, setProperties] = useState([]);
const { convertCeloToUSD, celoPrice, loading, error } = useCeloToUSD();
  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !address) return;
      try {
        const result = await getUserProperties(address);
        setProperties(result);
      } catch (err) {
        console.error("Error fetching user properties:", err);
      }
    };
    fetchData();
  }, [isConnected, address, getUserProperties]);

  if (!isConnected) {
    return <p className="text-center text-gray-500">Please connect your wallet.</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 p-6 via-blue-100 to-white/60">
      <h2 className="text-2xl font-bold mb-4 mt-6 text-gray-700 text-center">
        My Properties
      </h2>

      {properties.length === 0 ? (
        <p className="text-center text-gray-500">No properties found.</p>
      ) : (
        <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-6">
          {properties.map((property) => {
          
            const celoValue = property.price ? parseFloat(property.price) : 0;

            const usdValue = celoValue
              ? convertCeloToUSD(celoValue)
              : null;
          
            return (
              <div
                key={property.productID}
                className="p-4 shadow hover:shadow-lg transition"
              >
                {property.images.length > 0 && (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}

                <h3 className="text-lg font-semibold"> Title {property.title}</h3>
                <p>
                  <strong>Category </strong> {property.category}
                </p>

                <div className="flex align-center space-x-4">
                  <p>
                    <strong>Price:</strong> {celoValue} Celo
                  </p>
                    {usdValue && (
                    <p className="font-medium text-blue-600">
                      ${usdValue}
                    </p>
                  )}
                 
                </div>

                <p>
                  <strong>Location:</strong> {property.location}
                </p>
                <p className="text-sm text-gray-600">
                  <strong className="text-black"> Description</strong> { property.description}</p>

                <p className="mt-2">
                  <strong>Status:</strong>{" "}
                  {property.sold ? (
                    <span className="text-red-500">Sold</span>
                  ) : (
                    <span className="text-green-700 font-bold">Available</span>
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProperties;


