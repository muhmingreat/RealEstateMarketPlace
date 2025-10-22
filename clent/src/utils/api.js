
let apiBaseUrl;

if (import.meta.env.MODE === "development") {

  apiBaseUrl = "http://localhost:5000/api"; 
} else {
  
  // Production (Vercel)
  apiBaseUrl = "https://realstate-backend-15lu.onrender.com/api"
 
}

export function buildApiUrl(path) {
  return `${apiBaseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
