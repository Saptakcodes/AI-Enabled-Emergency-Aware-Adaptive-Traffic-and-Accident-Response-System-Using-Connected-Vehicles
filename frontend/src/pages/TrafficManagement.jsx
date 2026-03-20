// src/pages/TrafficManagement.jsx
import React from 'react';

const TrafficManagement = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1>Traffic Management Page (under construction)</h1>
      <button 
        onClick={() => window.history.back()} 
        className="mt-4 px-4 py-2 bg-blue-600 rounded"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default TrafficManagement;