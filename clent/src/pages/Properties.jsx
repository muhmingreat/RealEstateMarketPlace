import React, { useEffect, useState } from "react";
import { useGetAllProperties,  } from "../hooks/useBlockchain";
import { useCeloToUSD } from "../utils/uploadToIPFS";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

export default function AllProperties() {
  const getAllProperties = useGetAllProperties();
   const { celoPrice, convertCeloToUSD } = useCeloToUSD();
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 6;
  const navigate = useNavigate();

  // Fetch all properties
  useEffect(() => {
    const fetchProps = async () => {
      setLoading(true);
      const data = await getAllProperties();

         console.log("Raw properties from hook:", data);
      // filter out invalid entries
      const validData = Array.isArray(data)
        ? data.filter(p => p && p.productID && p.price != null)
        : [];
          console.log("Valid properties after filtering:", validData);
      setProperties(validData);
      setFilteredProperties(validData);
      setLoading(false);
    };
    fetchProps();
  }, [getAllProperties]);

  
  // Filters
  const handleShowAll = () => {
    setFilteredProperties(properties);
    setCategory("");
    setCurrentPage(0);
  };

  const handleForSale = () => {
    setFilteredProperties(properties.filter(p => p.sold));
    setCategory("");
    setCurrentPage(0);
  };

  const handleAvailable = () => {
    setFilteredProperties(properties.filter(p => !p.sold));
    setCategory("");
    setCurrentPage(0);
  };

  const handleCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    if (!selectedCategory) {
      setFilteredProperties(properties);
    } else {
      setFilteredProperties(
        properties.filter(
          p => p.category?.toLowerCase() === selectedCategory.toLowerCase()
        )
      );
    }
    setCurrentPage(0);
  };

  // Pagination
  const startIndex = currentPage * itemsPerPage;
  const currentProperties = filteredProperties
    .slice(startIndex, startIndex + itemsPerPage)
    .filter(p => p && p.productID); // extra safety

  const handleNext = () => {
    if (startIndex + itemsPerPage < filteredProperties.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center bg-[#1B2A49] h-screen-full items-center py-10">
        <Loader2 className="animate-spin text-blue-500" size={28} />
        <span className="ml-2 text-gray-300">Loading properties...</span>
      </div>
    );
  }

  if (!properties.length) {
    return (
      <p className="text-center py-6 h-screen-full text-gray-200 bg-[#1B2A49]">
        No properties found.
      </p>
    );
  }

  return (
    <div className="p-6 w-full min-h bg-[#1B2A49]">
      <h1 className="text-3xl font-bold mb-6 text-[#00BFA6] text-center">All Properties</h1>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-4 m-8">
        <button onClick={handleShowAll} className="px-2 py-2 cursor-pointer border text-white border-gray-300">
          All Properties
        </button>
        <button onClick={handleForSale} className="px-2 py-2 cursor-pointer text-white border border-gray-300">
          Sold property
        </button>
        <button onClick={handleAvailable} className="px-2 py-2 cursor-pointer text-white border border-gray-300">
          Available
        </button>

        {/* Category dropdown */}
        <label className="flex flex-col">
          <select
            value={category}
            onChange={e => handleCategory(e.target.value)}
            className="py-2 px-2 border text-white bg-[#1B2A49] border-gray-300"
            disabled={loading}
          >
            <option value=""> Property Category</option>
            <option value="mansion">Mansion</option>
            <option value="apartment">Apartment</option>
            <option value="duplex">Duplex</option>
            <option value="bungalow">Bungalow</option>
            <option value="commercial">Commercial</option>
          </select>
        </label>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currentProperties.map((property) => {
          // safe ether conversion
          const ethValue = (() => {
            try {
              if (!property.price) return "0.00";
              if (typeof property.price === "bigint" || typeof property.price === "string") {
                return ethers.formatEther(property.price);
              }
              return (Number(property.price) / 1e18).toFixed(2);
            } catch (err) {
              console.error("Failed to format price:", property.price, err);
              return "0.00";
            }
          })();


              const usdValue = celoPrice && ethValue ? convertCeloToUSD(ethValue) : null;
          return (
            <div
              key={property.productID}
              className="shadow-lg p-4 hover:shadow-xl cursor-pointer transition rounded-lg bg-[#1B2A49]"
              onClick={() => navigate(`/properties/${property.productID}`)}
            >
              <h2 className="text-x5 text-[#00BFA6] font-semibold mb-4">{property.title}</h2>
              <img
                src={property.images?.[0] }
                alt={property.title}
                className="w-full h-60 object-cover rounded-lg mb-4 shadow-md"
              />
    
              <p className="font-medium text-[#FFC857]">Location: {property.location}</p>
              <div className="flex align-center space-x-4 my-2">
                <p className="font-medium text-blue-600">{ethValue} Celo</p>
                {usdValue && <p className="font-medium text-blue-600">${usdValue}</p>}
              </div>
              <p className="text-sm text-gray-200 mb-4 line-clamp-2">{property.description}</p>
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-center mt-6 space-x-4">
        <button
          className="px-4 py-2 bg-[#00BFA6] text-white rounded disabled:opacity-50"
          onClick={handlePrev}
          disabled={currentPage === 0}
        >
          Previous
        </button>
        <button
          className="px-4 py-2 bg-[#00BFA6] text-white rounded disabled:opacity-50"
          onClick={handleNext}
          disabled={startIndex + itemsPerPage >= filteredProperties.length}
        >
          Next
        </button>
      </div>
    </div>
  );
}


