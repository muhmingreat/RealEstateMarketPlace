import React, { useEffect, useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useGetUserProperties } from "../hooks/useBlockchain";
import { ethers } from "ethers";

const MyProperties = () => {
  const { address, isConnected } = useAppKitAccount(); // Get connected wallet
  const getUserProperties = useGetUserProperties();
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isConnected || !address) return;
      try {
        const result = await getUserProperties(address);
        // Format result if needed (assuming result is array of structs)
        const formatted = result.map((prop) => ({
          id: prop.id,
          title: prop.title,
          category: prop.category,
          price: ethers.formatEther(prop.price),
          description: prop.description,
          address: prop.location,
          images: prop.images || [],
          sold: prop.sold,
        }));
        setProperties(formatted);
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
    // <div className="p-6">
 <div className="min-h-screen p-6 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_2000px)] bg-[length:2000px_2000px]">
      <h2 className="text-2xl font-bold mb-4 text-center">My Properties</h2>
      {properties.length === 0 ? (
        <p className="text-center text-gray-500">No properties found.</p>
      ) : (
        <div className="grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className=" p-4 shadow hover:shadow-lg transition"
            >
              {property.images.length > 0 && (
                <img
                  src={property.images[0]}
                  alt={property.title}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}
              <h3 className="text-lg font-semibold">{property.title}</h3>
              <p><strong>Category:</strong> {property.category}</p>
              <p><strong>Price:</strong> {property.price} ETH</p>
              <p><strong>Address:</strong> {property.address}</p>
              <p className="text-sm text-gray-600">{property.description}</p>
              <p className="mt-2">
                <strong>Status:</strong>{" "}
                {property.sold ? "Sold" : "Available"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProperties;
