// src/components/LiveMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons (using colored markers)
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

// Helper to compare coordinates (ignores small floating point differences)
const isSameCoords = (c1, c2) => {
  if (!c1 || !c2) return false;
  const threshold = 0.0001; // ~10 meters
  return Math.abs(c1[0] - c2[0]) < threshold && Math.abs(c1[1] - c2[1]) < threshold;
};

// Component to recenter map only if center actually changed
function ChangeView({ center }) {
  const map = useMap();
  const prevCenterRef = useRef(center);

  useEffect(() => {
    if (!isSameCoords(prevCenterRef.current, center)) {
      map.setView(center, map.getZoom());
      prevCenterRef.current = center;
    }
  }, [center, map]);

  return null;
}

// Optimize marker rendering with React.memo
const VehicleMarker = React.memo(({ vehicle, onClick }) => (
  <Marker
    position={[vehicle.latitude, vehicle.longitude]}
    icon={vehicleIcon}
    eventHandlers={{ click: () => onClick(vehicle, 'vehicle') }}
  >
    <Popup>
      <div className="p-2 min-w-[200px]">
        <h3 className="font-semibold text-blue-600 mb-1">🚗 Vehicle {vehicle.blackbox_id}</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Speed:</span> {vehicle.speed_kmph} km/h</div>
          <div><span className="text-gray-500">Accel:</span> {vehicle.acceleration_g} g</div>
          <div><span className="text-gray-500">Tilt:</span> {vehicle.tilt_degree}°</div>
          <div><span className="text-gray-500">Fire:</span> {vehicle.fire_detected ? '🔥 Yes' : 'No'}</div>
        </div>
        <a
          href={`https://www.google.com/maps?q=${vehicle.latitude},${vehicle.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-xs mt-2 inline-block"
        >
          Open in Google Maps
        </a>
      </div>
    </Popup>
  </Marker>
));

const AccidentMarker = React.memo(({ accident, onClick }) => (
  <Marker
    position={[accident.latitude, accident.longitude]}
    icon={accidentIcon}
    eventHandlers={{ click: () => onClick(accident, 'accident') }}
  >
    <Popup>
      <div className="p-2 min-w-[200px]">
        <h3 className="font-semibold text-red-600 mb-1">🚨 Accident</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-gray-500">Speed:</span> {accident.speed_kmph} km/h</div>
          <div><span className="text-gray-500">Accel:</span> {accident.acceleration_g} g</div>
          <div><span className="text-gray-500">Tilt:</span> {accident.tilt_degree}°</div>
          <div><span className="text-gray-500">Fire:</span> {accident.fire_detected ? 'Yes' : 'No'}</div>
          <div className="col-span-2"><span className="text-gray-500">Time:</span> {new Date(accident.timestamp).toLocaleTimeString()}</div>
        </div>
        <a
          href={`https://www.google.com/maps?q=${accident.latitude},${accident.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline text-xs mt-2 inline-block"
        >
          Open in Google Maps
        </a>
      </div>
    </Popup>
  </Marker>
));

// Google Maps iframe view (simple, no markers)
const GoogleMapsView = ({ center, zoom }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Google Maps API key missing</div>;
  }
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${center[0]},${center[1]}&zoom=${zoom}&maptype=satellite`;
  return (
    <iframe
      src={mapSrc}
      className="w-full h-full rounded-lg border-0"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Google Maps"
    />
  );
};

const LiveMap = ({ vehicles = [], accidents = [], center = [22.5726, 88.3639], zoom = 14, onMarkerClick, mapType = 'interactive' }) => {
  if (mapType === 'simple') {
    return <GoogleMapsView center={center} zoom={zoom} />;
  }

  // Interactive Leaflet map
  const tileLayerUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB';

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <ChangeView center={center} />
        <TileLayer url={tileLayerUrl} attribution={attribution} />
        {vehicles.map(vehicle => (
          <VehicleMarker key={vehicle.blackbox_id} vehicle={vehicle} onClick={onMarkerClick} />
        ))}
        {accidents.map(accident => (
          <AccidentMarker key={accident._id} accident={accident} onClick={onMarkerClick} />
        ))}
      </MapContainer>

      {/* Floating button to open current center in Google Maps */}
      <a
        href={`https://www.google.com/maps?q=${center[0]},${center[1]}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-lg transition-colors z-[1000]"
      >
        <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
        Open in Google Maps
      </a>
    </div>
  );
};

export default LiveMap;