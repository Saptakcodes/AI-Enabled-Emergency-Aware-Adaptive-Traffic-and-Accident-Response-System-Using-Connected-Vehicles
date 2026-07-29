// src/components/insurance/ClaimReadinessChecklist.jsx
import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ClaimReadinessChecklist = ({ checklist }) => {
  if (!checklist || !checklist.items) {
    return <p className="text-gray-500 text-sm">No checklist data available.</p>;
  }

  const { items, completed, total, percentage } = checklist;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">Insurance Claim Readiness</span>
        <span className="text-sm font-bold text-white">{percentage}% Complete</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 text-sm">
            {item.status ? (
              <FaCheckCircle className="text-green-400 flex-shrink-0" />
            ) : (
              <FaTimesCircle className="text-red-400 flex-shrink-0" />
            )}
            <span className={`text-gray-300 ${item.status ? '' : 'opacity-60'}`}>
              {item.item}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {completed} of {total} items complete
      </p>
    </div>
  );
};

export default ClaimReadinessChecklist;