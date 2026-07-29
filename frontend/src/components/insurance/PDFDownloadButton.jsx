// src/components/insurance/PDFDownloadButton.jsx
import React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import API from '../../api';

const PDFDownloadButton = ({ reportId, className = '' }) => {
  const handleDownload = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please login first.");
      return;
    }

    // Get base URL
    const baseURL = API.defaults?.baseURL || 
                    import.meta.env.VITE_API_URL || 
                    'https://ai-enabled-emergency-aware-adaptive.onrender.com';
    
    // Build the full URL with token as query parameter
    const url = `${baseURL}/insurance/report/${reportId}/download?token=${encodeURIComponent(token)}`;
    
    // Log to verify
    console.log("📄 Download URL:", url);
    
    // Open in new tab
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition ${className}`}
    >
      <FaFilePdf />
      <span>Download PDF</span>
    </button>
  );
};

export default PDFDownloadButton;