import React from "react";

export default function About() {
  return (
    <section className="bg-gray-50 py-16 px-4 text-center">
      {/* Title with gradient */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-6">
        Our Mission
      </h1>

      {/* Description */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-700">
            At <span className="font-semibold text-gray-900">RealEstateApp</span>, 
            we aim to simplify property transactions by connecting buyers, sellers, 
        and agents seamlessly on a secure and transparent platform. Our goal 
        is to make real estate accessible, reliable, and efficient for everyone.
      </p>

      {/* Optional extra details */}
      <p className="max-w-2xl mx-auto text-md md:text-lg text-gray-600 mt-4">
        Whether you’re looking to buy your dream home or sell your property, 
        our platform provides tools, listings, and insights to make your 
        real estate journey smooth and enjoyable.
      </p>
    </section>
  );
}
