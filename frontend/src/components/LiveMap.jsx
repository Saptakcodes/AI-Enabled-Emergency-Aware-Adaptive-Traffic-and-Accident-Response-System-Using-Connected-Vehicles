// src/components/LiveMap.jsx
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons
const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const accidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const LiveMap = ({ vehicles = [], accidents = [], center = [22.5726, 88.3639], zoom = 14 }) => {
  // Generate Google Maps link for the current center
  const googleMapsLink = `https://www.google.com/maps?q=${center[0]},${center[1]}`;

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles.map(vehicle => (
          <Marker
            key={vehicle.blackbox_id}
            position={[vehicle.latitude, vehicle.longitude]}
            icon={vehicleIcon}
          >
            <Popup>
              <b>Vehicle {vehicle.blackbox_id}</b><br/>
              Speed: {vehicle.speed_kmph} km/h<br/>
              Acceleration: {vehicle.acceleration_g} g<br/>
              Fire: {vehicle.fire_detected ? '🔥' : 'No'}
            </Popup>
          </Marker>
        ))}
        {accidents.map(accident => (
          <Marker
            key={accident._id}
            position={[accident.latitude, accident.longitude]}
            icon={accidentIcon}
          >
            <Popup>
              <b style={{color: 'red'}}>Accident</b><br/>
              Speed: {accident.speed_kmph} km/h<br/>
              Tilt: {accident.tilt_degree}°<br/>
              Fire: {accident.fire_detected ? 'Yes' : 'No'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating button to open in Google Maps */}
      <a
        href={googleMapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-lg transition-colors z-[1000]"
        style={{ zIndex: 1000 }}
      >
        <svg
          className="inline-block w-4 h-4 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
            clipRule="evenodd"
          />
        </svg>
        Open in Google Maps
      </a>
    </div>
  );
};

export default LiveMap;