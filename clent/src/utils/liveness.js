// src/utils/liveness.js
import * as faceapi from "face-api.js";

function speak(message) {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    speechSynthesis.speak(utterance);
  }
}

export async function startLivenessCheck(videoElement, onComplete) {
  // Load SSD MobileNet + Landmarks + Recognition
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

  console.log("Models loaded ✅");
  speak("Please blink your eyes to start the liveness check.");

  let blinked = false;
  let headTurned = false;

  const interval = setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options()) // ✅ use SSD Mobilenet
      .withFaceLandmarks();

    if (detections) {
      const landmarks = detections.landmarks;
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();

      if (!blinked && checkBlink(leftEye, rightEye)) {
        blinked = true;
        console.log("Blink detected ✅");
        speak("Good job! Now please turn your head left or right.");
      }

      if (blinked && !headTurned && checkHeadTurn(nose, landmarks)) {
        headTurned = true;
        console.log("Head turn detected ✅");
        speak("Excellent. Liveness check complete.");
        clearInterval(interval);
        if (onComplete) onComplete(true);
      }
    }
  }, 500);
}

function checkBlink(leftEye, rightEye) {
  const EAR = (eye) => {
    const vertical1 = distance(eye[1], eye[5]);
    const vertical2 = distance(eye[2], eye[4]);
    const horizontal = distance(eye[0], eye[3]);
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };

  const leftEAR = EAR(leftEye);
  const rightEAR = EAR(rightEye);
  const avgEAR = (leftEAR + rightEAR) / 2.0;

  return avgEAR < 0.25; 
}

function checkHeadTurn(nose, landmarks) {
  const leftCheek = landmarks.getLeftEye()[0];
  const rightCheek = landmarks.getRightEye()[3];
  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
  const noseX = nose[3].x;
  const offset = noseX - faceCenterX;

  return Math.abs(offset) > 15; // threshold for head turn
}

function distance(p1, p2) {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
  );
}





// // src/utils/liveness.js
// import * as faceapi from "face-api.js";

// function speak(message) {
//   if ("speechSynthesis" in window) {
//     const utterance = new SpeechSynthesisUtterance(message);
//     utterance.lang = "en-US";
//     speechSynthesis.speak(utterance);
//   }
// }

// export async function startLivenessCheck(videoElement, onComplete) {
//   // await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
//   await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
//   await faceapi.nets.faceLandmark68Net.loadFromUri("/models");

//   console.log("Models loaded ✅");
//   speak("Please blink your eyes to start the liveness check.");

//   let blinked = false;
//   let headTurned = false;

//   const interval = setInterval(async () => {
//     const detections = await faceapi
//       .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
//       .withFaceLandmarks();

//     if (detections) {
//       const landmarks = detections.landmarks;
//       const leftEye = landmarks.getLeftEye();
//       const rightEye = landmarks.getRightEye();
//       const nose = landmarks.getNose();

//       if (!blinked && checkBlink(leftEye, rightEye)) {
//         blinked = true;
//         console.log("Blink detected ✅");
//         speak("Good job! Now please turn your head left or right.");
//       }

//       if (blinked && !headTurned && checkHeadTurn(nose, landmarks)) {
//         headTurned = true;
//         console.log("Head turn detected ✅");
//         speak("Excellent. Liveness check complete.");
//         clearInterval(interval);
//         if (onComplete) onComplete(true);
//       }
//     }
//   }, 500);
// }

// function checkBlink(leftEye, rightEye) {
//   const EAR = (eye) => {
//     const vertical1 = distance(eye[1], eye[5]);
//     const vertical2 = distance(eye[2], eye[4]);
//     const horizontal = distance(eye[0], eye[3]);
//     return (vertical1 + vertical2) / (2.0 * horizontal);
//   };

//   const leftEAR = EAR(leftEye);
//   const rightEAR = EAR(rightEye);
//   const avgEAR = (leftEAR + rightEAR) / 2.0;

//   return avgEAR < 0.25; 
// }

// function checkHeadTurn(nose, landmarks) {
//   const leftCheek = landmarks.getLeftEye()[0];
//   const rightCheek = landmarks.getRightEye()[3];
//   const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
//   const noseX = nose[3].x;
//   const offset = noseX - faceCenterX;

//   return Math.abs(offset) > 15; // threshold for head turn
// }

// function distance(p1, p2) {
//   return Math.sqrt(
//     Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
//   );
// }


