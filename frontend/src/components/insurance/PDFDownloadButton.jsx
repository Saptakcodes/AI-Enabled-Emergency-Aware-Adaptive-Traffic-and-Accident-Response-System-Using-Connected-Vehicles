// src/components/insurance/PDFDownloadButton.jsx
import React from 'react';
import { FaFilePdf } from 'react-icons/fa';
import { downloadInsurancePDF } from '../../services/insuranceApi';

const PDFDownloadButton = ({ reportId, className = '' }) => {
  const handleDownload = () => {
    const url = downloadInsurancePDF(reportId);
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