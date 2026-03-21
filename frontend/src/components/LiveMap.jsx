// src/components/LiveMap.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // For heatmap

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

// Helper to compare coordinates
const isSameCoords = (c1, c2) => {
  if (!c1 || !c2) return false;
  const threshold = 0.0001;
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

// Vehicle Marker with smooth movement (optional)
const VehicleMarker = React.memo(({ vehicle, onClick }) => {
  const markerRef = useRef();
  const prevPos = useRef([vehicle.latitude, vehicle.longitude]);

  // Animate marker movement smoothly over time (simple lerp)
  useEffect(() => {
    if (!markerRef.current) return;
    const newPos = [vehicle.latitude, vehicle.longitude];
    // Only animate if moved more than a threshold
    if (Math.hypot(newPos[0] - prevPos.current[0], newPos[1] - prevPos.current[1]) > 0.0001) {
      // Start animation
      const startPos = prevPos.current;
      const endPos = newPos;
      const startTime = performance.now();
      const duration = 500; // ms

      const animate = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const lat = startPos[0] + (endPos[0] - startPos[0]) * t;
        const lng = startPos[1] + (endPos[1] - startPos[1]) * t;
        markerRef.current.setLatLng([lat, lng]);
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          prevPos.current = endPos;
        }
      };
      requestAnimationFrame(animate);
    } else {
      // Just update without animation
      markerRef.current.setLatLng(newPos);
      prevPos.current = newPos;
    }
  }, [vehicle.latitude, vehicle.longitude]);

  return (
    <Marker
      ref={markerRef}
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
  );
});

// Accident Marker (static)
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

// Enhanced Signal Marker with countdown and queue bars
const getSignalIcon = (state) => {
  const colors = { red: '#ef4444', yellow: '#f59e0b', green: '#10b981' };
  return L.divIcon({
    className: 'signal-marker',
    html: `<div style="background-color: ${colors[state]}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const SignalMarker = React.memo(({ signal, onClick, remainingTime, queueLengths }) => {
  // remainingTime in seconds (optional)
  const countdownText = remainingTime !== undefined && remainingTime > 0
    ? `${Math.ceil(remainingTime)}s`
    : '';
  return (
    <Marker
      position={[signal.location.coordinates[1], signal.location.coordinates[0]]}
      icon={getSignalIcon(signal.current_state)}
      eventHandlers={{ click: () => onClick(signal, 'signal') }}
    >
      <Popup>
        <div className="p-2 min-w-[240px]">
          <h4 className="font-semibold">🚦 Traffic Light</h4>
          <p className="text-sm text-gray-600">{signal.location_name || signal.signal_id}</p>
          <div className="flex items-center justify-between mt-1">
            <span>State: <span className={`font-bold text-${signal.current_state}-600`}>{signal.current_state.toUpperCase()}</span></span>
            {countdownText && <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">⏱️ {countdownText}</span>}
          </div>
          {signal.override_active && <p className="text-orange-500 text-xs mt-1">🔧 Overridden</p>}
          {signal.preempted_by && <p className="text-red-500 text-xs mt-1">🚑 Emergency preemption</p>}
          {/* Queue bars */}
          {queueLengths && (
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1">Queue lengths (estimated):</p>
              <div className="space-y-1">
                {Object.entries(queueLengths).map(([dir, len]) => (
                  <div key={dir} className="flex items-center text-xs">
                    <span className="w-8 text-gray-500">{dir}:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 ml-2">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, len * 5)}%` }}
                      />
                    </div>
                    <span className="ml-2 text-gray-500">{len}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
});

// Heatmap Layer Component
const HeatmapLayer = ({ points }) => {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    if (points && points.length > 0) {
      // Leaflet.heat expects lat, lng, intensity (optional)
      const heatPoints = points.map(p => [p.lat, p.lng, p.intensity || 1.0]);
      layerRef.current = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.3
      });
      layerRef.current.addTo(map);
    }
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, points]);

  return null;
};

// Google Maps iframe view (unchanged)
const GoogleMapsView = React.memo(({ center, zoom }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const prevCenterRef = useRef(center);
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!isSameCoords(prevCenterRef.current, center)) {
      const newSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${center[0]},${center[1]}&zoom=${zoom}&maptype=satellite`;
      setSrc(newSrc);
      prevCenterRef.current = center;
    }
  }, [center, zoom, apiKey]);

  if (!apiKey) {
    return <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">Google Maps API key missing</div>;
  }

  return (
    <iframe
      src={src}
      className="w-full h-full rounded-lg border-0"
      allowFullScreen
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      title="Google Maps"
    />
  );
});

const LiveMap = ({
  vehicles = [],
  accidents = [],
  signals = [],
  center = [22.5726, 88.3639],
  zoom = 14,
  onMarkerClick,
  mapType = 'interactive',
  heatmapPoints = [],           // array of {lat, lng, intensity}
  signalRemainingTime = {},     // map signal_id -> remaining seconds
  signalQueues = {}              // map signal_id -> {N: count, S: count, E: count, W: count}
}) => {
  if (mapType === 'simple') {
    return <GoogleMapsView center={center} zoom={zoom} />;
  }

  // Use a more realistic tile layer (CartoDB Voyager)
  const tileLayerUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CartoDB';

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
        <HeatmapLayer points={heatmapPoints} />
        {vehicles.map(vehicle => (
          <VehicleMarker key={vehicle.blackbox_id} vehicle={vehicle} onClick={onMarkerClick} />
        ))}
        {accidents.map(accident => (
          <AccidentMarker key={accident._id} accident={accident} onClick={onMarkerClick} />
        ))}
        {signals.map(signal => (
          <SignalMarker
            key={signal.signal_id}
            signal={signal}
            onClick={onMarkerClick}
            remainingTime={signalRemainingTime[signal.signal_id]}
            queueLengths={signalQueues[signal.signal_id]}
          />
        ))}
      </MapContainer>

      {/* Open in Google Maps button */}
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