// src/pages/AccidentReports.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaFilePdf, FaEye, FaDownload, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AccidentReports = () => {
  const navigate = useNavigate();
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccident, setSelectedAccident] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAccidents();
  }, []);

  const fetchAccidents = async () => {
    try {
      const res = await API.get('/accidents');
      setAccidents(res.data);
    } catch (error) {
      console.error('Failed to fetch accidents', error);
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalies = (acc) => {
    const anomalies = [];
    if (acc.acceleration_g > 3) anomalies.push('High impact (acceleration > 3g)');
    if (acc.tilt_degree > 30) anomalies.push('Severe tilt (>30°)');
    if (acc.fire_detected) anomalies.push('Fire detected');
    if (acc.speed_kmph > 80) anomalies.push('High speed at impact');
    return anomalies;
  };

  const filteredAccidents = filter === 'all' 
    ? accidents 
    : accidents.filter(a => a.fire_detected === (filter === 'fire'));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/dashboard')} className="mr-4 p-2 hover:bg-gray-700 rounded-lg transition">
            <FaArrowLeft className="text-gray-400 text-xl" />
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            Accident Reports
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('fire')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === 'fire' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Fire Related
            </button>
          </div>
        </div>

        {/* Accident List */}
        <div className="grid gap-4">
          {filteredAccidents.map(acc => {
            const anomalies = detectAnomalies(acc);
            return (
              <motion.div
                key={acc._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 rounded-xl p-5 shadow-lg border border-gray-700 hover:shadow-xl transition"
              >
                <div className="flex flex-wrap justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-xs font-semibold">
                        Accident
                      </span>
                      {acc.fire_detected && (
                        <span className="px-3 py-1 bg-orange-900/50 text-orange-300 rounded-full text-xs font-semibold">
                          🔥 Fire
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(acc.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-sm font-medium text-gray-200">{acc.latitude.toFixed(4)}, {acc.longitude.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Speed</p>
                        <p className="text-sm font-medium text-gray-200">{acc.speed_kmph} km/h</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Acceleration</p>
                        <p className="text-sm font-medium text-gray-200">{acc.acceleration_g} g</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Tilt</p>
                        <p className="text-sm font-medium text-gray-200">{acc.tilt_degree}°</p>
                      </div>
                    </div>

                    {anomalies.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-300 flex items-center">
                          <FaExclamationTriangle className="mr-1" /> Anomalies Detected
                        </p>
                        <ul className="text-xs text-yellow-300 list-disc list-inside mt-1">
                          {anomalies.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedAccident(acc)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center"
                    >
                      <FaEye className="mr-2" /> View Details
                    </button>
                    <button
                      onClick={() => navigate(`/accident/${acc._id}`)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition flex items-center"
                    >
                      <FaFilePdf className="mr-2" /> View Report
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Modal */}
        {selectedAccident && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-700 shadow-2xl">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-white">Accident Report</h2>
                <button onClick={() => setSelectedAccident(null)} className="text-gray-400 hover:text-gray-300">✕</button>
              </div>
              <div className="space-y-3 text-gray-300">
                <p><span className="font-semibold text-gray-400">Blackbox ID:</span> {selectedAccident.blackbox_id}</p>
                <p><span className="font-semibold text-gray-400">Time:</span> {new Date(selectedAccident.timestamp).toLocaleString()}</p>
                <p><span className="font-semibold text-gray-400">Location:</span> {selectedAccident.latitude}, {selectedAccident.longitude}</p>
                <p><span className="font-semibold text-gray-400">Speed:</span> {selectedAccident.speed_kmph} km/h</p>
                <p><span className="font-semibold text-gray-400">Acceleration:</span> {selectedAccident.acceleration_g} g</p>
                <p><span className="font-semibold text-gray-400">Tilt:</span> {selectedAccident.tilt_degree}°</p>
                <p><span className="font-semibold text-gray-400">Human Presence:</span> {selectedAccident.human_presence ? 'Yes' : 'No'}</p>
                <p><span className="font-semibold text-gray-400">Breathing Detected:</span> {selectedAccident.breathing_detected ? 'Yes' : 'No'}</p>
                <p><span className="font-semibold text-gray-400">Fire Detected:</span> {selectedAccident.fire_detected ? 'Yes' : 'No'}</p>
                <p><span className="font-semibold text-gray-400">Ambulance Notified:</span> {selectedAccident.ambulance_notified ? 'Yes' : 'No'}</p>
                <p><span className="font-semibold text-gray-400">Police Notified:</span> {selectedAccident.police_notified ? 'Yes' : 'No'}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedAccident(null);
                    navigate(`/accident/${selectedAccident._id}`);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Generate Insurance Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccidentReports;