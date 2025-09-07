import React, { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import useKYC from "../hooks/useKycVerifier";

export default function KYCStatusChecker() {
  const { address } = useAppKitAccount();
  const { checkKYCStatus, status, loading, error } = useKYC();
  const [queried, setQueried] = useState(false);

  const handleCheck = async () => {
    await checkKYCStatus(address);
    setQueried(true);
  };

  return (
    <div>
      <h2>Check Your KYC Status</h2>
      <button onClick={handleCheck} disabled={loading}>
        {loading ? "Checking..." : "Check Status"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {queried && status && <p>Status: {status.status}</p>}
    </div>
  );
}
