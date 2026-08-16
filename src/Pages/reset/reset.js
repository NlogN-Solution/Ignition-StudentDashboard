import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Check, X } from 'lucide-react';

import { confirmPasswordReset, requestPasswordReset } from '../../api/auth';
import { useToast } from '../../context/ToastContext';

/** Step one: ask for the account email and send a reset link — the step this
 * screen used to skip entirely, jumping straight to "set a new password"
 * with nothing proving the requester owns the account. */
const RequestResetStep = ({ onSent }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    await requestPasswordReset(email);
    setIsSubmitting(false);
    onSent();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-gray-400 text-center">
        Enter the email on your account and we'll send you a link to reset your password.
      </p>
      <div className="relative group">
        <input
          type="email"
          placeholder="Email Address"
          className={`w-full px-6 py-4 bg-gray-900/50 text-white rounded-xl border focus:ring-2 outline-none backdrop-blur-xl pl-12 ${
            error
              ? 'border-red-500 focus:ring-red-500/20'
              : 'border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/20'
          }`}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
        />
        <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
      </div>
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <X className="w-4 h-4" /> {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-50 transition-all disabled:opacity-50"
      >
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
};

const RequestSentNotice = () => (
  <div className="text-center space-y-4">
    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
      <Check className="w-6 h-6 text-emerald-400" />
    </div>
    <p className="text-gray-300">
      If that email has an account, a reset link is on its way. Follow the link there to
      choose a new password.
    </p>
  </div>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const hasResetToken = Boolean(uid && token);

  const [requestSent, setRequestSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false
  });
  const [validation, setValidation] = useState({
    newPassword: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' },
    passwordStrength: {
      length: false,
      number: false,
      special: false,
      uppercase: false
    }
  });

  const validatePassword = (password) => {
    const strength = {
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      uppercase: /[A-Z]/.test(password)
    };
    const allValid = Object.values(strength).every(Boolean);

    setValidation((prev) => ({
      ...prev,
      newPassword: {
        isValid: allValid,
        message: allValid ? 'Strong password!' : 'Password must meet all requirements'
      },
      passwordStrength: strength
    }));
  };

  const validateConfirmPassword = (confirmPassword) => {
    const isValid = confirmPassword === formData.newPassword;

    setValidation((prev) => ({
      ...prev,
      confirmPassword: {
        isValid,
        message: isValid ? 'Passwords match!' : 'Passwords do not match'
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validation.newPassword.isValid || !validation.confirmPassword.isValid) return;

    setIsSubmitting(true);
    try {
      await confirmPasswordReset({ uid, token, newPassword: formData.newPassword });
      showToast('Password reset. Sign in with your new password.');
      navigate('/login');
    } catch (error) {
      setFormError(
        error?.data?.token?.[0] ||
          error?.data?.uid?.[0] ||
          error?.data?.new_password?.[0] ||
          'This reset link is invalid or has expired. Request a new one.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center overflow-hidden">
      <div className="w-full h-1/2 max-w-lg mx-auto bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700/50 shadow-2xl flex flex-col justify-center overflow-y-auto">
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          Reset Password
        </h2>

        {!hasResetToken ? (
          requestSent ? (
            <RequestSentNotice />
          ) : (
            <RequestResetStep onSent={() => setRequestSent(true)} />
          )
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password Field */}
          <div className="space-y-2">
            <div className="relative group">
              <input
                type={showPassword.new ? 'text' : 'password'}
                placeholder="New Password"
                className={`w-full px-6 py-4 bg-gray-900/50 text-white rounded-xl border focus:ring-2 outline-none backdrop-blur-xl pl-12 pr-12 ${
                  formData.newPassword
                    ? validation.newPassword.isValid
                      ? 'border-green-500 focus:ring-green-500/20'
                      : 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData({ ...formData, newPassword: e.target.value });
                  validatePassword(e.target.value);
                }}
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, new: !prev.new }))
                }
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <div className="relative group">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                placeholder="Confirm New Password"
                className={`w-full px-6 py-4 bg-gray-900/50 text-white rounded-xl border focus:ring-2 outline-none backdrop-blur-xl pl-12 pr-12 ${
                  formData.confirmPassword
                    ? validation.confirmPassword.isValid
                      ? 'border-green-500 focus:ring-green-500/20'
                      : 'border-red-500 focus:ring-red-500/20'
                    : 'border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  validateConfirmPassword(e.target.value);
                }}
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))
                }
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && (
              <div className="flex items-center gap-2 mt-1">
                {validation.confirmPassword.isValid ? (
                  <Check className="text-green-500 w-5 h-5" />
                ) : (
                  <X className="text-red-500 w-5 h-5" />
                )}
                <p
                  className={`text-sm ${
                    validation.confirmPassword.isValid ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {validation.confirmPassword.message}
                </p>
              </div>
            )}
          </div>

          {/* Password Strength */}
          <div className="mt-4">
            <h3 className="text-sm text-gray-400 mb-2">Password Requirements:</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '8+ Characters', valid: validation.passwordStrength.length },
                { label: 'Numbers', valid: validation.passwordStrength.number },
                { label: 'Special Characters', valid: validation.passwordStrength.special },
                { label: 'Uppercase Letters', valid: validation.passwordStrength.uppercase }
              ].map((req, index) => (
                <div
                  key={index}
                  className={`text-xs flex items-center gap-1 ${
                    req.valid ? 'text-green-500' : 'text-gray-400'
                  }`}
                >
                  <Check className="w-4 h-4" /> {req.label}
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <X className="w-4 h-4" /> {formError}
            </p>
          )}

          <button
            type="submit"
            className="w-full px-6 py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-50 transition-all disabled:opacity-50 disabled:hover:bg-emerald-500"
            disabled={
              isSubmitting ||
              !validation.newPassword.isValid ||
              !validation.confirmPassword.isValid
            }
          >
            {isSubmitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
