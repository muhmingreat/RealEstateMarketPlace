import { io } from "socket.io-client";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { buildApiUrl } from "../utils/api";

// const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
//  "https://real-state-backend-liart.vercel.app/";


export default function useKYC(currentUserId) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  
  const uploadKYC = async (walletAddress, fullName, email, phoneNumber,
    documentType, idDocumentFile, selfieFile) => {

            function normalizePhoneNumber(phone) {
             if (!phone) return "";
             phone = phone.replace(/\D/g, "");
             if (phone.startsWith("0")) phone = "234" + phone.slice(1);
             if (!phone.startsWith("234")) phone = "234" + phone;       
             return "+" + phone;                                        
           }
                            
     const normalizedPhone = normalizePhoneNumber(phoneNumber);
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("walletAddress", walletAddress);
      formData.append("fullName", fullName);
      formData.append("email", email);
    
      formData.append("phoneNumber", normalizedPhone);
      formData.append("documentType", documentType);
      formData.append("document", idDocumentFile);
      if (selfieFile) formData.append("selfie", selfieFile);

      const res = await axios.post(`${buildApiUrl("/kyc/upload")}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkKYCStatus = async (wallet) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${buildApiUrl("/kyc/requests")}/${wallet}`);
      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const approveKYC = async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${buildApiUrl("/kyc/approve")}`, { walletAddress });
      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectKYC = async (walletAddress) => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(`${buildApiUrl("/kyc/reject")}`, { walletAddress });
      setStatus(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };



  return {
    
    uploadKYC,
    checkKYCStatus,
    approveKYC,
    rejectKYC,
  
   
    status,
    loading,
    error,
  };
}
