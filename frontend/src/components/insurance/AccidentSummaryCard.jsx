// src/components/insurance/AccidentSummaryCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

const AccidentSummaryCard = ({ summary }) => {
  if (!summary) {
    return <p className="text-gray-500 text-sm">Summary not available.</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-600"
    >
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Generated Summary</h4>
      <p className="text-sm text-gray-200 leading-relaxed">{summary}</p>
    </motion.div>
  );
};

export default AccidentSummaryCard;