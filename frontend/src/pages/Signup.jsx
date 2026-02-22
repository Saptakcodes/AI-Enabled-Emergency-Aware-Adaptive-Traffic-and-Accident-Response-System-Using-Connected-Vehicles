// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, Car, Lock, AlertCircle, 
  ArrowRight, Shield, Truck, Flame 
} from "lucide-react";
import API from "../api";
import AuthLayout from "../components/auth/AuthLayout";

const Signup = () => {
  const navigate = useNavigate();
  
  // STATE from OLD Signup.jsx (EXACT match)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleNumber: "",
    vehicleType: "normal",
    password: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  // UI Icons and colors
  const vehicleIcons = {
    normal: <Car className="w-5 h-5" />,
    ambulance: <Truck className="w-5 h-5" />,
    police: <Shield className="w-5 h-5" />,
    fire: <Flame className="w-5 h-5" />,
  };

  const vehicleColors = {
    normal: "bg-gray-100 text-gray-700 border-gray-300",
    ambulance: "bg-red-50 text-red-700 border-red-300",
    police: "bg-blue-50 text-blue-700 border-blue-300",
    fire: "bg-orange-50 text-orange-700 border-orange-300",
  };

  // handleChange from OLD Signup.jsx (EXACT match)
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  // Validation for multi-step
  const validateStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.phone) {
        setError("Please fill all required fields");
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Please enter a valid email");
        return false;
      }
      if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        setError("Please enter a valid 10-digit phone number");
        return false;
      }
    } else if (step === 2) {
      if (!formData.vehicleNumber || !formData.password) {
        setError("Please fill all fields");
        return false;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        return false;
      }
    }
    return true;
  };

  // Multi-step navigation
  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Updated handleSubmit with auto-login
  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Send signup request
      await API.post("/signup", formData);

      // After signup, automatically login
      try {
        const loginRes = await API.post("/login", {
          email: formData.email,
          password: formData.password
        });

        // Store token
        localStorage.setItem("token", loginRes.data.access_token);
        
        // Store user data
        const userData = {
          name: formData.name,
          role: loginRes.data.user_role || formData.vehicleType,
          email: formData.email,
          phone: formData.phone,
          vehicleNumber: formData.vehicleNumber,
          vehicleType: formData.vehicleType,
          avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=3B82F6&color=fff&size=128`
        };
        localStorage.setItem("user", JSON.stringify(userData));

        alert("Signup successful! Redirecting to dashboard... 🎉");
        navigate("/dashboard");
      } catch (loginError) {
        // If auto-login fails, just go to login page
        alert("Signup successful! Please login. 🎉");
        navigate("/login");
      }

    } catch (error) {
      setError(error.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Join ALERT Network"
      subtitle="Register your vehicle and become part of India's smartest emergency response system."
    >
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-gray-600 mt-2">
            Join thousands of connected vehicles
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`relative`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= i 
                    ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > i ? '✓' : i}
                </div>
              </div>
              {i < 3 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > i ? 'bg-gradient-to-r from-blue-600 to-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
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

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Vehicle Info */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                      placeholder="MH01AB1234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(vehicleIcons).map(([type, icon]) => (
                      <label
                        key={type}
                        className={`relative flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          formData.vehicleType === type
                            ? vehicleColors[type]
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="vehicleType"
                          value={type}
                          checked={formData.vehicleType === type}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex flex-col items-center space-y-1">
                          {icon}
                          <span className="text-xs capitalize">{type}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
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

                <div className="text-xs text-gray-600">
                  Password must be at least 8 characters
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-4">Review Your Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.name}</span></p>
                    <p><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.email}</span></p>
                    <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.phone}</span></p>
                    <p><span className="text-gray-600">Vehicle:</span> <span className="font-medium">{formData.vehicleNumber}</span></p>
                    <p><span className="text-gray-600">Type:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        vehicleColors[formData.vehicleType]
                      }`}>
                        {formData.vehicleType}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Emergency Declaration
                  </h4>
                  <p className="text-sm text-red-700">
                    By registering, you confirm that all emergency vehicle registrations will be verified by authorities. False claims may lead to legal action.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex space-x-4 mt-8">
            {step > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={prevStep}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Back
              </motion.button>
            )}
            
            {step < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={nextStep}
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Continue
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </form>

        {/* Login Link */}
        <p className="text-center mt-8 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default Signup;