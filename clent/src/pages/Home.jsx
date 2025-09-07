import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useGetAllProperties } from "../hooks/useBlockchain";
import { setProperties } from "../redux/slices/realEstateSlice";
import About from "../components/About";
import AllProperties from "./Properties";
import SearchBar from "../components/SearchBar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import useContractInstance from "../hooks/useContractInstance";
import FAQ from "./FAQ";
import { toast } from "react-toastify";
import { useGetHighestRatedProduct } from "../hooks/useBlockchain"; // your custom hook

export default function Home() {
  const dispatch = useDispatch();
  const getAllProperties = useGetAllProperties();
  const getHighestRatedProduct = useGetHighestRatedProduct();
  const [loading, setLoading] = useState(true);
  const contract = useContractInstance("realEstate", true);

  // Stats state
  const [stats, setStats] = useState({
    availableListings: 0,
    createdListings: 0,
    soldListings: 0,
    highestRated: 0,
  });

  useEffect(() => {
    const fetchContractStats = async () => {
      try {
        if (!contract) return;

        // Created Listings
        const createdListings = await contract.propertyIndex();

        // All Properties
        const properties = await contract.getAllProperties();

        // Sold Listings
        const soldListings = properties.filter((p) => p.sold).length;

        // Available Listings
        const availableListings = properties.filter((p) => !p.sold).length;

        // Highest Rated Property
        let highestRated = await getHighestRatedProduct();
        if (highestRated !== null) highestRated = highestRated.toString();

        setStats({
          availableListings: availableListings.toString(),
          createdListings: createdListings.toString(),
          soldListings: soldListings.toString(),
          highestRated: highestRated,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        toast.error("Failed to fetch contract stats");
      }
    };

    fetchContractStats();
  }, [contract, getHighestRatedProduct]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, x: -100, rotate: -10, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      rotate: 0,
      scale: 1,
      transition: { duration: 0.7, delay: i * 0.25, ease: "easeOut" },
    }),
  };

  const statValueMotion = (i) => ({
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, delay: i * 0.3 + 0.3 },
  });

  const statLabelMotion = (i) => ({
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.5, delay: i * 0.3 + 0.4 },
  });

  return (
    <div>
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white px-6 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30" />
        <SearchBar />

        {/* Hero */}
        <motion.div
          className="relative z-10 max-w-4xl text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-5xl sm:text-6xl font-bold leading-tight"
            initial={{ opacity: 0, y: -50, rotateX: 90 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            Find Your Dream Home with{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-pink-500">
              Ease & Trust
            </span>
          </motion.h1>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-5xl w-full"
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
              className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg text-center"
              variants={cardVariants}
              custom={i}
            >
              <motion.h2
                className="text-3xl font-bold text-yellow-300 truncate"
                {...statValueMotion(i)}
              >
                {stat.value}
              </motion.h2>
              <motion.p className="mt-2 text-gray-500" {...statLabelMotion(i)}>
                {stat.label}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-6 text-gray-200 text-center mb-10 relative z-10">
          <span>
            Before submitting your KYC information, you must first read & agree to our{" "}
          </span>
          <Link to="/terms" className="text-yellow-300 underline">
            Terms & Conditions
          </Link>
        </p>
      </section>

      <AllProperties />
      <FAQ />
      <About />
      <Footer />
    </div>
  );
}




// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { useDispatch } from "react-redux";
// import { useGetAllProperties } from "../hooks/useBlockchain";
// import { setProperties } from "../redux/slices/realEstateSlice";
// import About from "../components/About";
// import AllProperties from "./Properties";
// import SearchBar from "../components/SearchBar";
// import Footer from "../components/Footer";
// import { Link } from "react-router-dom";
// import useContractInstance from "../hooks/useContractInstance";
// import FAQ from "./FAQ";

// export default function Home() {
//   const dispatch = useDispatch();
//   const getAllProperties = useGetAllProperties();
//   const [loading, setLoading] = useState(true);
//   const contract = useContractInstance("realEstate", true);

//   // ✅ Keep stats in state
//   const [stats, setStats] = useState({
 
//     availableListings: 0,
//     createdListings: 0,
//     soldListings: 0,
//   });

//   useEffect(() => {
//     const fetchContractStats = async () => {
//       try {
//         if (!contract) return;

//         // Created Listings
//         const createdListings = await contract.propertyIndex();

//         // All Properties
//         const properties = await contract.getAllProperties();

//         // Sold Listings
//         const soldListings = properties.filter((p) => p.sold).length;

//         const availableListings = properties.filter((p) => !p.sold).length;

//         // (Optional) Recent & Total Users if your contract has them
      

//         setStats({
//           availableListings: availableListings.toString(),
//           createdListings: createdListings.toString(),
//           soldListings: soldListings.toString(),
//         });
//       } catch (err) {
//         console.error("Error fetching stats:", err);
//       }
//     };

//     fetchContractStats();
//   }, [contract]);

//   // Animation variants
//   const cardVariants = {
//     hidden: { opacity: 0, x: -100, rotate: -10, scale: 0.8 },
//     visible: (i) => ({
//       opacity: 1,
//       x: 0,
//       rotate: 0,
//       scale: 1,
//       transition: { duration: 0.7, delay: i * 0.25, ease: "easeOut" },
//     }),
//   };

//   const statValueMotion = (i) => ({
//     initial: { y: 20, opacity: 0 },
//     animate: { y: 0, opacity: 1 },
//     transition: { duration: 0.5, delay: i * 0.3 + 0.3 },
//   });

//   const statLabelMotion = (i) => ({
//     initial: { y: 20, opacity: 0 },
//     animate: { y: 0, opacity: 1 },
//     transition: { duration: 0.5, delay: i * 0.3 + 0.4 },
//   });

//   return (
//     <div>
//       <section className="relative w-full min-h-screen flex 
//       flex-col items-center justify-center 
//        bg-gradient-to-r from-indigo-900 via-purple-900
//         to-indigo-900 text-white px-6 overflow-hidden">
//         {/* Overlay */}
//         <div className="absolute inset-0 bg-black bg-opacity-30" />
//         <SearchBar />

//         {/* Hero */}
//         <motion.div
//           className="relative z-10 max-w-4xl text-center"
//           initial={{ opacity: 0, y: 40 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 1 }}
//         >
//           <motion.h1
//             className="text-5xl sm:text-6xl font-bold leading-tight"
//             initial={{ opacity: 0, y: -50, rotateX: 90 }}
//             animate={{ opacity: 1, y: 0, rotateX: 0 }}
//             transition={{ duration: 1, ease: "easeOut" }}
//           >
//             Find Your Dream Home with{" "}
//             <span className="bg-clip-text text-transparent bg-gradient-to-r
//              from-yellow-400 to-pink-500">
//               Ease & Trust
//             </span>
//           </motion.h1>

//           <motion.p
//             className="mt-6 text-lg sm:text-xl
//              text-gray-200 max-w-2xl mx-auto"
//             initial={{ opacity: 0, y: 50 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 1, delay: 0.5 }}
//           >
//             Whether you are buying or selling, our platform seamlessly connects
//             you with{" "}
//             <span className="font-semibold text-yellow-300">verified properties </span>
//             and <span className="font-semibold text-yellow-300">licensed agents</span>.
//             Enjoy a streamlined process, transparent pricing, and a marketplace
//             you can trust.
//           </motion.p>
//         </motion.div>

//         {/* Stats */}
//         <motion.div
//           className="relative z-10 mt-16 grid grid-cols-1 sm:grid-cols-4 gap-8 max-w-5xl w-full"
//           initial="hidden"
//           animate="visible"
//         >
//           {[
//             { label: "Available Listings", value: stats.availableListings },
//             { label: "Created Listings", value: stats.createdListings },
//             { label: "Sold Listings", value: stats.soldListings },
//           ].map((stat, i) => (
//             <motion.div
//               key={i}
//               className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-6 shadow-lg text-center"
//               variants={cardVariants}
//               custom={i}
//             >
//               <motion.h2
//                 className="text-3xl font-bold text-yellow-300 truncate"
//                 {...statValueMotion(i)}
//               >
//                 {stat.value}
//               </motion.h2>
//               <motion.p
//                 className="mt-2 text-gray-500"
//                 {...statLabelMotion(i)}
//               >
//                 {stat.label}
//               </motion.p>
//             </motion.div>
//           ))}
//         </motion.div>

//         <p className="mt-6 text-gray-200 text-center mb-10 relative z-10">
//           <span>
//             Before submitting your KYC information, you must first read & agree to our{" "}
//           </span>
//           <Link to="/terms" className="text-yellow-300 underline">
//             Terms & Conditions
//           </Link>
//         </p>
//       </section>

//       <AllProperties />
//       <FAQ />
//       <About />
//       <Footer />
//     </div>
//   );
// }


