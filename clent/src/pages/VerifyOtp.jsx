import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { buildApiUrl } from "../utils/api";

export default function VerifyOtp({ buyerKycId, propertyId, onVerified }) {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!otp) return toast.error("Enter OTP");

    try {
      setVerifying(true);
      const res = await axios.post(buildApiUrl("/upload/verify-otp"), {
        buyerKycId,
        otp,
      });

      toast.success("OTP verified!");
      onVerified(res.data.downloadToken);
    } catch (err) {
      toast.error(err.response?.data?.error || "OTP verification failed");
      console.error("Verify OTP error:", err.response?.data || err.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await axios.post(buildApiUrl("/upload/resend-otp"), {
        buyerKycId,
        propertyId,
      });
      toast.success("New OTP sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to resend OTP");
      console.error("Resend OTP error:", err.response?.data || err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-lg font-bold mb-2">Verify OTP</h2>
      <input
        type="text"
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="border px-2 py-1 mb-2 w-full"
      />
      <div className="flex gap-2">
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>
        <p>Does'nt see OTP </p>
        <button
          onClick={handleResend}
          disabled={resending}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          > 
          {resending ? "Resending..." : "Resend OTP"}
        </button>
      </div>
    </div>
  );
}

