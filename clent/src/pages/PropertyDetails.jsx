
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ethers } from "ethers";
import useContractInstance from "../hooks/useContractInstance";
import { useAppKitAccount } from "@reown/appkit/react";
import { X } from "lucide-react";
import AddReviewForm from "../components/ReviewForm";
import ReviewList from "../components/ReviewList";
import PropertyMap from "../components/PropertyMap";
import PropertyActions from "../components/PropertyAction";
import { useGetProductReview, useDeleteProperty } from "../hooks/useBlockchain";
import DocsFlow from "./DocsFlow";
import { useCeloToUSD } from "../utils/uploadToIPFS";

const PropertyDetails = () => {
  const { id } = useParams();
  const contract = useContractInstance("realEstate", true);
  const { address } = useAppKitAccount();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);

  const [property, setProperty] = useState(null);
  const [reviews, setReviews] = useState([]);
  const getReviews = useGetProductReview();
  const deleteProperty = useDeleteProperty();
  const adminWallet = import.meta.env.VITE_ADMIN_WALLET_ADDRESS;
  const [showDocsModal, setShowDocsModal] = useState(false);
  const { convertCeloToUSD, loading: priceLoading, error: priceError } = useCeloToUSD();

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
        console.log("Fetched property:", prop);
        setProperty(prop);
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

  // Delete handler
  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this property?");
    if (!confirmed) return;

    const success = await deleteProperty(id);
    if (success) navigate("/");
  };
 
  const celoValue = property?.price ? ethers.formatEther(property.price) : "0";
  const usdValue =
    celoValue && !isNaN(parseFloat(celoValue))
      ? convertCeloToUSD(parseFloat(celoValue))
      : null;

  if (!property)
    return <p className="text-center mt-4">Loading property...</p>;


  if (!property) return <p className="text-center mt-4">Loading property...</p>;

  return (

    <div className="w-full px-4 sm:px-6 md:px-10 py-6  mx-auto bg-gradient-to-br
     from-blue-500 via-blue-100 to-white shadow-md">

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 text-gray-800">
        {property.title}
      </h2>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {/* Main image */}
        <div
          className="cursor-pointer"
          onClick={() => setSelectedImage(property.images[0])}
        >
          <img
            src={property.images[0]}
            alt="Main"
            className="w-full h-56 sm:h-72 md:h-[500px] object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Secondary images */}
        <div className="grid grid-cols-2 gap-2">
          {property.images.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              className="cursor-pointer"
              onClick={() => setSelectedImage(img)}
            >
              <img
                src={img}
                alt={`Property ${idx + 2}`}
                className="w-full h-28 sm:h-36 md:h-[245px] object-cover rounded-lg shadow-md"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Details */}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {[
          ["Status", property.sold ? "Sold" : "Available", property.sold ? "text-red-500" : "text-green-700"],
          ["Category", property.category],
          [
            "Price",
            `${celoValue}` + (usdValue ? `  $${usdValue}` : priceLoading ? "  (Fetching USD...)" : ""),
            "text-blue-600"
          ],
          ["Address", property.propertyAddress],
          ["Description", property.description],
        ].map(([label, value, color], idx) => (
          <div key={idx} className="flex flex-col sm:flex-row gap-2">
            <strong className="w-28">{label}:</strong>
            <p className={`flex-1 ${color || "text-gray-700"}`}>{value}</p>
          </div>
        ))}
      </div>
    

      {/* Actions */}
      {property.sold && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
          This property has been sold. Contact the seller for more information.
        </div>
      )}
      <div className="inline-flex items-center justify-center px-4 mb-9">
        <PropertyActions property={property} adminAddress={adminWallet} />
      </div>
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10"
      >
        {/* Chat button */}
        <Link
          to="/chat"
          className="text-center inline-flex items-center justify-center gap-2 
      px-4 py-2 rounded-lg border border-green-500 text-green-600 font-medium 
      hover:bg-green-50 hover:text-green-700 transition-colors duration-200"
        >
          Chat with Customer
        </Link>




        {property?.id &&
          property.escrow.amount > Number(0) &&
          !property.escrow.confirmed &&
          !property.sold &&
          address &&
          ethers.getAddress(address) === ethers.getAddress(property.seller) && (
            <div className="">

              <button
                onClick={() => setShowDocsModal(true)}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600"
              >
                Manage Documents
              </button>

            </div>
          )}

        {/* Modal */}
        {showDocsModal && (
          <div
            className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowDocsModal(false)}
          >
            <div
              className="bg-white p-6 rounded-xl shadow-lg max-w-3xl w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDocsModal(false)}
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
              >
                <X />
              </button>


              <DocsFlow
                propertyId={property.id}
                buyerKycId={property.escrow.buyer}
              />
            </div>
          </div>
        )}



        {address &&
          ((!property.isSold &&
            ethers.getAddress(address) === ethers.getAddress(property.seller)) ||
            (property.isSold &&
              ethers.getAddress(address) === ethers.getAddress(property.buyer))) && (
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={() => navigate(`/${id}/update`)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg 
            bg-yellow-500 text-white hover:bg-yellow-600 transition-colors duration-200"
              >
                Edit Property
              </button>

              <button
                onClick={handleDelete}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg
            bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
              >
                Delete Property
              </button>
            </div>
          )}
      </div>


      {/* Map + Reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-md">
          <PropertyMap
            address={property.propertyAddress}
            title={property.title}
            imageUrl={property.images[0]}
          />
        </div>
        <div className="w-full rounded-xl shadow-md bg-white p-4">
          <AddReviewForm productId={id} user={address} />
          <div className="mt-4">
            <ReviewList productId={id} reviews={reviews} user={address} />
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Preview"
            className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;










