import React from "react";
import { Navigate
    
 } from "react-router-dom";
export default function ProtectedKYC({ children }) {
  const agreed = localStorage.getItem("termsAgreed");
  return agreed === "true" ? children : <Navigate to="/terms" />;
}