// src/pages/AccidentDetailPage.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccidentData } from '../hooks/useAccidentData';
import {
  FaArrowLeft,
  FaFilePdf,
  FaExclamationTriangle,
  FaSpinner,
} from 'react-icons/fa';
import IncidentTimeline from '../components/insurance/IncidentTimeline';
import ClaimReadinessChecklist from '../components/insurance/ClaimReadinessChecklist';
import AccidentSummaryCard from '../components/insurance/AccidentSummaryCard';
import InsuranceReportModal from '../components/insurance/InsuranceReportModal';
import PDFDownloadButton from '../components/insurance/PDFDownloadButton';

const AccidentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    accident,
    loading,
    error,
    summary,
    timeline,
    checklist,
    report,
    reportLoading,
    generateReport,
  } = useAccidentData(id);

  const [showReportModal, setShowReportModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !accident) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <FaExclamationTriangle className="text-4xl mx-auto mb-4" />
          <p>{error || 'Accident not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <FaArrowLeft className="text-white text-xl" />
            </button>
            <h1 className="text-2xl font-bold text-white">Accident Report</h1>
          </div>
          <div className="flex items-center space-x-3">
            {report ? (
              <>
                <PDFDownloadButton reportId={report.report_id} />
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
                >
                  View Full Report
                </button>
              </>
            ) : (
              <button
                onClick={generateReport}
                disabled={reportLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 rounded-lg text-white font-semibold transition disabled:opacity-50 flex items-center space-x-2"
              >
                {reportLoading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FaFilePdf />
                    <span>Generate Insurance Report</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-400">Vehicle</p>
            <p className="text-white font-medium">{accident.blackbox_id}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-400">Speed</p>
            <p className="text-white font-medium">{accident.speed_kmph} km/h</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-400">G‑Force</p>
            <p className="text-white font-medium">{accident.acceleration_g} g</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-xs text-gray-400">Tilt</p>
            <p className="text-white font-medium">{accident.tilt_degree}°</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Summary</h2>
              <AccidentSummaryCard summary={summary} />
            </div>

            {/* Timeline */}
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Incident Timeline</h2>
              <IncidentTimeline events={timeline} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Checklist</h2>
              <ClaimReadinessChecklist checklist={checklist} />
            </div>

            <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Location</h2>
              <p className="text-sm text-gray-300">
                {accident.latitude.toFixed(6)}, {accident.longitude.toFixed(6)}
              </p>
              <a
                href={`https://www.google.com/maps?q=${accident.latitude},${accident.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-sm"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        {report && (
          <InsuranceReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            report={report}
            accident={accident}
          />
        )}
      </div>
    </div>
  );
};

export default AccidentDetailPage;