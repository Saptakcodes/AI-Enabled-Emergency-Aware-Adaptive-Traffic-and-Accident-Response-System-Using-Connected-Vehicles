// src/components/LiveMap.jsx
import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

console.log("🔑 API Key present:", !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 22.5726,
  lng: 88.3639
};

const iconMap = {
  ambulance: '/ambulance-icon.png',
  police: '/police-icon.png',
  fire: '/fire-icon.png',
  normal: '/car-icon.png',
  accident: '/accident-icon.png'
};

const LiveMap = ({ vehicles = [], accidents = [], center = defaultCenter, zoom = 14 }) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedAccident, setSelectedAccident] = useState(null);

  const onLoad = useCallback((map) => {
    // Optional map setup
  }, []);

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      onError={(error) => console.error("❌ Google Maps load error:", error)}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
      >
        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.blackbox_id}
            position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
            icon={{
              url: iconMap[vehicle.vehicle_type] || iconMap.normal,
              scaledSize: { width: 30, height: 30 }   // ✅ fixed: plain object instead of google.maps.Size
            }}
            onClick={() => setSelectedVehicle(vehicle)}
          />
        ))}

        {/* Accident Markers */}
        {accidents.map((accident) => (
          <Marker
            key={accident._id}
            position={{ lat: accident.latitude, lng: accident.longitude }}
            icon={{
              url: iconMap.accident,
              scaledSize: { width: 40, height: 40 }   // ✅ fixed
            }}
            onClick={() => setSelectedAccident(accident)}
          />
        ))}

        {/* InfoWindow for selected vehicle */}
        {selectedVehicle && (
          <InfoWindow
            position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
            onCloseClick={() => setSelectedVehicle(null)}
          >
            <div className="p-2 text-black">
              <h3 className="font-semibold">Vehicle {selectedVehicle.blackbox_id}</h3>
              <p>Speed: {selectedVehicle.speed_kmph} km/h</p>
              <p>Acceleration: {selectedVehicle.acceleration_g} g</p>
              <p>Fire: {selectedVehicle.fire_detected ? '🔥' : 'No'}</p>
            </div>
          </InfoWindow>
        )}

        {/* InfoWindow for selected accident */}
        {selectedAccident && (
          <InfoWindow
            position={{ lat: selectedAccident.latitude, lng: selectedAccident.longitude }}
            onCloseClick={() => setSelectedAccident(null)}
          >
            <div className="p-2 text-black">
              <h3 className="font-semibold text-red-600">Accident</h3>
              <p>Speed: {selectedAccident.speed_kmph} km/h</p>
              <p>Tilt: {selectedAccident.tilt_degree}°</p>
              <p>Fire: {selectedAccident.fire_detected ? 'Yes' : 'No'}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default LiveMap;