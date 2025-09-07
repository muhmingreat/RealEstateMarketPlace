import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUpdateProperty } from "../hooks/useBlockchain";
import useContractInstance from "../hooks/useContractInstance";
import { toast } from "react-toastify";
import { useAppKitAccount } from "@reown/appkit/react";
import { Loader2 } from "lucide-react";

export default function UpdateProperty() {
  const { id } = useParams();
  const contract = useContractInstance();
  const updateProperty = useUpdateProperty();
  const { address } = useAppKitAccount();
  const navigate = useNavigate();

  const [originalImages, setOriginalImages] = useState([]);
  const [formData, setFormData] = useState({
    images: "",
    propertyAddress: "",
    title: "",
    category: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await contract.getProperty(id);
        setOriginalImages(data[5]); // store original images separately
        setFormData({
          images: data[5].join(", "),
          propertyAddress: data[6],
          title: data[3],
          category: data[4],
          description: data[7],
        });
      } catch (error) {
        console.error("Error fetching property:", error);
      }
    };
    if (contract) fetchProperty();
  }, [contract, id]);

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Handle form submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let updatedImages =
        formData.images.trim() !== ""
          ? formData.images
              .split(",")
              .map((img) => img.trim())
              .filter((img) => img.length > 0)
          : [...originalImages];

      const success = await updateProperty(
        address,
        id,
        updatedImages,
        formData.propertyAddress,
        formData.title,
        formData.category,
        formData.description
      );

      if (success) {
        toast.success("✅ Property updated successfully!");
        navigate(`/properties`);
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("❌ Error updating property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-300 via-purple-200 to-pink-200 p-6">
      <div className="w-full max-w-2xl bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">
          ✏️ Update Property
        </h2>

        <form onSubmit={handleUpdate} className="flex flex-col gap-5">
          <input
            type="text"
            name="images"
            placeholder="Images URL(s), comma separated"
            value={formData.images}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="propertyAddress"
            placeholder="Property Address"
            value={formData.propertyAddress}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none"
          />

          {/* 🔹 Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Updating..." : "Update Property"}
          </button>
        </form>
      </div>
    </div>
  );
}



// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useUpdateProperty } from "../hooks/useBlockchain";
// import useContractInstance from "../hooks/useContractInstance";
// import { toast } from "react-toastify";
// import { useAppKitAccount } from "@reown/appkit/react";
// import { Loader2 } from "lucide-react";

// export default function UpdateProperty({ property }) {
//   const { id } = useParams();
//   const contract = useContractInstance();
//   const updateProperty = useUpdateProperty();
//   const { address } = useAppKitAccount();
//   const navigate = useNavigate();

//   const [originalImages, setOriginalImages] = useState([]);
//   const [formData, setFormData] = useState({
//     images: "",
//     propertyAddress: "",
//     title: "",
//     category: "",
//     description: "",
//   });
//   const [loading, setLoading] = useState(false);

//   // 🔹 Fetch property from contract
//   useEffect(() => {
//     const fetchProperty = async () => {
//       try {
//         const data = await contract.getProperty(id);
//         setOriginalImages(data[5]); // keep original separately
//         setFormData({
//           images: data[5].join(","), // show in text field
//           propertyAddress: data[6],
//           title: data[3],
//           category: data[4],
//           description: data[7],
//         });
//       } catch (error) {
//         console.error("Error fetching property:", error);
//       }
//     };
//     if (contract) fetchProperty();
//   }, [contract, id]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleUpdate = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       let updatedImages;
//       if (formData.images.trim() !== "") {
//         updatedImages = formData.images
//           .split(",")
//           .map((img) => img.trim())
//           .filter((img) => img.length > 0);
//       } else {
//         updatedImages = [...originalImages];
//       }

//       const success = await updateProperty(
//         address, // owner
//         id, // property ID
//         updatedImages,
//         formData.propertyAddress,
//         formData.title,
//         formData.category,
//         formData.description
//       );

//       if (success) {
//         toast.success("Property updated successfully!");
//         navigate(`/properties`);
//       }
//     } catch (error) {
//       console.error("Update failed:", error);
//       toast.error("Error updating property");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-red-500 via-blue-200 to-pink-200 p-6">
//       <div className="w-full max-w-2xl bg-white/80 backdrop-blur-md shadow-xl rounded-2xl p-8">
//         <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
//           Update Property
//         </h2>
//         <form onSubmit={handleUpdate} className="flex flex-col gap-4">
//           <input
//             type="text"
//             name="images"
//             placeholder="Images URL(s), comma separated"
//             value={formData.images}
//             onChange={handleChange}
//             className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="text"
//             name="propertyAddress"
//             placeholder="Property Address"
//             value={formData.propertyAddress}
//             onChange={handleChange}
//             className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="text"
//             name="title"
//             placeholder="Title"
//             value={formData.title}
//             onChange={handleChange}
//             className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <input
//             type="text"
//             name="category"
//             placeholder="Category"
//             value={formData.category}
//             onChange={handleChange}
//             className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//           <textarea
//             name="description"
//             placeholder="Description"
//             value={formData.description}
//             onChange={handleChange}
//             className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-28 resize-none"
//           />

//           <button
//             type="submit"
//             disabled={loading}
//             className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50"
//           >
//             {loading && <Loader2 className="w-5 h-5 animate-spin" />}
//             {loading ? "Updating..." : "Update Property"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
