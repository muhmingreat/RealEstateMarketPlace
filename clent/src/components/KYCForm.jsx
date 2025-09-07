 import LivenessCheck from './LivenessCheck'
import React, { useState, useRef,useEffect } from "react";
import { Camera } from "react-camera-pro";
import { useAppKitAccount } from "@reown/appkit/react";
import useKYC from "../hooks/useKycVerifier";
import { useNavigate } from 'react-router-dom';

export default function KYCForm() {
  const cameraRef = useRef(null);
  const { address } = useAppKitAccount();
  const { uploadKYC, loading, error, status } = useKYC();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [documentType, setDocumentType] = useState("passport");
  const [idDocumentFile, setIdDocumentFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);


 

  const [livenessPassed, setLivenessPassed] = useState(false);

    useEffect(() => {
    const agreed = localStorage.getItem("termsAgreed");
    if (agreed !== "true") {
      navigate("/terms"); 
    }
  }, [navigate]);

  const resizeBase64Image = (base64Str, maxWidth = 300, maxHeight = 300) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
    });
  };

  const base64ToFile = (base64, filename) => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const capturePhoto = async () => {
    const photo = cameraRef.current.takePhoto();
    const resized = await resizeBase64Image(photo, 300, 300);
    const file = base64ToFile(resized, "selfie.jpg");
    setSelfieFile(file);
    setCameraOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address) {
      alert("Please connect your wallet first!");
      return;
    }

    const response = await uploadKYC(
      address,
      fullName,
      email,
      phoneNumber,
      documentType,
      idDocumentFile,
      selfieFile
    );

    if (response?.verification) {
      setVerificationResult(response.verification);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r
     from-indigo-600 via-purple-600 to-pink-500 p-6">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8">

        {!livenessPassed ? (
    
          <div className="mt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Liveness Check</h3>
            <LivenessCheck onSuccess={() => setLivenessPassed(true)} />
          </div>
        ) : (
          
          <>
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
              KYC Verification
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 ">
              <input
                type="text"
                value={address}
                readOnly
                className="w-full p-3 border cursor-not-allowed 
                 rounded-lg bg-gray-100 text-gray-600"
              />

              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring 
                cursor-pointer focus:ring-indigo-400"
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border rounded-lg cursor-pointer 
                focus:ring focus:ring-indigo-400"
                required
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-3 border rounded-lg cursor-pointer 
                focus:ring focus:ring-indigo-400"
                required
              />

              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring 
                cursor-pointer focus:ring-indigo-400"
              >
                <option value="passport">Passport</option>
                <option value="driver_license">Driver’s License</option>
                <option value="national_id">National ID</option>
              </select>

               {/* Upload Document  */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Upload ID Document
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdDocumentFile(e.target.files[0])}
                  className="w-full"
                  required
                />
              </div>

              {/* Selfie Capture */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Selfie
                </label>
                {cameraOpen ? (
                  <div className="relative">
                    <Camera ref={cameraRef} aspectRatio={1} facingMode="user" />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="mt-2 w-full bg-indigo-600 cursor-pointer
                       text-white p-2 rounded-lg"
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraOpen(false)}
                      className="mt-2 w-full bg-gray-300 cursor-pointer
                       text-gray-800 p-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : selfieFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={URL.createObjectURL(selfieFile)}
                      alt="Selfie preview"
                      className="w-24 h-24 object-cover  
                       cursor-pointer rounded-full border"
                    />
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="bg-indigo-600 text-white
                       p-2 cursor-pointer rounded-lg"
                    >
                      Retake Selfie
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    className="w-full bg-indigo-600 text-white 
                    cursor-pointer p-2 rounded-lg"
                  >
                    Take Selfie
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700
                 text-white font-semibold py-3 rounded-lg"
              >
                {loading ? "Submitting..." : "Submit KYC"}
              </button>
            </form>

            {/* Status & Errors */}
            {error && (
              <p className="mt-4 text-red-500">
                {error.message || JSON.stringify(error)}
              </p>
            )}

            {status && (
              <p className="mt-4 text-green-600">
                ✅ KYC Request Submitted! Status: {status.status || "Pending"}
              </p>
            )}

            {/* Show verification results */}
            {verificationResult && (
              <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Verification Results:
                </h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>
                    <strong>Extracted Name:</strong>{" "}
                    {verificationResult.documentExtractedName || "N/A"}
                  </li>
                  <li>
                    <strong>Document Verified:</strong>{" "}
                    {verificationResult.documentVerified ? "✅ Yes" : "❌ No"}
                  </li>
                  <li>
                    <strong>Face Match:</strong>{" "}
                    {verificationResult.faceMatch ? "✅ Match" : "❌ No Match"}
                  </li>
                  <li>
                    <strong>Liveness Score:</strong>{" "}
                    {verificationResult.livenessScore || "N/A"}
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}




