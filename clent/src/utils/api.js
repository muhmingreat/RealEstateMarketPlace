
let apiBaseUrl;

if (import.meta.env.MODE === "development") {

  apiBaseUrl = "http://localhost:5000/api"; 
} else {
  
  // Production (Vercel)
  apiBaseUrl = "https://real-state-backend-liart.vercel.app";
}

export function buildApiUrl(path) {
  return `${apiBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
