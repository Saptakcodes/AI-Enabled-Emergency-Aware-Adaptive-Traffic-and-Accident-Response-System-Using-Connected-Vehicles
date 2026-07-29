// src/services/insuranceApi.js
import API from '../api';

/**
 * Trigger generation of an insurance report for an accident.
 * @param {string} accidentId - The MongoDB ObjectId of the accident.
 * @returns {Promise} - { message, report_id }
 */
export const generateInsuranceReport = async (accidentId) => {
  const response = await API.post(`/insurance/generate/${accidentId}`);
  return response.data;
};

/**
 * Get an existing insurance report by report_id.
 * @param {string} reportId - The report ID (e.g., "INS-ABC123")
 * @returns {Promise} - Full insurance report data.
 */
export const getInsuranceReport = async (reportId) => {
  const response = await API.get(`/insurance/report/${reportId}`);
  return response.data;
};

/**
 * Download the PDF version of an insurance report.
 * @param {string} reportId - The report ID.
 * @returns {string} - The download URL.
 */
export const downloadInsurancePDF = (reportId) => {
  return `${API.defaults.baseURL}/insurance/report/${reportId}/download`;
};

/**
 * Get the claim readiness checklist for an accident.
 * @param {string} accidentId - The accident ID.
 * @returns {Promise} - { items, completed, total, percentage }
 */
export const getChecklist = async (accidentId) => {
  const response = await API.get(`/insurance/checklist/${accidentId}`);
  return response.data;
};

/**
 * Get the AI-generated summary for an accident.
 * @param {string} accidentId - The accident ID.
 * @returns {Promise} - { summary: string }
 */
export const getSummary = async (accidentId) => {
  const response = await API.get(`/insurance/summary/${accidentId}`);
  return response.data;
};

/**
 * Get the incident timeline for an accident.
 * @param {string} accidentId - The accident ID.
 * @returns {Promise} - { timeline: [] }
 */
export const getTimeline = async (accidentId) => {
  const response = await API.get(`/insurance/timeline/${accidentId}`);
  return response.data;
};