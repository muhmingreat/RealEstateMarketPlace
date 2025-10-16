import React from "react";

export default function About() {
  return (
    <section className="bg-[#1B2A49] py-20 px-6 flex flex-col items-center text-center">
      {/* Title with gold gradient */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 mb-10">
        Our Mission
      </h1>

      {/* Frosted glass card */}
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-lg">
        <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
          At <span className="font-semibold text-yellow-300">RealDeal</span>, 
          we aim to simplify property transactions by connecting buyers, sellers, 
          and agents seamlessly on a secure and transparent platform. Our goal 
          is to make real estate accessible, reliable, and efficient for everyone.
        </p>

        <p className="text-md md:text-lg text-gray-300 mt-6 leading-relaxed">
          Whether you’re looking to buy your dream home or sell your property, 
          our platform provides tools, listings, and insights to make your 
          real estate journey smooth and enjoyable.
        </p>
      </div>
    </section>
  );
}


// import React from "react";

// export default function About() {
//   return (
//     <section className="bg-[#1B2A49] py-16 px-4 text-center">
//       {/* Title with gradient */}
//       <h1 className="text-4xl md:text-5xl font-extrabold text-transparent m-10
//        bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-6">
//         Our Mission
//       </h1>

//       {/* Description */}
//       <div className=" max-w-3xl p-5 shadow-full bg-gradient-to-r mt-9
//        from-blue-500 via-purple-500 to-pink-500 mx-auto mb-6 rounded">
//         <p className="max-w-2xl mx-auto  md:text-xl text-gray-300">
//             At <span className="text-md text-[#00BFA6]">RealDeal</span>, 
//             we aim to simplify property transactions by connecting buyers, sellers, 
//         and agents seamlessly on a secure and transparent platform. Our goal 
//         is to make real estate accessible, reliable, and efficient for everyone.
//       </p>

//       {/* Optional extra details */}
//       <p className="max-w-2xl mx-auto text-md md:text-lg text-gray-300 mt-4">
//         Whether you’re looking to buy your dream home or sell your property, 
//         our platform provides tools, listings, and insights to make your 
//         real estate journey smooth and enjoyable.
//       </p>
//       </div>
//     </section>
//   );
// }
