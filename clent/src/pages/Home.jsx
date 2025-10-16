import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useGetAllProperties, useGetProductReview, useGetHighestRatedProduct } from "../hooks/useBlockchain";
import useContractInstance from "../hooks/useContractInstance";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { useAppKitAccount } from "@reown/appkit/react";
import About from "../components/About";
import AllProperties from "./Properties";
import SearchBar from "../components/SearchBar";
import Footer from "../components/Footer";
import FAQ from "./FAQ";
import OurPartners from "./OurPartners";

export default function Home() {
  const dispatch = useDispatch();
  const getAllProperties = useGetAllProperties();
  const getHighestRatedProduct = useGetHighestRatedProduct();
  const getProductReview = useGetProductReview();
  const contract = useContractInstance("realEstate", true);
const { address } = useAppKitAccount();
  const [stats, setStats] = useState({
    availableListings: 0,
    createdListings: 0,
    soldListings: 0,
    highestRated: null,
  });

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchContractStats = async () => {
      try {
        if (!contract) return;

        const createdListings = await contract.propertyIndex();
        const properties = await contract.getAllProperties();

        const soldListings = properties.filter((p) => p.sold).length;
        const availableListings = properties.filter((p) => !p.sold).length;

        let highestRated = await getHighestRatedProduct();
        if (highestRated !== null) highestRated = highestRated.toString();

        setStats({
          availableListings: availableListings.toString(),
          createdListings: createdListings.toString(),
          soldListings: soldListings.toString(),
          highestRated,
        });

        // fetch reviews of highest rated property
        if (highestRated) {
          const fetchedReviews = await getProductReview(highestRated);
          setReviews(fetchedReviews);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
        toast.error("Failed to fetch contract stats");
      }
    };

    fetchContractStats();
  }, [contract, getHighestRatedProduct, getProductReview]);

  return (
    <div>
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center bg-[#1B2A49] px-6 overflow-hidden">
        <div className="absolute inset-0 bg-opacity-30" />
        <SearchBar />

        {/* Hero */}
        <motion.div
          className="relative z-10 max-w-4xl text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-5xl sm:text-6xl font-bold leading-tight text-gray-200"
            initial={{ opacity: 0, y: -50, rotateX: 90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Find Your Dream Home with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
              Ease & Trust
            </span>
          </motion.h1>
          <motion.p
            className="mt-6 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Whether you are buying or selling, our platform seamlessly connects you with{" "}
            <span className="font-semibold text-yellow-300">verified properties </span>
            and <span className="font-semibold text-yellow-300">licensed agents</span>.
            Enjoy a streamlined process, transparent pricing, and a marketplace you can trust.
          </motion.p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-4 gap-16 max-w-5xl"
          initial="hidden"
          animate="visible"
        >
          {[
            { label: "Available Listings", value: stats.availableListings },
            { label: "Created Listings", value: stats.createdListings },
            { label: "Sold Listings", value: stats.soldListings },
            { label: "Highest Rated Property", value: stats.highestRated },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-white bg-opacity-10 rounded-2xl p-6 shadow-lg text-center"
            >
              <motion.h2 className="text-3xl font-bold text-yellow-300 truncate">
                {stat.value}
              </motion.h2>
              <motion.p className="mt-2 text-gray-500">{stat.label}</motion.p>
            </motion.div>
          ))}
        </motion.div>

        {/* Reviews Section */}
        { address &&reviews.length > 0 && (
          <div className="relative z-10 mt-20 max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-yellow-300 mb-6">
              What People Are Saying
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.slice(0, 4).map((review, idx) => (
                <div
                  key={idx}
                  className="bg-white bg-opacity-10 p-6 rounded-lg shadow-md text-gray-500"
                >
                  <p className="italic mb-4">"{review.comment}"</p>
                  <p className="font-semibold text-yellow-300">
                    {review?.address
                      ? review.address.slice(0, 6) + "..." + review.address.slice(-4)
                      : "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-400">Rating: {review.rating}/5</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KYC Notice */}
        <p className="mt-6 text-gray-200 text-center mb-20 relative z-10">
          <span>
            Before submitting your KYC information, you must first read & agree to our{" "}
          </span>
          <Link to="/terms" className="text-yellow-300">
            Terms & Conditions
          </Link>
        </p>
      </section>

      <AllProperties />
      <OurPartners />
      <FAQ />
      <About />
      <Footer />
    </div>
  );
}




