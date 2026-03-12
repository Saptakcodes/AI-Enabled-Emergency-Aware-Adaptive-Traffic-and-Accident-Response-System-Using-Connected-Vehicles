// src/components/ClaimDeviceModal.jsx
import { useState } from 'react';
import ReactDOM from 'react-dom';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const ClaimDeviceModal = ({ isOpen, onClose, onSuccess }) => {
  const [blackboxId, setBlackboxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await API.post('/devices/claim', { blackbox_id: blackboxId });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Claim failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Claim Your Device</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter the blackbox ID shown on your device. Your vehicle details will be automatically linked from your profile.
          </p>

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
                You can find this ID on the device label or in the serial monitor output.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
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
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ClaimDeviceModal;