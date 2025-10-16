// BuyerVerifyDocs.jsx
import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export default function BuyerVerifyDocs({ propertyId }) {
  const [file, setFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    if (!file) return toast.error("Please select the document file to verify");
    try {
      setVerifying(true);

      const formData = new FormData();
      formData.append("document", file);
      formData.append("propertyId", propertyId);

      const res = await axios.post("/api/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data.data);
      toast.success(res.data.data.verified ? "✅ Document verified" : "❌ Document mismatch");
    } catch (err) {
      toast.error("Verification failed");
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h3 className="text-lg font-bold mb-2">Verify Property Documents</h3>
      <input
        type="file"
        accept=".pdf,.txt"
        onChange={e => setFile(e.target.files[0])}
        className="mb-2"
      />
      <button
        onClick={handleVerify}
        disabled={verifying}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        {verifying ? "Verifying..." : "Verify"}
      </button>

      {result && (
        <div className="mt-3">
          <p>Status: {result.verified ? "✅ Verified" : "❌ Rejected"}</p>
          <p>Doc Hash: {result.docHash}</p>
        </div>
      )}
    </div>
  );
}
