// src/components/LiveMap.jsx
import React, { useEffect } from 'react';
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

// Custom icons (optional)
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
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
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
  );
};

export default LiveMap;