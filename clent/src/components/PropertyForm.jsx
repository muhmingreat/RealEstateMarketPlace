import React, { useState, useRef,useEffect } from "react";
import { motion } from "framer-motion";
import useListProperty from "../hooks/useListProperty";
import { useAppKitAccount } from "@reown/appkit/react";
import { uploadToIPFS } from "../utils/uploadToIPFS";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import { useGetLatestEthPrice } from "../hooks/useBlockchain";
import { Loader2 } from "lucide-react";
import ThunderSuccess from "./ThunderSuccess";

  
  export default function PropertyForm() {
  const { ethPrice } = useGetLatestEthPrice()
  const [showThunder, setShowThunder] = useState(false);

  const handleListProperty = useListProperty();
  const { address } = useAppKitAccount();


  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("House");
  const [files, setFiles] = useState([]); 
  const [previewUrls, setPreviewUrls] = useState([]); 
  const [propertyAddress, setPropertyAddress] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef();
// const dispatch = useDispatch();

  // Access Redux state from your slice
  // const { loading, error, properties } = useSelector(
  //   (state) => state.realEstate
  // );

  
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).slice(0, 5);

    if (e.target.files.length > 5) {
      toast.warn("You can upload a maximum of 5 images.");
    }

    setFiles(selectedFiles);
    setPreviewUrls(selectedFiles.map((file) => URL.createObjectURL(file)));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if ( !price || !title || !category || !propertyAddress || !description) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (files.length === 0) {
      toast.error("Please select at least one image.");
      return;
    }

    setLoading(true);

    try {
  
      const uploadedImages = [];
      for (const file of files) {
        const uri = await uploadToIPFS(file);
        if (!uri) throw new Error("Failed to upload one of the images");
        uploadedImages.push(uri);
      }

      if (!price || isNaN(Number(price))) {
        toast.error("Price must be a valid number");
        return;
      }
      const priceInWei = ethers.parseEther(price.toString(6));
     

      // Call smart contract
      const success = await handleListProperty(
        address,
        priceInWei,               
        title,
        category,
        uploadedImages,
        propertyAddress,
        description
      );

      if (success) {
  
        setTitle("");
        setPrice("");
        setCategory("House");
        setFiles([]);
        setPreviewUrls([]);
        setPropertyAddress("");
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowThunder(true);
      }
    } catch (err) {
      console.error(err);
  
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  if (showThunder) {
    const timer = setTimeout(() => setShowThunder(false), 1000);
    return () => clearTimeout(timer);
  }
}, [showThunder]);


  return (
    <>
     <ThunderSuccess trigger={showThunder} />
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-600 to-blue-100 p-6">
    {/* <div className="bg-shining"> */}
  <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto shadow-full bg-gradient-to-br from-blue-400 via-blue-100 to-black/55 rounded-xl p-6 space-y-6"
    >
      <h3 className="text-2xl font-semibold mb-3 text-center text-gray-800">List Your Property</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Title </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 p-3 border rounded-md"
            required
            disabled={loading}
          />
        </label>

      
        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Price in Celo </span>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 p-3 border rounded-md"
            required
            disabled={loading}
          />

  
          {ethPrice && price && (
            <span className="text-sm text-blue-500 mt-1">
               ${(Number(price) * Number(ethPrice)).toLocaleString(undefined,
                 { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </label>
      {/* </div> */}
        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Category </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 p-3 border rounded-md"
            disabled={loading}
          >
            <option>House</option>
            <option>Apartment</option>
            <option>Land</option>
            <option>Commercial</option>
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm font-medium text-gray-700">Property Address </span>
          <input
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            className="mt-2 p-3 border rounded-md"
            required
            disabled={loading}
          />
        </label>
      </div>

      <label className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">Description </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-2 p-3 border rounded-md"
          required
          disabled={loading}
        />
      </label>

      <label className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">Upload Images max 5 </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="mt-2"
          disabled={loading}
        />
      </label>

      {/* Preview selected images */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {previewUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Selected ${i + 1}`}
              className="w-full h-32 object-cover rounded-md shadow-sm"
            />
          ))}
        </div>
      )}
    
      <button
      

        type="submit"
        disabled={loading}
        className={`px-6 p-2 rounded-md text-green-900 font-medium  flex justify-center ${loading ? 
          "bg-indigo-300 cursor-not-allowed" : "bg-gradient-to-br from-blue-500 via-white/60 to-black/70 hover:bg-indigo-700"
          }`}
      >
          {loading && <Loader2 className="inline-block mr-2 animate-spin" size={16} />}
        {loading ? "Listing..." : "List Property"}
      </button>
     
        
        
    </form>
    </div>
    </>
  );
}
