import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaAmbulance, 
  FaBell, 
  FaUserCircle,
  FaMapMarkerAlt,
  FaTrafficLight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaUser,
  FaPhoneAlt,
  FaFileAlt,
  FaChevronDown,
  FaSatellite,
  FaCar
} from 'react-icons/fa';
import { 
  MdEmergency, 
  MdHealthAndSafety,
  MdRefresh
} from 'react-icons/md';
import { IoMdWarning, IoMdInformation } from 'react-icons/io';
import { BsLightningChargeFill } from 'react-icons/bs';
import { GiPoliceBadge, GiFireFlower, GiFireExtinguisher } from 'react-icons/gi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('normal');
  const [liveTime, setLiveTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mapType, setMapType] = useState('emergency');
  const [selectedIncident, setSelectedIncident] = useState(null);
  
  // User data from localStorage
  const [userData, setUserData] = useState({
    name: 'User',
    email: '',
    role: 'normal',
    avatar: '',
    vehicleNumber: '',
    phone: ''
  });

  // Load user data from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserData({
          name: parsedUser.name || 'User',
          email: parsedUser.email || '',
          role: parsedUser.role || 'normal',
          avatar: parsedUser.avatar || `https://ui-avatars.com/api/?name=${parsedUser.name || 'User'}&background=3B82F6&color=fff&size=128`,
          vehicleNumber: parsedUser.vehicleNumber || '',
          phone: parsedUser.phone || ''
        });
        setUserRole(parsedUser.role || 'normal');
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  // Stats data
  const [statsData] = useState({
    activeEmergencies: 3,
    previousEmergencies: 1,
    responseTime: 2.5,
    previousResponseTime: 3.7,
    todayIncidents: 12,
    yesterdayIncidents: 7,
    systemHealth: 98,
    systemStatus: 'Optimal'
  });

  // Animated stats
  const [animatedStats, setAnimatedStats] = useState({
    activeEmergencies: 0,
    responseTime: 0,
    todayIncidents: 0,
    systemHealth: 0
  });

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
        activeEmergencies: Math.round(statsData.activeEmergencies * progress),
        responseTime: (statsData.responseTime * progress).toFixed(1),
        todayIncidents: Math.round(statsData.todayIncidents * progress),
        systemHealth: Math.round(statsData.systemHealth * progress)
      });

      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          activeEmergencies: statsData.activeEmergencies,
          responseTime: statsData.responseTime,
          todayIncidents: statsData.todayIncidents,
          systemHealth: statsData.systemHealth
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // Live time update
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock recent incidents data
  const recentIncidents = [
    {
      id: 1,
      severity: 'critical',
      title: 'Accident @ Junction A',
      time: 'now',
      details: 'Multi-vehicle collision',
      units: ['Ambulance', 'Police'],
      status: 'dispatched'
    },
    {
      id: 2,
      severity: 'medium',
      title: 'Fire @ Sector 5',
      time: '2m ago',
      details: 'Building fire',
      units: ['Fire Truck'],
      status: 'responding'
    },
    {
      id: 3,
      severity: 'low',
      title: 'Medical Emergency',
      time: '5m ago',
      details: 'Heart attack',
      units: ['Ambulance'],
      status: 'arrived'
    },
    {
      id: 4,
      severity: 'resolved',
      title: 'Traffic Violation',
      time: '10m ago',
      details: 'Speed violation',
      units: ['Police'],
      status: 'resolved'
    }
  ];

  // Mock fleet data
  const fleetData = {
    ambulances: {
      total: 6,
      active: 4,
      vehicles: [
        { id: '#234', status: 'active', location: 'Accident Site', eta: '2min' },
        { id: '#235', status: 'active', location: 'Hospital', eta: '5min' },
        { id: '#236', status: 'available', location: 'Station' },
        { id: '#237', status: 'available', location: 'Station' }
      ]
    },
    police: {
      total: 10,
      active: 8,
      vehicles: [
        { id: '#12', status: 'active', location: 'Traffic Control' },
        { id: '#14', status: 'active', location: 'Accident Site' },
        { id: '#15', status: 'available', location: 'Patrol' }
      ]
    },
    fire: {
      total: 3,
      active: 2,
      vehicles: [
        { id: '#01', status: 'active', location: 'Fire @ Sector 5' },
        { id: '#02', status: 'available', location: 'Station' }
      ]
    }
  };

  // Mock traffic signals data
  const trafficSignals = [
    { id: 'A', name: 'Junction A', status: 'green', timer: 45, density: 23, emergency: '🚑' },
    { id: 'B', name: 'Junction B', status: 'red', timer: 30, density: 45, emergency: null },
    { id: 'C', name: 'Junction C', status: 'yellow', timer: 5, density: 12, emergency: null },
    { id: 'D', name: 'Junction D', status: 'green', timer: 60, density: 8, emergency: null }
  ];

  // Mock notifications
  const notifications = [
    { id: 1, type: 'warning', message: 'Heavy traffic detected at Junction B', time: '1m ago' },
    { id: 2, type: 'success', message: 'Ambulance #234 arrived at destination', time: '3m ago' },
    { id: 3, type: 'emergency', message: 'New accident reported at Sector 7', time: '5m ago' },
    { id: 4, type: 'info', message: 'System update completed successfully', time: '10m ago' }
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'critical': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      case 'resolved': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <FaAmbulance className="animate-pulse text-red-500" />;
      case 'available': return <FaCheckCircle className="text-green-500" />;
      case 'maintenance': return <FaExclamationTriangle className="text-yellow-500" />;
      default: return <FaCar className="text-blue-500" />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-x-hidden">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <MdEmergency className="text-2xl sm:text-3xl text-red-500 animate-pulse" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent">
                ALERT
              </span>
              <span className="text-gray-400 text-xs hidden lg:inline">AI Emergency Response</span>
            </div>

            {/* Live Indicator and User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="flex items-center space-x-1 sm:space-x-2 bg-red-500/20 px-2 sm:px-3 py-1 rounded-full">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-semibold text-red-500">LIVE</span>
                <span className="text-xs text-gray-300 hidden sm:inline">{liveTime.toLocaleTimeString()}</span>
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 sm:p-2 hover:bg-gray-700 rounded-full transition-colors"
                >
                  <FaBell className="text-lg sm:text-xl text-gray-300" />
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-ping"></span>
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <button className="text-xs text-blue-400 hover:text-blue-300">Clear all</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-3 hover:bg-gray-700 border-b border-gray-700 last:border-0">
                          <div className="flex items-start space-x-3">
                            {notif.type === 'emergency' && <MdEmergency className="text-red-500 mt-1 text-sm" />}
                            {notif.type === 'warning' && <IoMdWarning className="text-yellow-500 mt-1 text-sm" />}
                            {notif.type === 'success' && <FaCheckCircle className="text-green-500 mt-1 text-sm" />}
                            {notif.type === 'info' && <IoMdInformation className="text-blue-500 mt-1 text-sm" />}
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm">{notif.message}</p>
                              <span className="text-xs text-gray-400">{notif.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 hover:bg-gray-700 rounded-lg p-1.5 sm:p-2 transition-colors"
                >
                  <div className="relative">
                    {userData.avatar ? (
                      <img 
                        src={userData.avatar} 
                        alt={userData.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-600"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${userData.name}&background=3B82F6&color=fff&size=128`;
                        }}
                      />
                    ) : (
                      <FaUserCircle className="text-2xl sm:text-3xl text-gray-300" />
                    )}
                    <span className={`absolute bottom-0 right-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      userData.role === 'ambulance' ? 'bg-red-500' : 
                      userData.role === 'police' ? 'bg-blue-500' :
                      userData.role === 'fire' ? 'bg-orange-500' : 'bg-green-500'
                    }`}></span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs sm:text-sm font-semibold">{userData.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{userData.role}</p>
                  </div>
                  <FaChevronDown className="text-xs text-gray-400" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
                    <div className="py-1">
                      <div className="px-3 sm:px-4 py-2 border-b border-gray-700">
                        <p className="text-xs text-gray-400 truncate">{userData.email}</p>
                        {userData.vehicleNumber && (
                          <p className="text-xs text-gray-500 mt-1">Vehicle: {userData.vehicleNumber}</p>
                        )}
                      </div>
                      <button className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 text-sm">
                        <FaUser className="text-xs" />
                        <span>Profile</span>
                      </button>
                      <button className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 text-sm">
                        <FaCog className="text-xs" />
                        <span>Settings</span>
                      </button>
                      <hr className="border-gray-700 my-1" />
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-700 flex items-center space-x-2 text-red-400 text-sm"
                      >
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

      {/* Main Content */}
      <main className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Active Emergencies Card */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-red-500/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-red-400 text-xs sm:text-sm flex items-center">
                  <MdEmergency className="mr-1 text-sm" /> ACTIVE
                </p>
                <p className="text-2xl sm:text-4xl font-bold text-white mt-1 sm:mt-2">{animatedStats.activeEmergencies}</p>
                <p className="text-xs sm:text-sm text-green-400 mt-1 sm:mt-2 flex items-center">
                  <FaChartLine className="mr-1 text-xs" /> +2 from last hr
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <MdEmergency className="text-lg sm:text-2xl text-red-500" />
              </div>
            </div>
          </div>

          {/* Response Time Card */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-500/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-400 text-xs sm:text-sm flex items-center">
                  <FaClock className="mr-1 text-sm" /> RESPONSE
                </p>
                <p className="text-2xl sm:text-4xl font-bold text-white mt-1 sm:mt-2">{animatedStats.responseTime}s</p>
                <p className="text-xs sm:text-sm text-green-400 mt-1 sm:mt-2 flex items-center">
                  <FaChartLine className="mr-1 text-xs" /> -1.2s avg
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FaClock className="text-lg sm:text-2xl text-blue-500" />
              </div>
            </div>
          </div>

          {/* Today's Incidents Card */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-yellow-500/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-yellow-400 text-xs sm:text-sm flex items-center">
                  <IoMdWarning className="mr-1 text-sm" /> INCIDENTS
                </p>
                <p className="text-2xl sm:text-4xl font-bold text-white mt-1 sm:mt-2">{animatedStats.todayIncidents}</p>
                <p className="text-xs sm:text-sm text-yellow-400 mt-1 sm:mt-2 flex items-center">
                  <FaChartLine className="mr-1 text-xs" /> +5 yesterday
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <IoMdWarning className="text-lg sm:text-2xl text-yellow-500" />
              </div>
            </div>
          </div>

          {/* System Health Card */}
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-green-500/20 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-400 text-xs sm:text-sm flex items-center">
                  <MdHealthAndSafety className="mr-1 text-sm" /> HEALTH
                </p>
                <p className="text-2xl sm:text-4xl font-bold text-white mt-1 sm:mt-2">{animatedStats.systemHealth}%</p>
                <p className="text-xs sm:text-sm text-green-400 mt-1 sm:mt-2">Optimal</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <MdHealthAndSafety className="text-lg sm:text-2xl text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Map Section - Takes 2 columns */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg font-semibold flex items-center">
                <FaMapMarkerAlt className="text-red-500 mr-2 text-sm sm:text-base" />
                LIVE MAP
              </h2>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <button 
                  onClick={() => setMapType('satellite')}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                    mapType === 'satellite' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <FaSatellite className="inline mr-1 text-xs" /> Sat
                </button>
                <button 
                  onClick={() => setMapType('traffic')}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                    mapType === 'traffic' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <FaCar className="inline mr-1 text-xs" /> Traffic
                </button>
                <button 
                  onClick={() => setMapType('emergency')}
                  className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors ${
                    mapType === 'emergency' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <MdEmergency className="inline mr-1 text-xs" /> Emerg
                </button>
              </div>
            </div>

            {/* Map Visualization */}
            <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-gray-700">
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-6">
                {[...Array(48)].map((_, i) => (
                  <div key={i} className="border border-gray-700/20"></div>
                ))}
              </div>

              {/* Map Markers */}
              <div className="absolute top-1/4 left-1/4 animate-bounce">
                <div className="relative">
                  <FaAmbulance className="text-lg sm:text-2xl text-red-500" />
                  <span className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                    Amb #234 • 2min
                  </span>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2">
                <div className="relative">
                  <GiPoliceBadge className="text-lg sm:text-2xl text-blue-500 animate-pulse" />
                  <span className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                    Police #12
                  </span>
                </div>
              </div>

              <div className="absolute bottom-1/4 right-1/3">
                <div className="relative">
                  <GiFireFlower className="text-lg sm:text-2xl text-orange-500 animate-ping" />
                  <span className="absolute -top-6 sm:-top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                    Fire @ S5
                  </span>
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex flex-col space-y-1 sm:space-y-2">
                <button className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors text-sm sm:text-base">
                  +
                </button>
                <button className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors text-sm sm:text-base">
                  -
                </button>
              </div>
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center">
                <IoMdWarning className="text-yellow-500 mr-2 text-sm sm:text-base" />
                INCIDENTS
              </h2>
              <button className="text-xs sm:text-sm text-blue-400 hover:text-blue-300">View</button>
            </div>

            <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto pr-1 sm:pr-2">
              {recentIncidents.map(incident => (
                <div 
                  key={incident.id} 
                  className="bg-gray-700/50 rounded-lg p-2 sm:p-3 hover:bg-gray-700 transition-all cursor-pointer"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-start space-x-2 sm:space-x-3">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 ${getSeverityColor(incident.severity)} animate-pulse flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-semibold text-xs sm:text-sm truncate">{incident.title}</p>
                        <span className="text-xs text-gray-400 flex-shrink-0">{incident.time}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">{incident.details}</p>
                      <div className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2">
                        {incident.units.includes('Ambulance') && (
                          <FaAmbulance className="text-xs text-red-400" />
                        )}
                        {incident.units.includes('Police') && (
                          <GiPoliceBadge className="text-xs text-blue-400" />
                        )}
                        {incident.units.includes('Fire Truck') && (
                          <GiFireExtinguisher className="text-xs text-orange-400" />
                        )}
                        <span className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
                          incident.status === 'dispatched' ? 'bg-yellow-500/20 text-yellow-400' :
                          incident.status === 'responding' ? 'bg-blue-500/20 text-blue-400' :
                          incident.status === 'arrived' ? 'bg-green-500/20 text-green-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Fleet Status */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold flex items-center">
                <FaAmbulance className="text-red-500 mr-2 text-sm sm:text-base" />
                FLEET
              </h2>
              <button className="text-xs sm:text-sm text-blue-400 hover:text-blue-300">
                <MdRefresh className="inline mr-1 text-xs" /> Refresh
              </button>
            </div>

            {/* Ambulances */}
            <div className="mb-3 sm:mb-4">
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <p className="text-xs sm:text-sm text-red-400 flex items-center">
                  <FaAmbulance className="mr-1 text-xs" /> AMB
                </p>
                <p className="text-xs">{fleetData.ambulances.active}/{fleetData.ambulances.total}</p>
              </div>
              <div className="w-full h-1 bg-gray-700 rounded-full mb-2 sm:mb-3">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${(fleetData.ambulances.active / fleetData.ambulances.total) * 100}%` }}
                ></div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {fleetData.ambulances.vehicles.map(vehicle => (
                  <div key={vehicle.id} className="flex items-center justify-between text-xs bg-gray-700/30 p-1.5 sm:p-2 rounded">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {getStatusIcon(vehicle.status)}
                      <span>{vehicle.id}</span>
                    </div>
                    <span className="text-gray-400 truncate max-w-[60px] sm:max-w-none">{vehicle.location}</span>
                    {vehicle.eta && <span className="text-green-400 text-xs">{vehicle.eta}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Police */}
            <div className="mb-3 sm:mb-4">
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <p className="text-xs sm:text-sm text-blue-400 flex items-center">
                  <GiPoliceBadge className="mr-1 text-xs" /> POLICE
                </p>
                <p className="text-xs">{fleetData.police.active}/{fleetData.police.total}</p>
              </div>
              <div className="w-full h-1 bg-gray-700 rounded-full mb-2 sm:mb-3">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(fleetData.police.active / fleetData.police.total) * 100}%` }}
                ></div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {fleetData.police.vehicles.map(vehicle => (
                  <div key={vehicle.id} className="flex items-center justify-between text-xs bg-gray-700/30 p-1.5 sm:p-2 rounded">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {getStatusIcon(vehicle.status)}
                      <span>{vehicle.id}</span>
                    </div>
                    <span className="text-gray-400 truncate max-w-[70px] sm:max-w-none">{vehicle.location}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fire Trucks */}
            <div>
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <p className="text-xs sm:text-sm text-orange-400 flex items-center">
                  <GiFireExtinguisher className="mr-1 text-xs" /> FIRE
                </p>
                <p className="text-xs">{fleetData.fire.active}/{fleetData.fire.total}</p>
              </div>
              <div className="w-full h-1 bg-gray-700 rounded-full mb-2 sm:mb-3">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(fleetData.fire.active / fleetData.fire.total) * 100}%` }}
                ></div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {fleetData.fire.vehicles.map(vehicle => (
                  <div key={vehicle.id} className="flex items-center justify-between text-xs bg-gray-700/30 p-1.5 sm:p-2 rounded">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {getStatusIcon(vehicle.status)}
                      <span>{vehicle.id}</span>
                    </div>
                    <span className="text-gray-400 truncate max-w-[80px] sm:max-w-none">{vehicle.location}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Signals Section */}
        <div className="mt-4 sm:mt-6 bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold flex items-center">
              <FaTrafficLight className="text-green-500 mr-2 text-sm sm:text-base" />
              TRAFFIC SIGNALS
            </h2>
            <button className="px-2 sm:px-3 py-1 bg-blue-500 rounded-lg text-xs sm:text-sm hover:bg-blue-600 transition-colors">
              Manual Override
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {trafficSignals.map(signal => (
              <div key={signal.id} className="bg-gray-700/30 rounded-lg p-2 sm:p-4">
                <div className="flex justify-between items-center mb-2 sm:mb-3">
                  <h3 className="font-semibold text-xs sm:text-sm">{signal.name}</h3>
                  <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                    signal.status === 'green' ? 'bg-green-500 animate-pulse' :
                    signal.status === 'yellow' ? 'bg-yellow-500 animate-pulse' :
                    'bg-red-500 animate-pulse'
                  }`}></div>
                </div>
                <div className="flex justify-between items-center text-xs mb-1 sm:mb-2">
                  <span className="text-gray-400">Signal:</span>
                  <span className={`font-semibold ${
                    signal.status === 'green' ? 'text-green-500' :
                    signal.status === 'yellow' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {signal.timer}s
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs mb-1 sm:mb-2">
                  <span className="text-gray-400">Density:</span>
                  <span className="font-semibold">{signal.density}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Emergency:</span>
                  <span className="font-semibold">{signal.emergency || '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="mt-4 sm:mt-6 bg-gray-800/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-semibold flex items-center">
              <FaBell className="text-yellow-500 mr-2 text-sm sm:text-base" />
              ALERTS
            </h2>
            <button className="text-xs sm:text-sm text-blue-400 hover:text-blue-300">Clear</button>
          </div>
          <div className="space-y-1 sm:space-y-2">
            {notifications.map(notif => (
              <div key={notif.id} className="flex items-start space-x-2 sm:space-x-3 bg-gray-700/30 p-2 sm:p-3 rounded-lg">
                {notif.type === 'emergency' && <MdEmergency className="text-red-500 mt-0.5 text-sm flex-shrink-0" />}
                {notif.type === 'warning' && <IoMdWarning className="text-yellow-500 mt-0.5 text-sm flex-shrink-0" />}
                {notif.type === 'success' && <FaCheckCircle className="text-green-500 mt-0.5 text-sm flex-shrink-0" />}
                {notif.type === 'info' && <IoMdInformation className="text-blue-500 mt-0.5 text-sm flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm truncate">{notif.message}</p>
                  <span className="text-xs text-gray-400">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Quick Actions Floating Panel */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <div className="relative group">
          <button className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300">
            <BsLightningChargeFill className="text-lg sm:text-2xl text-white" />
          </button>
          
          <div className="absolute bottom-12 sm:bottom-16 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-40 sm:w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
            <div className="py-1 sm:py-2">
              <button className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gray-700 flex items-center space-x-2 text-xs sm:text-sm">
                <MdEmergency className="text-red-500 text-xs sm:text-sm" />
                <span>New Emergency</span>
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gray-700 flex items-center space-x-2 text-xs sm:text-sm">
                <FaAmbulance className="text-blue-500 text-xs sm:text-sm" />
                <span>Dispatch</span>
              </button>
              <button className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gray-700 flex items-center space-x-2 text-xs sm:text-sm">
                <FaTrafficLight className="text-yellow-500 text-xs sm:text-sm" />
                <span>Override</span>
              </button>
              <hr className="border-gray-700 my-1" />
              <button className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gray-700 flex items-center space-x-2 text-xs sm:text-sm">
                <FaPhoneAlt className="text-purple-500 text-xs sm:text-sm" />
                <span>Contact</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;