import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setSearchQuery } from "../redux/slices/realEstateSlice";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { searchQuery, properties } = useSelector((s) => s.realEstate);

  // 🔎 Multi-field filter
  const filteredProperties = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return [];

    return (properties || []).filter((p) => {
      const title = p?.title?.toLowerCase() || "";
      const location = p?.location?.toLowerCase() || "";
      const agent = p?.agent?.toLowerCase() || "";
      const rateStr = (p?.rate ?? p?.rating ?? p?.averageRating ?? "")
        .toString()
        .toLowerCase();

      return (
        title.includes(q) ||
        location.includes(q) ||
        agent.includes(q) ||
        rateStr.includes(q)
      );
    });
  }, [properties, searchQuery]);

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-10">
      {/* Search Input */}
      <motion.div
        className="flex items-center bg-white rounded-full shadow-lg
         overflow-hidden border border-gray-200"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <input
          type="text"
          placeholder="Search for properties, locations, or agents..."
          className="flex-1 px-6 py-3 text-gray-800 outline-none text-sm sm:text-base"
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        />
        <button
          className="bg-gradient-to-r from-yellow-400
           to-pink-500 p-3 sm:p-4 flex items-center 
           justify-center text-white hover:opacity-90 transition"
        >
          <Search size={22} />
        </button>
      </motion.div>

      {/* Results */}
      {searchQuery?.trim() && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-yellow-300">
            Search Results
          </h2>
          {filteredProperties.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <motion.div
                  key={property.productID}
                  className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-xl cursor-pointer transition"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => navigate(`/properties/${property.productID}`)}
                >
                  <h3 className="text-lg font-semibold text-yellow-300 line-clamp-1">
                    {property.title}
                  </h3>
                  <img
                    src={property.images?.[0] || "/placeholder.jpg"}
                    alt={property.title}
                    className="w-full h-44 object-cover rounded-lg my-3 border border-white/20"
                  />
                  <p className="text-sm">📍 {property.location || "—"}</p>
                  <p className="text-sm">💰 {property.price} ETH</p>
                  {property.rate != null && (
                    <p className="text-sm">⭐ {property.rate}</p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-200">No matching properties found.</p>
          )}
        </div>
      )}
    </div>
  );
}



