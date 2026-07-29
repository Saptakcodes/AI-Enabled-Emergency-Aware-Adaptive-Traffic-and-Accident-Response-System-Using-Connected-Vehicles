// src/components/insurance/PDFDownloadButton.jsx
import React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import API from '../../api';

const PDFDownloadButton = ({ reportId, className = '' }) => {
  const handleDownload = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please login first.");
      return;
    }

    const baseURL = API.defaults?.baseURL || 
                    import.meta.env.VITE_API_URL || 
                    'https://ai-enabled-emergency-aware-adaptive.onrender.com';
    const url = `${baseURL}/insurance/report/${reportId}?download=true`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed (${response.status}): ${errorText}`);
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `insurance_report_${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download PDF. Please try again.');
    }
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