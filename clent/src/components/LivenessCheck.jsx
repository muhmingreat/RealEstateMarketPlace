// src/components/LivenessCheck.jsx
import React, { useRef, useEffect, useState } from "react";
import { startLivenessCheck } from "../utils/liveness";


export default function LivenessCheck({ onSuccess }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");


  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;


        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            startLivenessCheck(videoRef.current, () => {
              setStatus("✅ Liveness check passed!");
              if (onSuccess) onSuccess();

              if (videoRef.current && videoRef.current.srcObject) {
                let tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop()); 
              }
            });
          } catch (err) {
            console.error("Play interrupted:", err);
            setStatus("Unable to start video ❌");
          }
        };
      } catch (err) {
        console.error("Camera access denied:", err);
        setStatus("Camera access denied ❌");
      }
    }

    initCamera();
  }, [onSuccess]);

  return (
    <div className="flex flex-col items-center">
      <video
        ref={videoRef}
        height="200"
        width="200"
        className="border rounded-full"
      />
      <p className="mt-2 text-sm text-gray-700">{status}</p>

    </div>
  );
}
