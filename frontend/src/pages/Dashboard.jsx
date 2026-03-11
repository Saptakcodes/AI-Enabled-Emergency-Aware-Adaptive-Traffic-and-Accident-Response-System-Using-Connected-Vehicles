// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import LiveMap from '../components/LiveMap';
import { 
  FaAmbulance, FaBell, FaUserCircle, FaMapMarkerAlt, FaTrafficLight,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaChartLine, FaCog,
  FaSignOutAlt, FaUser, FaPhoneAlt, FaFileAlt, FaChevronDown,
  FaSatellite, FaCar, FaFire, FaShieldAlt
} from 'react-icons/fa';
import { MdEmergency, MdHealthAndSafety, MdRefresh } from 'react-icons/md';
import { IoMdWarning, IoMdInformation } from 'react-icons/io';
import { BsLightningChargeFill } from 'react-icons/bs';
import { GiPoliceBadge, GiFireExtinguisher } from 'react-icons/gi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'User', role: 'normal', avatar: '' });
  const [liveTime, setLiveTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]);

  // Real data states
  const [vehicles, setVehicles] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    activeEmergencies: 0,
    responseTime: 2.5,
    todayIncidents: 0,
    yesterdayIncidents: 0,
    systemHealth: 98
  });

  // Animated stats
  const [animatedStats, setAnimatedStats] = useState({
    activeEmergencies: 0,
    responseTime: 0,
    todayIncidents: 0,
    systemHealth: 0
  });

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  // Fetch live data every 5 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [liveRes, accidentsRes] = await Promise.all([
          API.get('/live-data'),
          API.get('/accidents')
        ]);
        setVehicles(liveRes.data);
        setAccidents(accidentsRes.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Failed to load data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update map center to first valid vehicle
  useEffect(() => {
    const validVehicle = vehicles.find(v => v.latitude !== 0 && v.longitude !== 0);
    if (validVehicle) {
      setMapCenter([validVehicle.latitude, validVehicle.longitude]);
    } else {
      const validAccident = accidents.find(a => a.latitude !== 0 && a.longitude !== 0);
      if (validAccident) {
        setMapCenter([validAccident.latitude, validAccident.longitude]);
      }
    }
  }, [vehicles, accidents]);

  // Compute stats
  useEffect(() => {
    const activeEmergencies = vehicles.filter(v => v.fire_detected || v.acceleration_g > 3).length;
    const today = new Date().toISOString().split('T')[0];
    const todayIncidents = accidents.filter(a => a.timestamp.startsWith(today)).length;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayIncidents = accidents.filter(a => a.timestamp.startsWith(yesterday)).length;

    setStats(prev => ({
      ...prev,
      activeEmergencies,
      todayIncidents,
      yesterdayIncidents
    }));
  }, [vehicles, accidents]);

  // Count-up animation
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setAnimatedStats({
        activeEmergencies: Math.round(stats.activeEmergencies * progress),
        responseTime: (stats.responseTime * progress).toFixed(1),
        todayIncidents: Math.round(stats.todayIncidents * progress),
        systemHealth: Math.round(stats.systemHealth * progress)
      });
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          activeEmergencies: stats.activeEmergencies,
          responseTime: stats.responseTime,
          todayIncidents: stats.todayIncidents,
          systemHealth: stats.systemHealth
        });
      }
    }, interval);
    return () => clearInterval(timer);
  }, [stats]);

  // Live time
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const recentIncidents = accidents.slice(0, 4).map(a => ({
    id: a._id,
    lat: a.latitude,
    lng: a.longitude,
    severity: a.fire_detected ? 'critical' : a.acceleration_g > 3 ? 'medium' : 'low',
    title: `Accident @ ${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`,
    time: new Date(a.timestamp).toLocaleTimeString(),
    details: `Speed: ${a.speed_kmph} km/h, Tilt: ${a.tilt_degree}°`,
    units: a.fire_detected ? ['Fire Truck'] : ['Ambulance'],
    status: 'dispatched'
  }));

  const handleMarkerClick = (item, type) => {
    setSelectedMarker({ ...item, type });
    setMapCenter([item.latitude, item.longitude]);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MdEmergency className="text-2xl sm:text-3xl text-blue-600" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ALERT
              </span>
              <span className="text-gray-400 text-xs hidden lg:inline">Intelligent Emergency Response</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-600">LIVE</span>
                <span className="text-xs text-gray-500 hidden sm:inline">{liveTime.toLocaleTimeString()}</span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-100 rounded-full">
                  <FaBell className="text-xl text-gray-600" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-200">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-3 hover:bg-gray-50">
                        <p className="text-sm">New accident detected near Sector 5</p>
                        <span className="text-xs text-gray-400">2 min ago</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <FaUserCircle className="text-3xl text-gray-600" />
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <FaChevronDown className="text-xs text-gray-400" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200">
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm">
                      <FaUser className="text-xs" /><span>Profile</span>
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm">
                      <FaCog className="text-xs" /><span>Settings</span>
                    </button>
                    <hr className="border-gray-200" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-sm text-red-600">
                      <FaSignOutAlt className="text-xs" /><span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-600 text-sm flex items-center"><MdEmergency className="mr-1" /> ACTIVE EMERGENCIES</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{animatedStats.activeEmergencies}</p>
                <p className="text-xs text-green-600 mt-2 flex items-center"><FaChartLine className="mr-1" /> Live from sensors</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <MdEmergency className="text-xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-600 text-sm flex items-center"><FaClock className="mr-1" /> RESPONSE TIME</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{animatedStats.responseTime}s</p>
                <p className="text-xs text-green-600 mt-2">Average</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <FaClock className="text-xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-yellow-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-600 text-sm flex items-center"><IoMdWarning className="mr-1" /> TODAY'S INCIDENTS</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{animatedStats.todayIncidents}</p>
                <p className="text-xs text-yellow-600 mt-2">+{stats.todayIncidents - stats.yesterdayIncidents} vs yesterday</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <IoMdWarning className="text-xl text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-purple-100 hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-600 text-sm flex items-center"><MdHealthAndSafety className="mr-1" /> SYSTEM HEALTH</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{animatedStats.systemHealth}%</p>
                <p className="text-xs text-purple-600 mt-2">Optimal</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MdHealthAndSafety className="text-xl text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section - takes 2 columns */}
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaMapMarkerAlt className="text-blue-600 mr-2" />
                LIVE MAP
              </h2>
              <div className="flex space-x-2">
                <button onClick={() => setMapType('roadmap')} className={`px-3 py-1 rounded-lg text-sm ${mapType === 'roadmap' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  Road
                </button>
                <button onClick={() => setMapType('satellite')} className={`px-3 py-1 rounded-lg text-sm ${mapType === 'satellite' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <FaSatellite className="inline mr-1" /> Sat
                </button>
              </div>
            </div>
            <div className="relative h-96">
              <LiveMap
                vehicles={vehicles}
                accidents={accidents}
                center={mapCenter}
                onMarkerClick={handleMarkerClick}
              />
            </div>
            {selectedMarker && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedMarker.type === 'vehicle' ? '🚗 Vehicle' : '🚨 Accident'} Details
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Speed: {selectedMarker.speed_kmph} km/h | Tilt: {selectedMarker.tilt_degree}° | Fire: {selectedMarker.fire_detected ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <button onClick={() => setSelectedMarker(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              </div>
            )}
          </div>

          {/* Incidents Panel */}
          <div className="bg-white rounded-xl p-4 shadow-md border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
              <IoMdWarning className="text-yellow-500 mr-2" />
              RECENT INCIDENTS
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {recentIncidents.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent incidents</p>
              ) : (
                recentIncidents.map(incident => (
                  <div
                    key={incident.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow cursor-pointer transition"
                    onClick={() => {
                      setMapCenter([incident.lat, incident.lng]);
                      setSelectedMarker({ ...incident, type: 'accident' });
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${getSeverityColor(incident.severity)}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-semibold text-sm text-gray-800">{incident.title}</p>
                          <span className="text-xs text-gray-400">{incident.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{incident.details}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          {incident.units.includes('Ambulance') && <FaAmbulance className="text-red-400 text-xs" />}
                          {incident.units.includes('Fire Truck') && <GiFireExtinguisher className="text-orange-400 text-xs" />}
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {incident.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => navigate('/accident-reports')}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition"
              >
                View All Accident Reports
              </button>
            </div>
          </div>
        </div>

        {/* Fleet Status (placeholder) */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-700 flex items-center mb-3">
              <FaAmbulance className="text-red-500 mr-2" /> Ambulances
            </h3>
            <p className="text-2xl font-bold text-gray-800">{vehicles.filter(v => v.vehicle_type === 'ambulance').length}</p>
            <p className="text-xs text-gray-400">Registered units</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-700 flex items-center mb-3">
              <GiPoliceBadge className="text-blue-500 mr-2" /> Police
            </h3>
            <p className="text-2xl font-bold text-gray-800">{vehicles.filter(v => v.vehicle_type === 'police').length}</p>
            <p className="text-xs text-gray-400">Registered units</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-700 flex items-center mb-3">
              <GiFireExtinguisher className="text-orange-500 mr-2" /> Fire
            </h3>
            <p className="text-2xl font-bold text-gray-800">{vehicles.filter(v => v.vehicle_type === 'fire').length}</p>
            <p className="text-xs text-gray-400">Registered units</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="fixed bottom-6 right-6 z-50">
          <button className="w-14 h-14 bg-gradient-to-r from-blue-600 to-green-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white">
            <BsLightningChargeFill className="text-2xl" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;