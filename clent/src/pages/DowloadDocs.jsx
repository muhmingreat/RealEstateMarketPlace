// components/DownloadDocs.jsx
import React from "react";

export default function DownloadDocs({ propertyId, downloadToken }) {
  if (!downloadToken) {
    return <p className="text-gray-600">Please verify OTP first.</p>;
  }

  const downloadUrl = `http://localhost:5000/api/upload/${propertyId}/download?token=${downloadToken}`;

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-lg font-bold mb-2">Download Verified Document</h2>
      <a
        href={downloadUrl}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Download Document
      </a>
    </div>
  );
}
