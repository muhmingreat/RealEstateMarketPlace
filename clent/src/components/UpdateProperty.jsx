// // UpdateProperty.jsx
// import React, { useEffect, useState, useRef } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useUpdateProperty, useGetProperty } from "../hooks/useBlockchain";
// import { toast } from "react-toastify";
// import { useAppKitAccount } from "@reown/appkit/react";
// import { Loader2, X } from "lucide-react";
// import { uploadToIPFS } from "../utils/uploadToIPFS";

// export default function UpdateProperty() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { address } = useAppKitAccount();

//   const updateProperty = useUpdateProperty();
//   const getProperty = useGetProperty();

//   const [originalImages, setOriginalImages] = useState([]); // from chain
//   const [newFiles, setNewFiles] = useState([]); // new selected files
//   const [previewUrls, setPreviewUrls] = useState([]); // local previews
//   const [mainImage, setMainImage] = useState(null);
//   const fileInputRef = useRef();

//   const [formData, setFormData] = useState({
//     propertyAddress: "",
//     title: "",
//     category: "",
//     description: "",
//   });

//   const [loading, setLoading] = useState(false);

//   // 🔹 Fetch property via hook
//   useEffect(() => {
//     const fetchProperty = async () => {
//       try {
//         const data = await getProperty(id);
//         if (!data) return;

//         setOriginalImages(data.images); // hook already returns images array
//         setFormData({
//           propertyAddress: data.propertyAddress,
//           title: data.propertyTitle,
//           category: data.category,
//           description: data.description,
//         });
//       } catch (error) {
//         console.error("Error fetching property:", error);
//         toast.error("Failed to load property details");
//       }
//     };
//     fetchProperty();
//   }, [id, getProperty]);

//   // 🔹 Handle file selection
//   const handleFileChange = (e) => {
//     const selectedFiles = Array.from(e.target.files);
//     const combinedFiles = [...newFiles, ...selectedFiles].slice(0, 5);

//     if (combinedFiles.length > 5) {
//       toast.warn("You can upload a maximum of 5 images.");
//     }

//     setNewFiles(combinedFiles);

//     const newPreviews = [
//       ...previewUrls,
//       ...selectedFiles.map((file) => URL.createObjectURL(file)),
//     ].slice(0, 5);

//     setPreviewUrls(newPreviews);
//   };

//   // 🔹 Handle input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

// // const handleUpdate = async (e) => {
// //   e.preventDefault();
// //   setLoading(true);

// //   try {
// //     let updatedImages = [...originalImages];

// //     // Upload new files to IPFS if any
// //     if (newFiles.length > 0) {
// //       const uploaded = [];
// //       for (const file of newFiles) {
// //         const uri = await uploadToIPFS(file);
// //         if (!uri) throw new Error("Failed to upload one of the images");
// //         uploaded.push(uri.toString()); // ✅ force string
// //       }
// //       updatedImages = uploaded;
// //     }

// //     // ✅ ensure it's an array of strings
// //     updatedImages = updatedImages.filter(Boolean).map(String);

// //     if (updatedImages.length === 0) {
// //       throw new Error("At least one image is required");
// //     }
// // console.log("updatedImages (final):", updatedImages);
// // console.log("Types:", updatedImages.map((v) => typeof v));

// //     // const success = await updateProperty(
// //     //   address,
// //     //   BigInt(id),
// //     //   updatedImages, // ✅ always clean string[]
// //     //   formData.propertyAddress || "",
// //     //   formData.title || "",
// //     //   formData.category || "",
// //     //   formData.description || ""
// //     // );
// //   const success =   await updateProperty(
// //   productId,                  // uint
// //   title || "",                // string
// //   category || "",             // string
// //   updatedImages || [],        // string[]
// //   propertyAddress || "",      // string
// //   description || "",          // string
// //   metadataURI || ""           // string
// // );


// //     if (success) {
// //       toast.success("✅ Property updated successfully!");
// //       navigate(`/properties`);
// //     }
// //   } catch (error) {
// //     console.error("UpdateProperty error:", error);
// //     toast.error("❌ Error updating property");
// //   } finally {
// //     setLoading(false);
// //   }
// // };
// const handleUpdate = async (e) => {
//   e.preventDefault();
//   setLoading(true);

//   try {
//     let updatedImages = [...originalImages];

//     // Upload new files to IPFS if any
//     if (newFiles.length > 0) {
//       const uploaded = [];
//       for (const file of newFiles) {
//         const uri = await uploadToIPFS(file);
//         if (!uri) throw new Error("Failed to upload one of the images");
//         uploaded.push(uri.toString()); // force string
//       }
//       updatedImages = uploaded;
//     }

