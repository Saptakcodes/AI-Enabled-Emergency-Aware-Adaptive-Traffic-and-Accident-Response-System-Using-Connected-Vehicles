// src/pages/TrafficManagement.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import LiveMap from '../components/LiveMap';
import { 
  FaArrowLeft, FaList, FaBolt, FaCar, FaTrafficLight, FaChartLine,
  FaPlay, FaPause, FaStop, FaExchangeAlt
} from 'react-icons/fa';
import { MdEmergency, MdRefresh } from 'react-icons/md';

// Helper functions
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Compute remaining time for a signal based on its last update and cycle duration
const computeRemainingTime = (signal) => {
  const now = new Date();
  const last = new Date(signal.last_updated);
  const elapsed = (now - last) / 1000; // seconds
  let totalDuration = 0;
  // Determine expected duration for current state
  if (signal.current_state === 'green') {
    totalDuration = signal.current_cycle_time;
  } else if (signal.current_state === 'red') {
    totalDuration = signal.current_cycle_time;
  } else if (signal.current_state === 'yellow') {
    totalDuration = 5; // fixed yellow duration
  }
  const remaining = Math.max(0, totalDuration - elapsed);
  return remaining;
};

// Estimate queue lengths per approach based on vehicles near intersection
const computeQueueLengths = (signal, vehicles) => {
  const [lon, lat] = signal.location.coordinates;
  // Define approximate approach directions (simplified)
  const approaches = {
    N: { minLat: lat, maxLat: lat + 0.002, minLon: lon - 0.001, maxLon: lon + 0.001 },
    S: { minLat: lat - 0.002, maxLat: lat, minLon: lon - 0.001, maxLon: lon + 0.001 },
    E: { minLon: lon, maxLon: lon + 0.002, minLat: lat - 0.001, maxLat: lat + 0.001 },
    W: { minLon: lon - 0.002, maxLon: lon, minLat: lat - 0.001, maxLat: lat + 0.001 }
  };
  const counts = { N: 0, S: 0, E: 0, W: 0 };
  vehicles.forEach(v => {
    if (v.latitude === 0 && v.longitude === 0) return;
    // Only count vehicles with low speed (likely queued)
    if (v.speed_kmph > 5) return;
    for (const [dir, bounds] of Object.entries(approaches)) {
      if (v.latitude >= bounds.minLat && v.latitude <= bounds.maxLat &&
          v.longitude >= bounds.minLon && v.longitude <= bounds.maxLon) {
        counts[dir]++;
      }
    }
  });
  return counts;
};

