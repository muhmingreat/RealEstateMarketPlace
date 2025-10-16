import React, { useState } from "react";
import UploadDocs from "./UploadDocs";
import VerifyOtp from "./VerifyOtp";
import DownloadDocs from "./DowloadDocs";
import { useSearchParams, useParams } from "react-router-dom";

export default function DocsFlow({ propertyId: propPropertyId, 
  buyerKycId: propBuyerKycId }) {
    
  const { propertyId: routePropertyId } = useParams();
  const [searchParams] = useSearchParams();

  // Prefer props, otherwise fallback to route/query
  const propertyId = propPropertyId || routePropertyId;
  const buyerKycId = propBuyerKycId || searchParams.get("buyer");

  const [downloadToken, setDownloadToken] = useState(null);

  console.log("DocsFlow props resolved:", { propertyId, buyerKycId });

  return (
    <div className="space-y-6">
      <UploadDocs propertyId={propertyId} buyerKycId={buyerKycId} />
      <VerifyOtp buyerKycId={buyerKycId} onVerified={setDownloadToken} />
      <DownloadDocs propertyId={propertyId} downloadToken={downloadToken} />
    </div>
  );
}