//     // ensure it's an array of strings
//     updatedImages = updatedImages.filter(Boolean).map(String);

//     if (updatedImages.length === 0) {
//       throw new Error("At least one image is required");
//     }

//     console.log("updatedImages (final):", updatedImages);
//     console.log("Types:", updatedImages.map((v) => typeof v));

//     // ✅ pull productID from the URL param (id)
//     const propertyId = BigInt(id);

//     // ✅ send update with correct params
//     const success = await updateProperty(
//       propertyId,
//       formData.title || "",
//       formData.category || "",
//       updatedImages || [],
//       formData.propertyAddress || "",
//       formData.description || "",
//       "" // metadataURI placeholder (empty string)
//     );

//     if (success) {
//       toast.success("✅ Property updated successfully!");
//       navigate(`/properties`);
//     }
//   } catch (error) {
//     console.error("UpdateProperty error:", error);
//     toast.error("❌ Error updating property");
//   } finally {
//     setLoading(false);
//   }
// };


//   if (!address) return <p>Loading...</p>;

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br
//      from-blue-300 via-purple-200 to-pink-200 p-6">
//       <div className="w-full max-w-2xl bg-white/90 shadow-2xl rounded-2xl p-8">
//         <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">
//           Update Property
//         </h2>

//         <form onSubmit={handleUpdate} className="flex flex-col gap-5">
//           <input
//             type="text"
//             name="title"
//             placeholder="Title"
//             value={formData.title}
//             onChange={handleChange}
//             className="border rounded-lg px-4 py-2"
//             disabled={loading}
//           />

//           <input
//             type="text"
//             name="category"
//             placeholder="Category"
//             value={formData.category}
//             onChange={handleChange}
//             className="border rounded-lg px-4 py-2"
//             disabled={loading}
//           />

//           <input
//             type="text"
//             name="propertyAddress"
//             placeholder="Property Address"
//             value={formData.propertyAddress}
//             onChange={handleChange}
//             className="border rounded-lg px-4 py-2"
//             disabled={loading}
//           />

//           <textarea
//             name="description"
//             placeholder="Description"
//             value={formData.description}
//             onChange={handleChange}
//             className="border rounded-lg px-4 py-3 h-28 resize-none"
//             disabled={loading}
//           />

//           {/* Upload new images */}
//           <label className="flex flex-col">
//             <span className="text-sm font-medium text-gray-700">
//               Upload New Images (max 5)
//             </span>
//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               multiple
//               hidden
//               onChange={handleFileChange}
//               disabled={loading}
//             />
//             <button
//               type="button"
//               onClick={() => fileInputRef.current.click()}
//               className="mt-2"
//               disabled={loading}
//             >
//               Select Images
//             </button>
//           </label>

//           {/* Image previews */}
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
//             {originalImages.map((url, i) => (
//               <div key={i} className="relative group">
//                 <img
//                   src={url}
//                   alt={`Original ${i + 1}`}
//                   className={`w-full h-32 object-cover rounded-md shadow-sm cursor-pointer ${
//                     mainImage === url ? "ring-4 ring-blue-500" : ""
//                   }`}
//                   onClick={() => setMainImage(url)}
//                 />
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setOriginalImages((prev) => prev.filter((_, idx) => idx !== i))
//                   }
//                   className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-800"
//                 >
//                   <X width={10} height={10} />
//                 </button>
//                 {mainImage === url && (
//                   <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
//                     Main
//                   </span>
//                 )}
//               </div>
//             ))}

//             {previewUrls.map((url, i) => (
//               <div key={`new-${i}`} className="relative group">
//                 <img
//                   src={url}
//                   alt={`New ${i + 1}`}
//                   className={`w-full h-32 object-cover rounded-md shadow-sm cursor-pointer ${
//                     mainImage === url ? "ring-4 ring-blue-500" : ""
//                   }`}
//                   onClick={() => setMainImage(url)}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
//                     setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i));
//                   }}
//                   className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-800"
//                 >
//                   <X width={10} height={10} />
//                 </button>
//                 {mainImage === url && (
//                   <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
//                     Main
//                   </span>
//                 )}
//               </div>
//             ))}
//           </div>

//           <button
//             type="submit"
//             disabled={loading}
//             className="flex items-center justify-center gap-2 bg-gradient-to-r
//              from-blue-500 via-blue-800 to-purple-100 text-white px-6 py-3 
//              rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50"
//           >
//             {loading && <Loader2 className="w-5 h-5 animate-spin" />}
//             {loading ? "Updating..." : "Update Property"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }





import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUpdateProperty } from "../hooks/useBlockchain";
import useContractInstance from "../hooks/useContractInstance";
import { toast } from "react-toastify";
import { useAppKitAccount } from "@reown/appkit/react";
import { Loader2, X } from "lucide-react";
import { uploadToIPFS } from "../utils/uploadToIPFS";

