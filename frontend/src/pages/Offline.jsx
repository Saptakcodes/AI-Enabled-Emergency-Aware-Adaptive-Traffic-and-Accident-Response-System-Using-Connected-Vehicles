import React from 'react';

const Offline = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
        <div className="mb-6">
          <svg className="w-24 h-24 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636A9 9 0 010 15.364m14.85-2.829a5 5 0 00-7.07 0M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-6">
          Don't worry! ALERT app has cached emergency data and will sync when you're back online.
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h2 className="font-semibold text-yellow-800">📱 Cached Emergency Data</h2>
            <p className="text-sm text-yellow-600 mt-1">Last known traffic conditions and emergency protocols available</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Reconnecting
          </button>
        </div>
      </div>
    </div>
  );
};

export default Offline;