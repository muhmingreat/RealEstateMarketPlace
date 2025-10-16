import React, { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../utils/api";
import { useParams, useNavigate } from "react-router-dom";

export default function DocsView() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Raw params:", propertyId);
    console.log("Full API path:", buildApiUrl(`upload/${propertyId}`));

    if (!propertyId) {
      setError("No property ID provided.");
      setLoading(false);
      return;
    }

    const fetchDoc = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(buildApiUrl(`upload/${propertyId}`));
        console.log("Fetching:", buildApiUrl(`upload/${propertyId}`));
        console.log("Response:", res.data);
        setDoc(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch document.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [propertyId]);

  const handleBack = () => navigate(-1);

  if (loading) return <p>Loading document...</p>;
  if (error)
    return (
      <div>
        <p className="text-red-600">{error}</p>
        <button
          onClick={handleBack}
          className="mt-2 px-4 py-2 bg-blue-600
           text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  if (!doc)
    return (
      <div>
        <p>No document uploaded yet.</p>
        <button
          onClick={handleBack}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Properties
        </button>
      </div>
    );

  
  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Document for Property {doc.propertyId}</h2>
      <p><strong>Seller:</strong> {doc.seller}</p>
      <p><strong>File Hash:</strong> {doc.fileHash}</p>

<div className="mt-4 flex gap-4">
  {/* View */}
  <a
    href={`http://localhost:5000${doc.fileUrl}`}
    target="_blank"
    rel="noopener noreferrer"
    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
  >
    View Document
  </a>

 
  <a
  href={`http://localhost:5000/api/upload/${doc.propertyId}/download`}
  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
>
  Download Document
</a>
</div>


      <button
        onClick={handleBack}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back
      </button>
    </div>
  );
}