export default function UpdateProperty() {
  const { id } = useParams();
  const contract = useContractInstance("realEstate", true);
  const updateProperty = useUpdateProperty();
  const { address } = useAppKitAccount();
  const navigate = useNavigate();

  const [originalImages, setOriginalImages] = useState([]); 
  const [newFiles, setNewFiles] = useState([]); 
  const [previewUrls, setPreviewUrls] = useState([]); 
  const [mainImage, setMainImage] = useState(null); 
  const fileInputRef = useRef();

  const [formData, setFormData] = useState({
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
        setOriginalImages(data[5]); // images from chain
        setFormData({
          propertyAddress: Array.isArray(data[6]) ? data[6][0] : data[6] || "",
          title: data[3] || "",
          category: data[4] || "",
          description: data[7] || "",
        });
      
      } catch (error) {
        console.error("Error fetching property:", error);
      }
    };
    if (contract) fetchProperty();
  }, [contract, id]);

  // 🔹 Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const combinedFiles = [...newFiles, ...selectedFiles].slice(0, 5);

    if (combinedFiles.length > 5) {
      toast.warn("You can upload a maximum of 5 images.");
    }

    setNewFiles(combinedFiles);

    const newPreviews = [
      ...previewUrls,
      ...selectedFiles.map((file) => URL.createObjectURL(file)),
    ].slice(0, 5);

    setPreviewUrls(newPreviews);
  };

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
      let updatedImages = [...originalImages];

      // Upload new files to IPFS
      if (newFiles.length > 0) {
        const uploaded = [];
        for (const file of newFiles) {
          const uri = await uploadToIPFS(file);
          if (!uri) throw new Error("Failed to upload one of the images");
          uploaded.push(uri);
        }
        updatedImages = [...uploaded];
      }

      const success = await updateProperty(

        BigInt(id),
        formData.title,
        formData.category,
        updatedImages,
        formData.propertyAddress,
        formData.description,
        ""
      );



      if (success) {
        toast.success("✅ Property updated successfully!");
        navigate(`/properties`);
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(" Error updating property");
    } finally {
      setLoading(false);
    }
  };

  if (!contract || !address) return <p>Loading...</p>;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br
     from-blue-300 via-purple-200 to-pink-200 p-6">
      <div className="w-full max-w-2xl bg-white/90 shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 text-center">
          Update Property
        </h2>

        <form onSubmit={handleUpdate} className="flex flex-col gap-5">

          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
            disabled={loading}
          />


          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
            disabled={loading}
          />

          {/* Address */}
          <input
            type="text"
            name="propertyAddress"
            placeholder="Property Address"
            value={formData.propertyAddress}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2"
            disabled={loading}
          />

          {/* Description */}
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="border rounded-lg px-4 py-3 h-28 resize-none"
            disabled={loading}
          />

          {/* Upload new images */}
          <label className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              Upload New Images (max 5)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileChange}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="mt-2 "
              disabled={loading}
            >
              Select Images
            </button>
          </label>

          {/* Show previews */}

          {/* // inside image preview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {originalImages.map((url, i) => (
              <div key={i} className="relative group">
                <img
                  src={url}
                  alt={`Original ${i + 1}`}
                  className={`w-full h-32 object-cover rounded-md shadow-sm cursor-pointer 
                    ${mainImage === url ? "ring-4 ring-blue-500" : ""
                    }`}
                  onClick={() => setMainImage(url)} // select main
                />

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() =>
                    setOriginalImages((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="absolute top-1 right-1 bg-red-600
         text-white rounded-full px-2 py-1 text-xs hover:bg-red-800"
                >
                  <X width={10} height={10} />
                </button>

                {/* Show "Main" badge if selected */}
                {mainImage === url && (
                  <span className="absolute bottom-1 left-1 bg-blue-600
         text-white text-xs px-2 py-1 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}

            {previewUrls.map((url, i) => (
              <div key={`new-${i}`} className="relative group">
                <img
                  src={url}
                  alt={`New ${i + 1}`}
                  className={`w-full h-32 object-cover rounded-md shadow-sm cursor-pointer ${mainImage === url ? "ring-4 ring-blue-500" : ""
                    }`}
                  onClick={() => setMainImage(url)}
                />

                <button
                  type="button"
                  onClick={() => {
                    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
                    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs hover:bg-red-800"
                >
                  <X width={10} height={10} />
                </button>

                {mainImage === url && (
                  <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r
             from-blue-500 via-blue-800 to-purple-100 text-white px-6 py-3 
             rounded-xl font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Updating..." : "Update Property"}
          </button>
        </form>
      </div>
    </div>
  );
}