// src/hooks/useAccidentData.js
import { useState, useEffect } from 'react';
import API from '../api';
import { getSummary, getTimeline, getChecklist } from '../services/insuranceApi';

export const useAccidentData = (accidentId) => {
  const [accident, setAccident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!accidentId) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch accident details
        const accidentRes = await API.get(`/accident/${accidentId}`);
        setAccident(accidentRes.data);

        // Fetch AI summary, timeline, checklist
        const [summaryRes, timelineRes, checklistRes] = await Promise.all([
          getSummary(accidentId),
          getTimeline(accidentId),
          getChecklist(accidentId),
        ]);
        setSummary(summaryRes.summary);
        setTimeline(timelineRes.timeline);
        setChecklist(checklistRes);

        // Check if report already exists
        if (accidentRes.data.insurance_report_id) {
          const reportRes = await API.get(`/insurance/report/${accidentRes.data.insurance_report_id}`);
          setReport(reportRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch accident data', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [accidentId]);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const res = await API.post(`/insurance/generate/${accidentId}`);
      // Poll or wait for generation; for simplicity, we'll fetch again after a delay
      setTimeout(async () => {
        const updatedAccident = await API.get(`/accident/${accidentId}`);
        if (updatedAccident.data.insurance_report_id) {
          const reportRes = await API.get(`/insurance/report/${updatedAccident.data.insurance_report_id}`);
          setReport(reportRes.data);
        }
        setReportLoading(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to generate report', err);
      setReportLoading(false);
    }
  };

  return {
    accident,
    loading,
    error,
    summary,
    timeline,
    checklist,
    report,
    reportLoading,
    generateReport,
  };
};