// src/components/insurance/IncidentTimeline.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  FaCar,
  FaTachometerAlt,
  FaBrain,
  FaBell,
  FaClock,
  FaTimesCircle,
  FaExclamationTriangle,
  FaPhone,
  FaHospital,
  FaTrafficLight,
  FaRoad,
  FaFileAlt,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';

const iconMap = {
  car: FaCar,
  speed: FaTachometerAlt,
  brain: FaBrain,
  bell: FaBell,
  timer: FaClock,
  close: FaTimesCircle,
  alert: FaExclamationTriangle,
  phone: FaPhone,
  hospital: FaHospital,
  traffic: FaTrafficLight,
  road: FaRoad,
  file: FaFileAlt,
  success: FaCheckCircle,
  warning: FaExclamationCircle,
};

const severityColors = {
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  critical: 'text-red-400',
  success: 'text-green-400',
};

const bgColors = {
  info: 'bg-blue-400/20 border-blue-400',
  warning: 'bg-yellow-400/20 border-yellow-400',
  critical: 'bg-red-400/20 border-red-400',
  success: 'bg-green-400/20 border-green-400',
};

const IncidentTimeline = ({ events }) => {
  if (!events || events.length === 0) {
    return <p className="text-gray-500 text-sm">No timeline events available.</p>;
  }

  return (
    <div className="relative pl-8 border-l-2 border-gray-600 space-y-4">
      {events.map((event, index) => {
        const Icon = iconMap[event.icon] || FaExclamationCircle;
        const severity = event.severity || 'info';
        const time = new Date(event.timestamp).toLocaleTimeString();
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-3 rounded-lg border ${bgColors[severity]} bg-gray-800/30 backdrop-blur-sm`}
          >
            <div className="absolute -left-[2.5rem] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center">
              <Icon className={`${severityColors[severity]} text-sm`} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{event.event}</p>
                <p className="text-xs text-gray-400">{event.description}</p>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default IncidentTimeline;