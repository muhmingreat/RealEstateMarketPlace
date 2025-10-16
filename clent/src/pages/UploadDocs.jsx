// components/UploadDocs.jsx
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { buildApiUrl } from "../utils/api";
import { useAppKitAccount } from "@reown/appkit/react";

export default function UploadDocs({ propertyId, buyerKycId }) {
  const [file, setFile] = useState('');
  const [uploading, setUploading] = useState(false);

  const { address: seller, isConnected } = useAppKitAccount();

  const handleUpload = async () => {
    if (!isConnected) return toast.error("Please connect your wallet first");
    if (!file) return toast.error("Please select a file");
    if (!buyerKycId) return toast.error("Buyer KYC ID missing");

    try {
      setUploading(true);

      const buffer = await file.arrayBuffer();
      const fileHash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const formData = new FormData();
      formData.append("document", file);
      formData.append("propertyId", propertyId);
      formData.append("seller", seller);
      formData.append("buyerKycId", buyerKycId);
      formData.append("fileHash", fileHash);

      const res = await axios.post(buildApiUrl("/upload"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Document uploaded. Buyer notified via email with OTP!");
      console.log("Upload response:", res.data);
      setFile('');
    } catch (err) {
      toast.error("Upload failed");
      console.error("Upload error:", err.response?.data || err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-lg font-bold mb-2">Upload Property Documents</h2>
      <input
        type="file"
        accept=".pdf,.txt,.jpg,.png,.jpeg"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-2"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}




