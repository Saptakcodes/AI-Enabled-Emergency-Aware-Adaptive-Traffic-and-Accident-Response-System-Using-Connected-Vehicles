// src/components/insurance/InsuranceReportModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaTimes,
  FaFilePdf,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import PDFDownloadButton from './PDFDownloadButton';
import AccidentSummaryCard from './AccidentSummaryCard';
import ClaimReadinessChecklist from './ClaimReadinessChecklist';
import IncidentTimeline from './IncidentTimeline';

const InsuranceReportModal = ({ isOpen, onClose, report, accident }) => {
  if (!isOpen || !report) return null;

  const statusColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500';
      case 'severe': return 'text-orange-500';
      case 'moderate': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-700"
        >
          <div className="flex justify-between items-center sticky top-0 bg-gray-800/90 backdrop-blur-sm py-2 z-10">
            <h2 className="text-2xl font-bold text-white">Insurance Report</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition">
              <FaTimes className="text-gray-400 text-xl" />
            </button>
          </div>

          <div className="space-y-6 mt-4">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-gray-700">
              <div>
                <p className="text-xs text-gray-400">Report ID</p>
                <p className="text-sm font-mono text-white">{report.report_id}</p>
                <p className="text-xs text-gray-400 mt-1">Case #{report.case_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Generated</p>
                <p className="text-sm text-gray-300">{new Date(report.generated_at).toLocaleString()}</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${statusColor(report.accident_severity)} bg-opacity-10`}>
                  {report.accident_severity.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Vehicle & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Vehicle</p>
                <p className="text-white font-medium">{report.vehicle_number}</p>
                <p className="text-sm text-gray-400">{report.vehicle_type}</p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-white text-sm">{report.full_address}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {report.gps_coordinates.latitude}, {report.gps_coordinates.longitude}
                </p>
              </div>
            </div>

            {/* Summary */}
            <AccidentSummaryCard summary={report.ai_summary} />

            {/* Sensor Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-700/30 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">Speed</p>
                <p className="text-lg font-bold text-white">{report.vehicle_speed} km/h</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">G‑Force</p>
                <p className="text-lg font-bold text-white">{report.max_g_force} g</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">Tilt</p>
                <p className="text-lg font-bold text-white">{report.max_tilt}°</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-400">AI Confidence</p>
                <p className="text-lg font-bold text-white">{Math.round(report.ai_confidence * 100)}%</p>
              </div>
            </div>

            {/* Occupant & Fire Status */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${report.human_presence ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-gray-300">Human: {report.human_presence ? 'Present' : 'Absent'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${report.breathing_status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-gray-300">Breathing: {report.breathing_status ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${report.fire_detected ? 'bg-red-500' : 'bg-green-500'}`}></span>
                <span className="text-gray-300">Fire: {report.fire_detected ? 'Detected' : 'None'}</span>
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <ClaimReadinessChecklist checklist={report.checklist} />
            </div>

            {/* Timeline */}
            <div className="bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Incident Timeline</h3>
              <IncidentTimeline events={report.timeline} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
              <PDFDownloadButton reportId={report.report_id} />
              <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition">
                View Full Report
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InsuranceReportModal;