// PropertyDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ethers } from "ethers";
import useContractInstance from "../hooks/useContractInstance";
import { useAppKitAccount } from "@reown/appkit/react";

import AddReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import PropertyMap from "../components/PropertyMap";
import PropertyActions from "../components/PropertyAction";
import { useGetProductReview } from "../hooks/useBlockchain";

const PropertyDetails = () => {
  const { id } = useParams();
  const contract = useContractInstance("realE", true);
  const { address } = useAppKitAccount();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [kycVerified, setIsKycVerified] = useState(false);
  const getReviews = useGetProductReview();
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET_ADDRESS;

  // Fetch property & escrow
  useEffect(() => {
    const fetchProperty = async () => {
      if (!contract) return;
      try {
        const data = await contract.getProperty(id);
        const escrow = await contract.escrows(id);

        const prop = {
          id: data[0].toString(),
          seller: data[1],
          price: data[2],
          title: data[3],
          category: data[4],
          images: data[5],
          propertyAddress: data[6],
          description: data[7],
          sold: data[8],
          escrow: {
            buyer: escrow[0],
            amount: escrow[1],
            confirmed: escrow[2],
            refunded: escrow[3],
          },
        };

        setProperty(prop);

        console.log("=== PropertyDetails Debug ===");
        console.log("Property:", prop);
      } catch (err) {
        console.error("Failed to fetch property:", err);
      }
    };
    fetchProperty();
  }, [contract, id]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!contract) return;
      try {
        const res = await getReviews(id);
        setReviews(res);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };
    fetchReviews();
  }, [contract, id, getReviews]);

  if (!property) return <p className="text-center mt-4">Loading property...</p>;

  return (
    <div className="p-6 max-w mx-auto bg-gradient-to-br from-blue-950 via-blue-100 to-white/60">
      <h2 className="text-3xl font-bold text-center mb-6">{property.title}</h2>

      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Images */}
        <div className="flex-1 flex justify-center">
          {[...new Set(property.images)].map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Property ${idx}`}
              className="w-full max-w-md h-80 object-cover rounded-lg shadow-md mb-4 md:mb-0"
            />
          ))}
        </div>

        {/* Details + Actions */}
        <div className="flex-1 space-y-3">
          {[
            ["Status", property.sold ? "Sold" : "Available", property.sold ? "text-red-500" : "text-green-500"],
            ["Category", property.category],
            ["Price", `${ethers.formatEther(property.price)} Celo`],
            ["Address", property.propertyAddress],
            ["Description", property.description],
          ].map(([label, value, color], idx) => (
            <div className="flex gap-2" key={idx}>
              <strong className="w-28">{label}:</strong>
              <p className={`flex-1 ${color || "text-blue-500"}`}>{value}</p>
            </div>
          ))}

          <div className="mt-6 flex items-center gap-4">
            {/* ✅ Property actions */}
            <div className="inline-flex gap-2">
              <PropertyActions property={property} adminAddress={adminWallet} />
            </div>


            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border
               border-green-500 text-green-600 
               font-medium hover:bg-green-50 hover:text-green-700 
               transition-colors duration-200"
            >
              Chat with Customer
            </Link>
          </div>

          {address && ethers.getAddress(address) === ethers.getAddress(property.seller) && (
            <button
              onClick={() => navigate(`/property/${id}/update`)}
              className="mt-6 bg-yellow-500 text-white px-4 py-2 rounded
             hover:bg-yellow-600 flex items-center gap-2 justify-center"
            >
              Edit Property
            </button>
          )}
        </div>
      </div>


      {/* Map + Reviews */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="w-full max-w-3xl h-80 rounded-xl overflow-hidden shadow-md">
          <PropertyMap
            address={property.propertyAddress}
            title={property.title}
            imageUrl={property.images[0]}
          />
        </div>

        <div className="w-full max-w-3xl rounded-xl shadow-md bg-black text-white p-4">
          <AddReviewForm productId={id} user={address} />
          <div className="mt-4">
            <ReviewList productId={id} reviews={reviews} user={address} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
