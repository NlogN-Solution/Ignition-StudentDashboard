import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, User, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import { parseApiErrorDetail } from "../../lib/apiErrors";

const InputField = ({ label, type = "text", value, onChange, error, required, placeholder }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-600">
      {label} {required && <span className="text-blue-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-6 py-4 bg-white text-gray-700 rounded-lg border ${
        error ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
      } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all hover:border-gray-300`}
    />
    {error && (
      <p className="text-sm text-red-500 mt-1 flex items-center">
        <X className="w-4 h-4 mr-1" /> {error}
      </p>
    )}
  </div>
);

const RegistrationPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [countryCode, setCountryCode] = useState(formOptions.countryCodes[0].value);
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = "Full Name is required.";
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "A valid email address is required.";
    if (!formData.phone || !/^\d+$/.test(formData.phone))
      newErrors.phone = "A valid phone number is required.";
    if (!formData.password || formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters long.";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validateForm()) return;

    const [firstName, ...rest] = formData.fullName.trim().split(/\s+/);

    setIsSubmitting(true);
    // No confirm_password — the backend's PublicRegisterRequest forbids
    // fields it doesn't declare, and confirmation is a client-side-only
    // check (already enforced by validateForm above).
    const result = await register({
      email: formData.email,
      first_name: firstName || "",
      last_name: rest.join(" "),
      phone: formData.phone,
      password: formData.password,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      // `result.error` is the parsed response body — either
      // `{ detail: "message" }` (a conflict, e.g. duplicate email) or
      // `{ detail: [{ loc, msg }, ...] }` (a 422 field-validation failure).
      const { fields, message } = parseApiErrorDetail(result.error?.detail);
      setErrors((current) => ({
        ...current,
        email: fields.email,
        phone: fields.phone,
        password: fields.password,
        fullName: fields.first_name || fields.last_name,
      }));
      setFormError(message || "Couldn't create the account. Check the fields above.");
      return;
    }

    showToast(`Welcome to Ignition, ${firstName || "there"}!`);
    navigate("/initalsetup", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-5xl w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Logo */}
        <div className="absolute top-6 left-6">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-green-600">Ignition</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Panel */}
          <div className="lg:w-2/5 bg-gradient-to-br from-blue-50 via-white to-blue-50 p-8 lg:p-12">
            <div className="mb-12 mt-12">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="text-blue-500 w-6 h-6" />
                </div>
                <span className="text-xl font-semibold text-blue-500">Welcome!</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-gray-800">Create an Account</h1>
            <p className="text-gray-600 text-lg">Get started with a smooth and modern registration experience.</p>
          </div>

          {/* Form Panel */}
          <div className="lg:w-3/5 p-8 lg:p-12 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full Name */}
              <InputField
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                error={errors.fullName}
                required
                placeholder="Enter your full name"
              />
              {/* Email */}
              <InputField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
                placeholder="you@example.com"
              />
              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">
                  Phone Number <span className="text-blue-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300"
                  >
                    {formOptions.countryCodes.map((code) => (
                      <option key={code.value} value={code.value}>
                        {code.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="123 456 7890"
                    className={`flex-1 px-6 py-4 bg-white text-gray-700 rounded-lg border ${
                      errors.phone ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all hover:border-gray-300`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <X className="w-4 h-4 mr-1" /> {errors.phone}
                  </p>
                )}
              </div>
              {/* Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">
                  Password <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.password ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className={`w-full px-6 py-4 bg-white text-gray-700 rounded-lg border ${
                      errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all hover:border-gray-300`}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() =>
                      setShowPassword({ ...showPassword, password: !showPassword.password })
                    }
                  >
                    {showPassword.password ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <X className="w-4 h-4 mr-1" /> {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">
                  Confirm Password <span className="text-blue-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Re-enter your password"
                    className={`w-full px-6 py-4 bg-white text-gray-700 rounded-lg border ${
                      errors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:ring-blue-500"
                    } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all hover:border-gray-300`}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() =>
                      setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                    }
                  >
                    {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1 flex items-center">
                    <X className="w-4 h-4 mr-1" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {formError && (
                <p className="text-sm text-red-500 flex items-center">
                  <X className="w-4 h-4 mr-1" /> {formError}
                </p>
              )}

              {/* Submit Button */}
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:ring-4 focus:ring-blue-400 focus:ring-opacity-50 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:transform-none"
                >
                  {isSubmitting ? "Creating account…" : "Register"}
                </button>
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-blue-500 hover:text-blue-600">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
