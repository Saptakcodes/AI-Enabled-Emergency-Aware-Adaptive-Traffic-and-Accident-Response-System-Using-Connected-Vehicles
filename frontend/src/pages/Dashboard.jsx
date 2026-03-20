// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import LiveMap from '../components/LiveMap';
import { 
  FaAmbulance, FaBell, FaUserCircle, FaMapMarkerAlt, FaTrafficLight,
  FaExclamationTriangle, FaCheckCircle, FaClock, FaChartLine, FaCog,
  FaSignOutAlt, FaUser, FaPhoneAlt, FaFileAlt, FaChevronDown,
  FaSatellite, FaCar, FaFire, FaShieldAlt, FaList, FaTachometerAlt
} from 'react-icons/fa';
import { MdEmergency, MdHealthAndSafety, MdRefresh, MdWarning } from 'react-icons/md';
import { IoMdWarning, IoMdInformation } from 'react-icons/io';
import { BsLightningChargeFill } from 'react-icons/bs';
import { GiPoliceBadge, GiFireExtinguisher } from 'react-icons/gi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: 'User', role: 'normal', avatar: '', email: '', vehicleNumber: '' });
  const [liveTime, setLiveTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mapViewMode, setMapViewMode] = useState('interactive');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Real data states
  const [vehicles, setVehicles] = useState([]);
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Post‑accident state
  const [postAccidentLatest, setPostAccidentLatest] = useState(null);
  const [postAccidentLoading, setPostAccidentLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    emergencyVehicles: 0,
    todayIncidents: 0,
    yesterdayIncidents: 0,
    systemHealth: 98
  });

  // Animated stats
  const [animatedStats, setAnimatedStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    emergencyVehicles: 0,
    todayIncidents: 0,
    systemHealth: 0
  });

  // Location info state (includes fire)
  const [locationInfo, setLocationInfo] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState({ hospitals: [], police: [], fire: [] });
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodingError, setGeocodingError] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
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
        setLastUpdated(new Date());
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

  // Generate notifications from critical events
  useEffect(() => {
    const newNotifications = [];
    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    accidents.forEach(acc => {
      const accTime = new Date(acc.timestamp);
      if (accTime > fiveMinAgo) {
        newNotifications.push({
          id: acc._id,
          type: 'emergency',
          message: `Accident detected at ${acc.latitude.toFixed(4)}, ${acc.longitude.toFixed(4)}`,
          time: 'Just now'
        });
      }
    });
    vehicles.forEach(v => {
      if (v.fire_detected) {
        newNotifications.push({
          id: v.blackbox_id + '_fire',
          type: 'warning',
          message: `Fire detected in vehicle ${v.blackbox_id}`,
          time: 'Just now'
        });
      }
    });
    setNotifications(newNotifications.slice(0, 5));
  }, [vehicles, accidents]);

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
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.speed_kmph > 0).length;
    const emergencyVehicles = vehicles.filter(v => v.fire_detected || v.acceleration_g > 3).length;
    const today = new Date().toISOString().split('T')[0];
    const todayIncidents = accidents.filter(a => a.timestamp.startsWith(today)).length;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const yesterdayIncidents = accidents.filter(a => a.timestamp.startsWith(yesterday)).length;

    setStats(prev => ({
      ...prev,
      totalVehicles,
      activeVehicles,
      emergencyVehicles,
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
        totalVehicles: Math.round(stats.totalVehicles * progress),
        activeVehicles: Math.round(stats.activeVehicles * progress),
        emergencyVehicles: Math.round(stats.emergencyVehicles * progress),
        todayIncidents: Math.round(stats.todayIncidents * progress),
        systemHealth: Math.round(stats.systemHealth * progress)
      });
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          totalVehicles: stats.totalVehicles,
          activeVehicles: stats.activeVehicles,
          emergencyVehicles: stats.emergencyVehicles,
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

  // Fetch reverse geocode and nearby places when selectedMarker changes
  useEffect(() => {
    if (!selectedMarker) {
      setLocationInfo(null);
      setNearbyPlaces({ hospitals: [], police: [], fire: [] });
      setGeocodingError(null);
      return;
    }

    console.log("🎯 selectedMarker changed:", selectedMarker);

    // Helper to retry failed requests (optional)
    const fetchWithRetry = async (url, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await API.get(url);
        } catch (error) {
          if (error.response?.status === 429 && i < retries - 1) {
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            console.log(`Rate limited. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
    };

    const fetchLocationInfo = async () => {
      setGeocodingLoading(true);
      setGeocodingError(null);
      try {
        // Reverse geocode
        console.log("📡 Calling reverse geocode...");
        const geoRes = await API.get(`/geocode/reverse?lat=${selectedMarker.latitude}&lon=${selectedMarker.longitude}`);
        console.log("✅ Reverse geocode response:", geoRes.data);
        setLocationInfo(geoRes.data);

        // Single request for hospitals, police, fire stations
        console.log("📡 Calling nearby-multi for hospitals, police, fire...");
        const nearbyRes = await fetchWithRetry(
          `/geocode/nearby-multi?lat=${selectedMarker.latitude}&lon=${selectedMarker.longitude}&types=hospital,police,fire_station&radius=2000`
        );
        console.log("✅ Nearby multi response:", nearbyRes.data);
        setNearbyPlaces({
          hospitals: (nearbyRes.data.hospital || []).slice(0, 3),
          police: (nearbyRes.data.police || []).slice(0, 3),
          fire: (nearbyRes.data.fire_station || []).slice(0, 3)
        });
      } catch (error) {
        console.error('❌ Failed to fetch location info:', error);
        setGeocodingError(error.message || 'Failed to load location data');
      } finally {
        setGeocodingLoading(false);
      }
    };

    fetchLocationInfo();
  }, [selectedMarker]);

  // Fetch latest post‑accident data when an accident marker is selected
  useEffect(() => {
    if (selectedMarker?.type === 'accident' && selectedMarker.blackbox_id) {
      const fetchPostAccident = async () => {
        setPostAccidentLoading(true);
        try {
          const res = await API.get(`/post-accident/latest/${selectedMarker.blackbox_id}`);
          setPostAccidentLatest(res.data);
        } catch (error) {
          console.error('Failed to fetch post-accident data', error);
          setPostAccidentLatest(null);
        } finally {
          setPostAccidentLoading(false);
        }
      };
      fetchPostAccident();
    } else {
      setPostAccidentLatest(null);
    }
  }, [selectedMarker]);

  const recentIncidents = accidents.slice(0, 4).map(a => ({
    id: a._id,
    lat: a.latitude,
    lng: a.longitude,
    blackbox_id: a.blackbox_id,
    severity: a.fire_detected ? 'critical' : a.acceleration_g > 3 ? 'medium' : 'low',
    title: `Accident @ ${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)}`,
    time: new Date(a.timestamp).toLocaleTimeString(),
    details: `Speed: ${a.speed_kmph} km/h, Tilt: ${a.tilt_degree}°`,
    units: a.fire_detected ? ['Fire Truck'] : ['Ambulance'],
    status: 'dispatched'
  }));

  const handleMarkerClick = (item, type) => {
    console.log("🖱️ Marker clicked:", item, type);
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MdEmergency className="text-2xl sm:text-3xl text-blue-400" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                ALERT
              </span>
              <span className="text-gray-500 text-xs hidden lg:inline">Intelligent Emergency Response</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-400">LIVE</span>
                <span className="text-xs text-gray-400 hidden sm:inline">{liveTime.toLocaleTimeString()}</span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 hover:bg-gray-700 rounded-full transition">
                  <FaBell className="text-xl text-gray-300" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-white">Alerts</h3>
                      <button className="text-xs text-blue-400">Clear</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No new alerts</div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className="p-3 hover:bg-gray-700 border-b border-gray-700 last:border-0">
                            <div className="flex items-start space-x-2">
                              {notif.type === 'emergency' ? (
                                <MdEmergency className="text-red-400 mt-0.5 flex-shrink-0" />
                              ) : (
                                <MdWarning className="text-yellow-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div>
                                <p className="text-sm text-gray-200">{notif.message}</p>
                                <span className="text-xs text-gray-400">{notif.time}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu - Enhanced */}
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-2 hover:bg-gray-700 rounded-lg p-2 transition">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <FaUserCircle className="text-3xl text-gray-300" />
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-white">{user.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                  </div>
                  <FaChevronDown className="text-xs text-gray-400" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                    {/* User details section */}
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Vehicle: {user.vehicleNumber || 'Not set'} ({user.role})
                      </p>
                    </div>
                    <div className="py-1">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 text-sm text-gray-200 transition">
                        <FaUser className="text-xs text-gray-400" />
                        <span>Profile</span>
                      </button>
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 text-sm text-gray-200 transition">
                        <FaCog className="text-xs text-gray-400" />
                        <span>Settings</span>
                      </button>
                      {/* Claim Device - navigates to separate page */}
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/claim-device');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 text-sm text-gray-200 transition"
                      >
                        <FaShieldAlt className="text-xs text-blue-400" />
                        <span>Claim Device</span>
                      </button>
                      <hr className="border-gray-700" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 text-sm text-red-400 transition">
                        <FaSignOutAlt className="text-xs" />
                        <span>Logout</span>
                      </button>
                    </div>
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
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-400 text-sm flex items-center"><FaCar className="mr-1" /> TOTAL VEHICLES</p>
                <p className="text-3xl font-bold text-white mt-2">{animatedStats.totalVehicles}</p>
                <p className="text-xs text-green-400 mt-2 flex items-center"><FaChartLine className="mr-1" /> Registered</p>
              </div>
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <FaCar className="text-xl text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-400 text-sm flex items-center"><FaTachometerAlt className="mr-1" /> ACTIVE VEHICLES</p>
                <p className="text-3xl font-bold text-white mt-2">{animatedStats.activeVehicles}</p>
                <p className="text-xs text-green-400 mt-2">Speed &gt; 0 km/h</p>
              </div>
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <FaTachometerAlt className="text-xl text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-400 text-sm flex items-center"><MdWarning className="mr-1" /> EMERGENCY VEHICLES</p>
                <p className="text-3xl font-bold text-white mt-2">{animatedStats.emergencyVehicles}</p>
                <p className="text-xs text-red-400 mt-2">Fire/High impact</p>
              </div>
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <MdWarning className="text-xl text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:shadow-xl transition">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-400 text-sm flex items-center"><IoMdWarning className="mr-1" /> TODAY'S INCIDENTS</p>
                <p className="text-3xl font-bold text-white mt-2">{animatedStats.todayIncidents}</p>
                <p className="text-xs text-purple-400 mt-2">+{stats.todayIncidents - stats.yesterdayIncidents} vs yesterday</p>
              </div>
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <IoMdWarning className="text-xl text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <FaMapMarkerAlt className="text-blue-400 mr-2" />
                LIVE MAP
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setMapViewMode('interactive')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    mapViewMode === 'interactive' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } transition`}
                >
                  Interactive
                </button>
                <button
                  onClick={() => setMapViewMode('simple')}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    mapViewMode === 'simple' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } transition`}
                >
                  Satellite
                </button>
              </div>
            </div>
            <div className="relative h-96">
              <LiveMap
                vehicles={vehicles}
                accidents={accidents}
                center={mapCenter}
                onMarkerClick={handleMarkerClick}
                mapType={mapViewMode}
              />
            </div>
            {/* Rich Marker Details Panel with fire stations and post-accident */}
            {selectedMarker && (
              <div className="mt-3 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <p className="font-semibold text-white">
                      {selectedMarker.type === 'vehicle' ? '🚗 Vehicle' : '🚨 Accident'} Details
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      Speed: {selectedMarker.speed_kmph} km/h | Tilt: {selectedMarker.tilt_degree}° | Fire: {selectedMarker.fire_detected ? 'Yes' : 'No'}
                    </p>

                    {/* Post‑accident status (only for accident markers) */}
                    {selectedMarker.type === 'accident' && (
                      <div className="mt-3 p-2 bg-red-900/50 border border-red-700 rounded-lg">
                        <p className="text-xs font-semibold text-red-300 flex items-center">
                          <MdEmergency className="mr-1" /> Post‑Accident Monitoring
                        </p>
                        {postAccidentLoading ? (
                          <p className="text-xs text-gray-400">Loading latest status...</p>
                        ) : postAccidentLatest ? (
                          <div className="mt-1 text-xs text-gray-300">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Human:</span>
                              <span className={postAccidentLatest.human_presence ? 'text-green-400' : 'text-red-400'}>
                                {postAccidentLatest.human_presence ? '✅ Present' : '❌ Absent'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Breathing:</span>
                              <span className={postAccidentLatest.breathing_detected ? 'text-green-400' : 'text-red-400'}>
                                {postAccidentLatest.breathing_detected ? '✅ Yes' : '❌ No'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-400">Fire:</span>
                              <span className={postAccidentLatest.fire_detected ? 'text-red-400' : 'text-green-400'}>
                                {postAccidentLatest.fire_detected ? '🔥 Detected' : '✅ None'}
                              </span>
                            </div>
                            <p className="text-gray-500 mt-1">
                              Last update: {new Date(postAccidentLatest.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No post‑accident data yet</p>
                        )}
                      </div>
                    )}

                    {geocodingLoading ? (
                      <p className="text-xs text-gray-400 mt-1">Loading location info...</p>
                    ) : geocodingError ? (
                      <p className="text-xs text-red-400 mt-1">Error: {geocodingError}</p>
                    ) : locationInfo ? (
                      <div className="mt-2 text-sm text-gray-300">
                        <p className="font-medium text-white">📍 {locationInfo.display_name}</p>
                        <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                          {locationInfo.road && <div><span className="text-gray-400">Road:</span> {locationInfo.road}</div>}
                          {locationInfo.city && <div><span className="text-gray-400">City:</span> {locationInfo.city}</div>}
                          {locationInfo.suburb && <div><span className="text-gray-400">Suburb:</span> {locationInfo.suburb}</div>}
                          {locationInfo.neighbourhood && <div><span className="text-gray-400">Neighbourhood:</span> {locationInfo.neighbourhood}</div>}
                        </div>
                        {/* Nearby places */}
                        {(nearbyPlaces.hospitals.length > 0 || nearbyPlaces.police.length > 0 || nearbyPlaces.fire.length > 0) && (
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <p className="text-xs font-semibold text-gray-300">Nearby:</p>
                            {nearbyPlaces.hospitals.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs text-red-400">🏥 Hospitals</p>
                                <ul className="list-disc list-inside text-xs text-gray-400">
                                  {nearbyPlaces.hospitals.map((h, i) => (
                                    <li key={i}>{h.name} ({(h.distance/1000).toFixed(1)} km)</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {nearbyPlaces.police.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs text-blue-400">🚔 Police</p>
                                <ul className="list-disc list-inside text-xs text-gray-400">
                                  {nearbyPlaces.police.map((p, i) => (
                                    <li key={i}>{p.name} ({(p.distance/1000).toFixed(1)} km)</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {nearbyPlaces.fire.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs text-orange-400">🔥 Fire Stations</p>
                                <ul className="list-disc list-inside text-xs text-gray-400">
                                  {nearbyPlaces.fire.map((f, i) => (
                                    <li key={i}>{f.name} ({(f.distance/1000).toFixed(1)} km)</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">No address info available</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedMarker(null)} className="text-gray-400 hover:text-gray-300">✕</button>
                </div>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500 flex justify-between">
              <span>Last updated: {lastUpdated?.toLocaleTimeString() || 'N/A'}</span>
              <button onClick={() => window.location.reload()} className="text-blue-400 hover:underline">
                <MdRefresh className="inline mr-1" /> Refresh
              </button>
            </div>
          </div>

          {/* Incidents Panel */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white flex items-center mb-4">
              <IoMdWarning className="text-yellow-500 mr-2" />
              RECENT INCIDENTS
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {recentIncidents.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent incidents</p>
              ) : (
                recentIncidents.map(incident => (
                  <div
                    key={incident.id}
                    className="p-3 bg-gray-700 rounded-lg border border-gray-600 hover:shadow cursor-pointer transition"
                    onClick={() => {
                      setMapCenter([incident.lat, incident.lng]);
                      setSelectedMarker({ ...incident, type: 'accident' });
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${getSeverityColor(incident.severity)}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="font-semibold text-sm text-white">{incident.title}</p>
                          <span className="text-xs text-gray-400">{incident.time}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{incident.details}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          {incident.units.includes('Ambulance') && <FaAmbulance className="text-red-400 text-xs" />}
                          {incident.units.includes('Fire Truck') && <GiFireExtinguisher className="text-orange-400 text-xs" />}
                          <span className="text-xs px-2 py-0.5 bg-blue-900 text-blue-300 rounded-full">
                            {incident.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-700">
              <button
                onClick={() => navigate('/accident-reports')}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition"
              >
                View All Accident Reports
              </button>
            </div>
          </div>
        </div>

        {/* Live Vehicle Data Table */}
        <div className="mt-6 bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center mb-4">
            <FaList className="text-blue-400 mr-2" />
            LIVE VEHICLE DATA
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Blackbox ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Speed (km/h)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Accel (g)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tilt (°)</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fire</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Human</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-4 text-center text-gray-500">No vehicle data</td>
                  </tr>
                ) : (
                  vehicles.map(v => (
                    <tr key={v.blackbox_id} className={`hover:bg-gray-700 ${v.fire_detected ? 'bg-red-900/30' : ''}`}>
                      <td className="px-4 py-2 text-sm font-mono text-gray-300">{v.blackbox_id}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{v.latitude.toFixed(4)}, {v.longitude.toFixed(4)}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{v.speed_kmph.toFixed(1)}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{v.acceleration_g.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{v.tilt_degree.toFixed(1)}</td>
                      <td className="px-4 py-2 text-sm">{v.fire_detected ? '🔥 Yes' : 'No'}</td>
                      <td className="px-4 py-2 text-sm text-gray-300">{v.human_presence ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{new Date(v.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions - Floating Button to Traffic Management */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => navigate('/traffic-management')}
            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-green-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105"
          >
            <FaTrafficLight className="text-2xl" />
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;