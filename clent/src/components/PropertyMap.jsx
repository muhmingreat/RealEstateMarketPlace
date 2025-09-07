import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({ iconUrl, shadowUrl: iconShadow });
L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map whenever coords change
function RecenterMap({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, 15);
    }
  }, [coords, map]);
  return null;
}

export default function PropertyMap({ address, title, imageUrl }) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!address) return;

    const fetchCoords = async () => {
      try {

        const res = await fetch(
          `http://localhost:5000/api/geocode?q=${encodeURIComponent(address)}`
        );
        const data = await res.json();
        console.log("Fetched data:", data);

        if (data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          console.warn("Address not found:", address);
          setCoords([6.5244, 3.3792]); // fallback: Lagos
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setCoords([6.5244, 3.3792]); // fallback: Lagos
      }
    };

    fetchCoords();
  }, [address]);

  if (!coords) return <p>Loading map...</p>;

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <MapContainer
        center={coords}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
       

        <TileLayer
          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibXVobWluZ3JlYXQiLCJhIjoiY2xldTIwMDJnMWx3czQ0cnZxdWpsdDhpayJ9.EHBjfaEblJ7EGkJbYmd0mQ`}
          attribution='© <a href="https://www.mapbox.com/">Mapbox</a> © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          tileSize={512}
          zoomOffset={-1}
        />

        {/* Auto-recenter map when coords update */}
        <RecenterMap coords={coords} />

        <Marker position={coords}>
          <Popup>
            <div style={{ maxWidth: "200px" }}>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={title}
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "8px"
                  }}
                />
              )}
              <h4 style={{ margin: "4px 0" }}>{title || "Property Location"}</h4>
              <p style={{ fontSize: "12px", color: "#555" }}>
                {address || "Unknown Address"}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}





