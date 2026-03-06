import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default markers
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

const MapView = ({ vehicles = [], accidents = [] }) => {
  // Find first valid coordinates for centering
  const firstValid = vehicles.find(v => v.latitude && v.longitude) || accidents.find(a => a.latitude && a.longitude);
  const center = firstValid ? [firstValid.latitude, firstValid.longitude] : [12.9716, 77.5946]; // fallback

  const openGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Live Map</h2>
        {firstValid && (
          <button
            onClick={() => openGoogleMaps(firstValid.latitude, firstValid.longitude)}
            className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100"
          >
            Open in Google Maps
          </button>
        )}
      </div>
      <MapContainer center={center} zoom={13} style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {vehicles.map((v, idx) => v.latitude && v.longitude && (
          <Marker key={`v-${idx}`} position={[v.latitude, v.longitude]} icon={vehicleIcon}>
            <Popup>
              <b>Blackbox: {v.blackbox_id}</b><br />
              Speed: {v.speed_kmph} km/h<br />
              Fire: {v.fire_detected ? 'Yes' : 'No'}<br />
              <button
                onClick={() => openGoogleMaps(v.latitude, v.longitude)}
                className="text-blue-500 underline text-xs mt-1"
              >
                View in Google Maps
              </button>
            </Popup>
          </Marker>
        ))}
        {accidents.map((a, idx) => a.latitude && a.longitude && (
          <Marker key={`a-${idx}`} position={[a.latitude, a.longitude]} icon={accidentIcon}>
            <Popup>
              <b>Accident</b><br />
              Blackbox: {a.blackbox_id}<br />
              Severity: {a.severity || 'Medium'}<br />
              Time: {new Date(a.timestamp).toLocaleString()}<br />
              <button
                onClick={() => openGoogleMaps(a.latitude, a.longitude)}
                className="text-blue-500 underline text-xs mt-1"
              >
                View in Google Maps
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;