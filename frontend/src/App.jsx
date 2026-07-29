import "./index.css";
import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Offline from "./pages/Offline";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import AccidentReports from './pages/AccidentReports';
import ClaimDevice from './pages/ClaimDevice';
import TrafficManagement from './pages/TrafficManagement';

import AccidentDetailPage from './pages/AccidentDetailPage';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return <Offline />;
  }

  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accident-reports" element={<AccidentReports />} />
        <Route path="/claim-device" element={<ClaimDevice />} />
        <Route path="/traffic-management" element={<TrafficManagement />} />
        <Route path="/accident/:id" element={<AccidentDetailPage />} />
      </Routes>
      <PWAInstallPrompt />
    </div>
  );
}

export default App;