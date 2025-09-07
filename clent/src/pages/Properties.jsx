import React, { useEffect, useState } from "react";
import { useGetAllProperties, useGetLatestEthPrice } from "../hooks/useBlockchain";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AllProperties() {
  const getAllProperties = useGetAllProperties();
  const { ethPrice } = useGetLatestEthPrice();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProps = async () => {
      setLoading(true);
      const data = await getAllProperties();
      setProperties(data || []);
      setLoading(false);
    };
    fetchProps();
  }, [getAllProperties]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="animate-spin text-blue-500" size={28} />
        <span className="ml-2">Loading properties...</span>
      </div>
    );
  }

  if (!properties.length) {
    return <p className="text-center py-6">No properties found.</p>;
  }

  return (
    <div className="p-6 w-full min-h bg-gradient-to-br from-blue-100 via-20% to-purple-300">
      <h1 className="text-3xl font-bold mb-6 text-center">All Properties</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {properties.map((property) => {
        
          const ethValue = property.price
            ? (Number(property.price) / 1e18).toFixed(2)
            : "0.00";

          
          const usdValue =
            ethPrice && property.price
              ? (Number(ethValue) * Number(ethPrice)).toFixed(2)
              : null;

          return (
            <div
              key={property.productID}
              className="shadow-lg p-4 hover:shadow-xl cursor-pointer transition"
              onClick={() => navigate(`/properties/${property.productID}`)}
            >
              <h2 className="text-xl font-semibold mb-4">{property.title}</h2>
              <img
                src={property.images?.[0] || "/placeholder.jpg"}
                alt={property.title}
                className="w-full h-80 object-cover rounded-lg mb-4 shadow-md"
              />
              <p className="font-medium">Location: {property.location}</p>

              {/* Price in ETH */}
              <p className="font-medium text-blue-600">
                {ethValue} Celo
              </p>

              {/* Price in USD */}
              {usdValue && (
                <p className="text-sm text-blue-500">
                 ${usdValue}
                </p>
              )}

              <p className="text-sm text-gray-600 line-clamp-2">
                {property.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}




