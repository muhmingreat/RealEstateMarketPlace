import axios from 'axios'  
  

const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY
const PINATA_GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL
  export const uploadToIPFS = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          pinata_api_key: import.meta.env.VITE_PINATA_API_KEY,
          pinata_secret_api_key: import.meta.env.VITE_PINATA_SECRET_API_KEY,
        },
      });
      return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
    } catch (err) {
      console.error('IPFS upload error:', err);
    }
  };

export const uploadMetadataToIPFS = async (name, description, imageUrl, attributes = []) => {
  const metadata = {
    name,
    description,
    image: imageUrl.startsWith("ipfs://") ? imageUrl : imageUrl.replace("https://gateway.pinata.cloud/ipfs/", "ipfs://"),
    attributes,
  };

  const res = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    metadata,
    {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    }
  );

  // Return ipfs:// scheme for NFT metadata
  return `ipfs://${res.data.IpfsHash}`;
};




export const generateStagedImage = async (imageUrl) => {
  try {
    const response = await axios.post(buildApiUrl("/replicate/generate"), {
      version: "remodela-ai/virtual_staging_i:d4b366e4fb278a4da56ae53c8cf44237ed4446b1c7bdc5a404acbe69ebdbb287",
      input: {
        image: imageUrl,
        prompt: "Furnish this empty room realistically with modern furniture",
      },
    });

    return response.data.url; // backend returns staged image URL
  } catch (err) {
    console.error("Error generating AI image:", err);
    return null;
  }
};


// utils/convertCeloToUSD.js
// export async function convertCeloToUSD(amount) {
//   try {
//     const res = await fetch(
//       "https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd"
//     );
//     const data = await res.json();
//     const celoToUSD = data.celo.usd;
//     return (amount * celoToUSD).toFixed(2);
//   } catch (error) {
//     console.error("Error fetching CELO price:", error);
//     return null;
//   }
// }
// src/hooks/useCeloToUSD.js
import { useState, useEffect, useCallback } from "react";

/**
 * A reusable hook for converting CELO to USD and fetching the latest CELO price.
 */
export function useCeloToUSD() {
  const [celoPrice, setCeloPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Fetch the CELO → USD rate once
  const fetchCeloPrice = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=celo&vs_currencies=usd"
      );
      if (!res.ok) throw new Error("Failed to fetch CELO price");
      const data = await res.json();
      setCeloPrice(data.celo.usd);
      setError(null);
    } catch (err) {
      console.error("Error fetching CELO price:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Initial fetch
  useEffect(() => {
    fetchCeloPrice();
  }, [fetchCeloPrice]);

  // 🔹 Convert CELO → USD easily anywhere
  const convertCeloToUSD = useCallback(
    (amount) => {
      if (!celoPrice || isNaN(amount)) return null;
      return (amount * celoPrice).toFixed(2);
    },
    [celoPrice]
  );

  return { celoPrice, convertCeloToUSD, loading, error, refresh: fetchCeloPrice };
}


export function generateCategoryDescription(category, propertyAddress) {
  switch (category.toLowerCase()) {
    case "apartment":
      return `Modern apartment offering comfort and convenience,
       featuring open-plan living, natural light,
        and excellent access to nearby amenities at ${propertyAddress}.`;
    case "mansion":
      return `Luxury mansion with expansive living spaces, 
      premium finishes, landscaped gardens, 
      and unmatched elegance located at ${propertyAddress}.`;
    case "duplex":
      return `Spacious duplex with modern interiors, 
      private parking, and multiple levels 
      designed for family living at ${propertyAddress}.`;
    case "bungalow":
      return `Charming bungalow with cozy interiors, 
      a private garden, and a peaceful setting at ${propertyAddress}.`;
    case "commercial":
      return `Prime commercial property ideal for offices or retail, 
      strategically located at ${propertyAddress} with excellent accessibility.`;
    default:
      return "";
  }
}
