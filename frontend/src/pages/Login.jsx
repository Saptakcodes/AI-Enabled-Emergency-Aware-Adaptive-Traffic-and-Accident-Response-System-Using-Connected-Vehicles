// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import API from "../api";
import AuthLayout from "../components/auth/AuthLayout";

const Login = () => {
  const navigate = useNavigate();

  // STATE from OLD Login.jsx (EXACT match)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // UI state (for loading and error)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // handleChange from OLD Login.jsx (EXACT match)
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  // Updated handleSubmit to store user data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/login", formData);

      // Store token
      localStorage.setItem("token", res.data.access_token);
      
      // Store user data from login response
      const userData = {
        name: res.data.user_name || formData.email.split('@')[0],
        role: res.data.user_role || 'normal',
        email: formData.email,
        avatar: `https://ui-avatars.com/api/?name=${res.data.user_name || formData.email.split('@')[0]}&background=3B82F6&color=fff&size=128`
      };
      localStorage.setItem("user", JSON.stringify(userData));

      alert("Login successful 🚀");
      navigate("/dashboard");

    } catch (error) {
      setError(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Access your emergency response dashboard and continue saving lives."
    >
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            Login to ALERT
          </h2>
          <p className="text-gray-600 mt-2">
            Your gateway to intelligent emergency response
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-red-600 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          {/* Emergency Services Indicator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Emergency Services</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Ambulance</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Police</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Fire</span>
            </div>
          </div>
        </form>

        {/* Signup Link */}
        <p className="text-center mt-8 text-gray-600">
          New to ALERT?{" "}
          <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default Login;