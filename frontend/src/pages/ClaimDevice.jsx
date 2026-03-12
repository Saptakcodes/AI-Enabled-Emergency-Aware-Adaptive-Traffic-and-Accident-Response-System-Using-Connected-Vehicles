// src/pages/ClaimDevice.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

const ClaimDevice = () => {
  const navigate = useNavigate();
  const [blackboxId, setBlackboxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/devices/claim', { blackbox_id: blackboxId });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Claim failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-800"
        >
          <FaArrowLeft className="mr-2" /> Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
            <FaShieldAlt className="text-3xl text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Claim Your Device
          </h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Enter the blackbox ID shown on your device.<br />
            Your vehicle details will be linked automatically.
          </p>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
              ✅ Device claimed successfully! Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blackbox ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={blackboxId}
                onChange={(e) => setBlackboxId(e.target.value)}
                required
                placeholder="e.g. ATSAD-38182B8BA450"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                You can find this ID on the device label or in the serial monitor.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Claiming...
                </>
              ) : (
                'Claim Device'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ClaimDevice;