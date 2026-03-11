// src/components/LiveMap.jsx
import React from 'react';

const LiveMap = ({ vehicles = [], accidents = [], center = [22.5726, 88.3639], zoom = 14 }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Helper: check if coordinates are valid (not zero and not NaN)
  const isValidCoord = (lat, lng) => lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);

  // Find first valid location from vehicles, then accidents, else fallback to provided center
  let mapCenter = center;
  const validVehicle = vehicles.find(v => isValidCoord(v.latitude, v.longitude));
  if (validVehicle) {
    mapCenter = [validVehicle.latitude, validVehicle.longitude];
  } else {
    const validAccident = accidents.find(a => isValidCoord(a.latitude, a.longitude));
    if (validAccident) {
      mapCenter = [validAccident.latitude, validAccident.longitude];
    }
  }

  // Generate Google Maps embed URL
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${mapCenter[0]},${mapCenter[1]}&zoom=${zoom}`;

  if (!apiKey) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-800 text-gray-400 rounded-lg">
        <p>Google Maps API key is missing. Please check your environment variables.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <iframe
        src={mapSrc}
        className="w-full h-full rounded-lg border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Live Map"
      />
      {/* Overlay showing current center coordinates */}
      <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
        📍 Center: {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
        {!validVehicle && !validAccident && ' (No GPS fix yet)'}
      </div>
    </div>
  );
};

export default LiveMap;