const TrafficManagement = () => {
  const navigate = useNavigate();
  const [signals, setSignals] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [overrideDuration, setOverrideDuration] = useState(10);
  const [preemptions, setPreemptions] = useState([]);
  const [vehicleDensity, setVehicleDensity] = useState({});
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [remainingTimes, setRemainingTimes] = useState({});
  const [queueLengths, setQueueLengths] = useState({});
  const [simulationMode, setSimulationMode] = useState(false);
  const simulationInterval = useRef(null);

  // Function to fetch real data
  const fetchData = async () => {
    try {
      const [signalsRes, vehiclesRes] = await Promise.all([
        API.get('/signals'),
        API.get('/live-data')
      ]);
      setSignals(signalsRes.data);
      setVehicles(vehiclesRes.data);
      setLastUpdated(new Date());

      // Compute density (vehicles within 200m)
      const density = {};
      signalsRes.data.forEach(signal => {
        const [lon, lat] = signal.location.coordinates;
        const nearby = vehiclesRes.data.filter(v => {
          if (v.latitude === 0 && v.longitude === 0) return false;
          const dist = haversine(v.latitude, v.longitude, lat, lon);
          return dist < 200;
        });
        density[signal.signal_id] = nearby.length;
      });
      setVehicleDensity(density);

      // Compute heatmap points (all vehicle positions)
      const points = vehiclesRes.data
        .filter(v => v.latitude !== 0 && v.longitude !== 0)
        .map(v => ({ lat: v.latitude, lng: v.longitude, intensity: 1.0 }));
      setHeatmapPoints(points);

      // Compute remaining times for each signal
      const times = {};
      signalsRes.data.forEach(sig => {
        times[sig.signal_id] = computeRemainingTime(sig);
      });
      setRemainingTimes(times);

      // Compute queue lengths
      const queues = {};
      signalsRes.data.forEach(sig => {
        queues[sig.signal_id] = computeQueueLengths(sig, vehiclesRes.data);
      });
      setQueueLengths(queues);

    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulation: generate fake vehicles and update periodically
  const startSimulation = () => {
    if (simulationInterval.current) clearInterval(simulationInterval.current);
    // Seed some fake vehicles
    const fakeVehicles = [
      { blackbox_id: 'SIM_AMB_001', latitude: 22.6925, longitude: 88.4715, speed_kmph: 40, acceleration_g: 0.9, tilt_degree: 0, fire_detected: false, human_presence: false, breathing_detected: false, timestamp: new Date().toISOString() },
      { blackbox_id: 'SIM_CAR_001', latitude: 22.6915, longitude: 88.4710, speed_kmph: 30, acceleration_g: 0.8, tilt_degree: 0, fire_detected: false, human_presence: false, breathing_detected: false, timestamp: new Date().toISOString() },
      { blackbox_id: 'SIM_CAR_002', latitude: 22.6930, longitude: 88.4720, speed_kmph: 20, acceleration_g: 0.7, tilt_degree: 0, fire_detected: false, human_presence: false, breathing_detected: false, timestamp: new Date().toISOString() }
    ];
    setVehicles(fakeVehicles);
    // Update positions every 2 seconds
    simulationInterval.current = setInterval(() => {
      setVehicles(prev => prev.map(v => ({
        ...v,
        latitude: v.latitude + (Math.random() - 0.5) * 0.0005,
        longitude: v.longitude + (Math.random() - 0.5) * 0.0005,
        speed_kmph: Math.max(0, v.speed_kmph + (Math.random() - 0.5) * 5),
        timestamp: new Date().toISOString()
      })));
    }, 2000);
  };

  const stopSimulation = () => {
    if (simulationInterval.current) {
      clearInterval(simulationInterval.current);
      simulationInterval.current = null;
    }
    // Reload real data
    fetchData();
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => {
      clearInterval(interval);
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    };
  }, []);

  // Update remaining times every second for countdown
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setRemainingTimes(prev => {
        const newTimes = {};
        signals.forEach(sig => {
          newTimes[sig.signal_id] = computeRemainingTime(sig);
        });
        return newTimes;
      });
    }, 1000);
    return () => clearInterval(countdownInterval);
  }, [signals]);

  const handleOverride = async (signalId, newState, duration) => {
    try {
      await API.put(`/signals/${signalId}/override`, {
        new_state: newState,
        duration_seconds: duration
      });
      const signal = signals.find(s => s.signal_id === signalId);
      setPreemptions(prev => [{
        id: Date.now(),
        signalId,
        signalName: signal?.location_name || signalId,
        action: `Manual override to ${newState.toUpperCase()} for ${duration}s`,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
      // Refresh signals immediately
      await fetchData();
    } catch (err) {
      console.error('Override failed', err);
      alert('Failed to override signal');
    }
  };

  const handleMarkerClick = (item, type) => {
    if (type === 'signal') setSelectedSignal(item);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-black/30 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-700 rounded-lg transition">
              <FaArrowLeft className="text-white text-xl" />
            </button>
            <div className="flex items-center space-x-2">
              <FaTrafficLight className="text-3xl text-blue-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Adaptive Traffic Management
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">LIVE</span>
              <span className="text-xs text-gray-400">{lastUpdated?.toLocaleTimeString()}</span>
            </div>
            {/* Simulation mode toggle */}
            <button
              onClick={() => {
                if (simulationMode) {
                  stopSimulation();
                  setSimulationMode(false);
                } else {
                  startSimulation();
                  setSimulationMode(true);
                }
              }}
              className={`p-2 rounded-lg transition ${simulationMode ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              title={simulationMode ? "Stop Simulation" : "Start Simulation"}
            >
              {simulationMode ? <FaStop className="text-white text-xl" /> : <FaPlay className="text-white text-xl" />}
            </button>
            <button onClick={() => window.location.reload()} className="p-2 hover:bg-gray-700 rounded-lg transition">
              <MdRefresh className="text-white text-xl" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
          <div className="h-[600px]">
            <LiveMap
              vehicles={vehicles}
              accidents={[]}
              signals={signals}
              center={[22.5726, 88.3639]}
              onMarkerClick={handleMarkerClick}
              mapType="interactive"
              heatmapPoints={heatmapPoints}
              signalRemainingTime={remainingTimes}
              signalQueues={queueLengths}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <FaList className="mr-2 text-blue-400" />
                Traffic Signals
              </h2>
              <span className="text-xs text-gray-400">{signals.length} intersections</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {signals.map(signal => (
                <div key={signal.signal_id} className={`bg-gray-700 rounded-lg p-3 transition-all ${selectedSignal?.signal_id === signal.signal_id ? 'ring-2 ring-blue-500' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{signal.location_name || signal.signal_id}</p>
                      <p className="text-xs text-gray-400">ID: {signal.signal_id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        signal.current_state === 'red' ? 'bg-red-600 text-white' :
                        signal.current_state === 'yellow' ? 'bg-yellow-500 text-black' : 'bg-green-600 text-white'
                      }`}>
                        {signal.current_state.toUpperCase()}
                      </div>
                      {/* Countdown badge */}
                      {remainingTimes[signal.signal_id] > 0 && (
                        <span className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">
                          ⏱️ {Math.ceil(remainingTimes[signal.signal_id])}s
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>🚗 Nearby: {vehicleDensity[signal.signal_id] || 0}</span>
                    {signal.override_active && <span className="text-orange-400 flex items-center"><FaBolt className="mr-1" /> Override</span>}
                    {signal.preempted_by && <span className="text-red-400 flex items-center"><MdEmergency className="mr-1" /> Preempted</span>}
                  </div>
                  {/* Queue bars (simplified) */}
                  {queueLengths[signal.signal_id] && (
                    <div className="mt-1 mb-2">
                      <p className="text-xs text-gray-400 mb-1">Queue lengths:</p>
                      <div className="flex space-x-2 text-[10px]">
                        {Object.entries(queueLengths[signal.signal_id]).map(([dir, len]) => (
                          <div key={dir} className="flex-1 text-center">
                            <div className="bg-gray-600 rounded-full h-1.5 mb-1">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, len * 10)}%` }} />
                            </div>
                            <span className="text-gray-400">{dir}: {len}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex space-x-2">
                    <button onClick={() => handleOverride(signal.signal_id, 'green', overrideDuration)} className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition">Force Green</button>
                    <button onClick={() => handleOverride(signal.signal_id, 'red', overrideDuration)} className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition">Force Red</button>
                    <button onClick={() => handleOverride(signal.signal_id, 'yellow', 5)} className="flex-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 rounded text-xs text-black transition">Force Yellow</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>Override duration (s):</span>
              <select value={overrideDuration} onChange={(e) => setOverrideDuration(Number(e.target.value))} className="bg-gray-700 text-white rounded px-2 py-1">
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700">
            <h2 className="text-lg font-semibold text-white flex items-center mb-3">
              <MdEmergency className="mr-2 text-red-400" />
              Emergency Preemption Log
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preemptions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No preemption events yet</p>
              ) : (
                preemptions.map(ev => (
                  <div key={ev.id} className="bg-gray-700 rounded p-2 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>{ev.signalName}</span>
                      <span>{ev.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <p className="text-blue-300">{ev.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 shadow-xl border border-gray-700">
            <h2 className="text-lg font-semibold text-white flex items-center mb-3">
              <FaChartLine className="mr-2 text-green-400" />
              Real‑time Metrics
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded p-3 text-center">
                <FaCar className="text-blue-400 text-xl mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{vehicles.length}</p>
                <p className="text-xs text-gray-400">Active Vehicles</p>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <FaTrafficLight className="text-yellow-400 text-xl mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{signals.length}</p>
                <p className="text-xs text-gray-400">Traffic Signals</p>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <FaBolt className="text-orange-400 text-xl mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{signals.filter(s => s.override_active).length}</p>
                <p className="text-xs text-gray-400">Active Overrides</p>
              </div>
              <div className="bg-gray-700 rounded p-3 text-center">
                <MdEmergency className="text-red-400 text-xl mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{preemptions.length}</p>
                <p className="text-xs text-gray-400">Recent Preemptions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficManagement;