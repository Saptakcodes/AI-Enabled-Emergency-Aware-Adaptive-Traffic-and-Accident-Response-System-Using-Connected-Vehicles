// src/pages/TrafficManagement.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import LiveMap from '../components/LiveMap';
import { 
  FaTrafficLight, FaMapMarkerAlt, FaCar, FaChartLine, FaClock, FaExclamationTriangle,
  FaArrowLeft, FaRedoAlt, FaBolt, FaList, FaEye, FaSync
} from 'react-icons/fa';
import { MdEmergency, MdRefresh } from 'react-icons/md';
import { GiTrafficLights } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Fetch signals and vehicle data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [signalsRes, vehiclesRes] = await Promise.all([
          API.get('/signals'),
          API.get('/live-data')
        ]);
        setSignals(signalsRes.data);
        setVehicles(vehiclesRes.data);
        setLastUpdated(new Date());
        
        // Calculate vehicle density near each signal (for visualization)
        const density = {};
        signalsRes.data.forEach(signal => {
          const [lon, lat] = signal.location.coordinates;
          // Count vehicles within 200m (simple approximation)
          const nearby = vehiclesRes.data.filter(v => {
            if (v.latitude === 0 && v.longitude === 0) return false;
            const dist = haversine(v.latitude, v.longitude, lat, lon);
            return dist < 200;
          });
          density[signal.signal_id] = nearby.length;
        });
        setVehicleDensity(density);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Haversine distance helper
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

  // Override signal
  const handleOverride = async (signalId, newState, duration) => {
    try {
      await API.put(`/signals/${signalId}/override`, {
        new_state: newState,
        duration_seconds: duration
      });
      // Add to preemption log (manual override)
      const signal = signals.find(s => s.signal_id === signalId);
      setPreemptions(prev => [{
        id: Date.now(),
        signalId,
        signalName: signal?.location_name || signalId,
        action: `Manual override to ${newState.toUpperCase()} for ${duration}s`,
        timestamp: new Date()
      }, ...prev].slice(0, 10));
    } catch (err) {
      console.error('Override failed', err);
      alert('Failed to override signal');
    }
  };

  // Handle marker click on map
  const handleMarkerClick = (item, type) => {
    if (type === 'signal') {
      setSelectedSignal(item);
    }
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
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <FaArrowLeft className="text-white text-xl" />
            </button>
            <div className="flex items-center space-x-2">
              <GiTrafficLights className="text-3xl text-blue-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                Adaptive Traffic Management
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">LIVE</span>
              <span className="text-xs text-gray-400">
                {lastUpdated?.toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <MdRefresh className="text-white text-xl" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Map Section */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
          <div className="h-[600px]">
            <LiveMap
              vehicles={vehicles}
              accidents={[]}
              signals={signals}
              center={[22.5726, 88.3639]}
              onMarkerClick={handleMarkerClick}
              mapType="interactive"
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Signal Status List */}
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
                <div
                  key={signal.signal_id}
                  className={`bg-gray-700 rounded-lg p-3 transition-all ${
                    selectedSignal?.signal_id === signal.signal_id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{signal.location_name || signal.signal_id}</p>
                      <p className="text-xs text-gray-400">ID: {signal.signal_id}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      signal.current_state === 'red' ? 'bg-red-600 text-white' :
                      signal.current_state === 'yellow' ? 'bg-yellow-500 text-black' :
                      'bg-green-600 text-white'
                    }`}>
                      {signal.current_state.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>🚗 Nearby: {vehicleDensity[signal.signal_id] || 0}</span>
                    {signal.override_active && (
                      <span className="text-orange-400 flex items-center">
                        <FaBolt className="mr-1" /> Override
                      </span>
                    )}
                    {signal.preempted_by && (
                      <span className="text-red-400 flex items-center">
                        <MdEmergency className="mr-1" /> Preempted
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleOverride(signal.signal_id, 'green', overrideDuration)}
                      className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white transition"
                    >
                      Force Green
                    </button>
                    <button
                      onClick={() => handleOverride(signal.signal_id, 'red', overrideDuration)}
                      className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs text-white transition"
                    >
                      Force Red
                    </button>
                    <button
                      onClick={() => handleOverride(signal.signal_id, 'yellow', 5)}
                      className="flex-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 rounded text-xs text-black transition"
                    >
                      Force Yellow
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>Override duration (s):</span>
              <select
                value={overrideDuration}
                onChange={(e) => setOverrideDuration(Number(e.target.value))}
                className="bg-gray-700 text-white rounded px-2 py-1"
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={20}>20s</option>
                <option value={30}>30s</option>
              </select>
            </div>
          </div>

          {/* Preemption Log */}
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

          {/* Traffic Stats */}
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
                <p className="text-2xl font-bold text-white">
                  {signals.filter(s => s.override_active).length}
                </p>
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