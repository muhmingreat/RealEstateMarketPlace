import React, { useState, useRef, useEffect } from "react";

import useListProperty from "../hooks/useListProperty";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  uploadToIPFS, uploadMetadataToIPFS,
  useCeloToUSD, generateCategoryDescription
} from "../utils/uploadToIPFS";
import { toast } from "react-toastify";
import { ethers } from "ethers";
// import { useGetLatestEthPrice } from "../hooks/useBlockchain";
import { Loader2, X } from "lucide-react";
import ThunderSuccess from "./ThunderSuccess";


export default function PropertyForm() {
   const { convertCeloToUSD } = useCeloToUSD()
  const [showThunder, setShowThunder] = useState(false);
  const [usdValue, setUsdValue] = useState("");
  const handleListProperty = useListProperty();
  const { address } = useAppKitAccount();

  const [stagedImages, setStagedImages] = useState([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("House");
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);


    const newFiles = [...files, ...selectedFiles].slice(0, 5);
    if (newFiles.length > 5) {
      toast.warn("You can upload a maximum of 5 images.");
    }

    setFiles(newFiles);

    const newPreviewUrls = [
      ...previewUrls,
      ...selectedFiles.map((file) => URL.createObjectURL(file)),
    ].slice(0, 5);

    setPreviewUrls(newPreviewUrls);
  };


  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!price || !title || !category || !propertyAddress || !description) {
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

      // const stagedUrl = await generateStagedImage(uploadedImages[0]);
      // console.log("Generated AI image URL:", stagedUrl);
      // if (stagedUrl) {
      //   uploadedImages.push(stagedUrl); // Save alongside original
      //   setStagedImages((prev) => [...prev, stagedUrl]);
      // }

      const metadataUrl = await uploadMetadataToIPFS(
        title,
        description,
        uploadedImages[0], // 👈 main display image
        [
          { trait_type: "Category", value: category },
          { trait_type: "Property Address", value: propertyAddress },
          { trait_type: "Price (Celo)", value: price }
        ]
      );

      if (!price || isNaN(Number(price))) {
        toast.error("Price must be a valid number");
        return;
      }
      // const priceInWei = ethers.parseEther(price.toString(6));
      const priceInWei = ethers.parseEther(price.toString());


      console.log(metadataUrl);
      // Call smart contract
      const success = await handleListProperty(
        address,
        priceInWei,
        title,
        category,
        uploadedImages,
        propertyAddress,
        description,
        metadataUrl
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
    if (price) {
      const usd = convertCeloToUSD(parseFloat(price));
      setUsdValue(usd);
    } else {
      setUsdValue("");
    }
  }, [price, convertCeloToUSD]);

  useEffect(() => {
    if (showThunder) {
      const timer = setTimeout(() => setShowThunder(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [showThunder]);

  const handleDeleteImage = (index) => {
    const newPreviews = previewUrls.filter((_, idx) => idx !== index);
    const newFiles = files.filter((_, idx) => idx !== index);
    setPreviewUrls(newPreviews);
    setFiles(newFiles)
  }
  return (
    <>
      <ThunderSuccess trigger={showThunder} />

      <div className="min-h-screen  flex items-center justify-center
     bg-gradient-to-br from-blue-950 via-blue-100 to-white/60">

        <form
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto shadow-full bg-gradient-to-br m-6
       from-blue-400 via-blue-100 to-black/55 rounded-xl p-6 space-y-6"
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
            <label className="flex flex-col relative">
              <span className="text-sm font-medium text-gray-700">Price CELO</span>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-3 pr-24 border rounded-md focus:ring-2 focus:ring-blue-400"
                  required
                  disabled={loading}
                />
                {usdValue && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 px-1 rounded">
                     ${usdValue}
                  </span>
                )}
              </div>
            </label>


            < label className="flex flex-col">
              <span className="text-sm text-gray-700">Property Address</span>
              <input
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                className="mt-2 p-3 border rounded-md"
                required
                disabled={loading}
              />
            </label>


            <label className="flex flex-col">
              <span className="text-sm text-gray-700">Category</span>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);

                  // Only auto-fill if description is still empty
                  if (!description) {
                    const autoDesc = generateCategoryDescription(
                      e.target.value,
                      propertyAddress || "a prime location"
                    );
                    setDescription(autoDesc);
                  }
                }}
                className="mt-2 p-3 border rounded-md"
                disabled={loading}
              >
                <option value=""></option>
                <option value="mansion">Mansion</option>
                <option value="apartment">Apartment</option>
                <option value="duplex">Duplex</option>
                <option value="bungalow">Bungalow</option>
                <option value="commercial">Commercial</option>
              </select>
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

          {/* {stagedImages.map((url, i) => (
            <div key={i} className="relative group">
              <img
                src={url}
                alt={`Staged ${i + 1}`}
                className="w-full h-40 object-cover 
                rounded-lg shadow-md border border-gray-200"
              /> */}
          {/* <button
                type="button"
                onClick={() => setStagedImages(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-red-500
                 text-white p-1 rounded-full shadow-md opacity-80 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          ))} */}

          <div className="flex flex-col gap-2">
            <label className="flex flex-col">
              <span className="text-sm font-medium text-center
               text-gray-700">Upload Property </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFileChange}
                className="mt-2"
                disabled={loading}
              />
            </label>

            {/* Preview selected images */}
            {/* Preview selected images */}
            <div className="flex justify-center">
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url}
                        alt={`Selected ${i + 1}`}
                        className="w-full h-32 object-cover rounded-md shadow-sm"
                      />
                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white 
                                 text-xs p-1 rounded-full shadow-md opacity-80 hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 p-2 rounded-md text-green-900 font-medium  flex justify-center ${loading ?
                "bg-indigo-300 cursor-not-allowed items-center" :
                "bg-gradient-to-br from-blue-500 via-white/60 to-black/70 hover:bg-indigo-700"
                }`}
            >
              {loading && <Loader2 className="inline-block mr-2 animate-spin " size={16} />}
              {loading ? "Listing..." : "List Property"}
            </button>
          </div>


        </form>
      </div>
    </>
  );
}
