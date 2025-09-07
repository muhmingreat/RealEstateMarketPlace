// components/LivenessCheck.jsx
import React, { useRef, useEffect, useState } from "react";
import { startLivenessCheck } from "../utils/liveness";

export default function LivenessCheck({ onSuccess }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Initializing...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();

            startLivenessCheck(videoRef.current, () => {
              if (onSuccess) onSuccess();
              if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
              }
            }, setProgress, setStatus);

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
      <div
        className="relative border-4 rounded-full overflow-hidden"
        style={{
          borderColor: progress < 100 ? "orange" : status.includes("✅") ? "green" : "cyan",
        }}
      >
        <video
          ref={videoRef}
          height="120"
          width="180"
          className="rounded-full"
        />
        {progress < 100 && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center
           justify-center text-white text-lg">
            Loading... {progress}%
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-700">{status}</p>
    </div>
  );
}
