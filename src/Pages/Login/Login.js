import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, X } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAuthenticating } = useAuth();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  // Already signed in — bounce straight to where they were headed.
  if (isAuthenticated) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  const validate = () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      next.email = 'Enter a valid email address.';
    }
    if (!formData.password) {
      next.password = 'Password is required.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    const result = await login(formData.email, formData.password);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    showToast(`Welcome back, ${result.user.fullName.split(' ')[0]}.`);
    navigate(location.state?.from ?? '/', { replace: true });
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  return (
    <div className="bg-white min-h-screen rounded-lg p-4 w-full bg-gradient-to-b from-gray-900 via-gray-800 to-black pt-12 px-4 mx-auto">
      <div className="relative bg-gradient-to-b from-gray-900 via-gray-800 to-blackk overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TS0xOCA0MmMyLjIxIDAgNCAxLjc5IDQgNHMtMS43OSA0LTQgNC00LTEuNzktNC00IDEuNzktNCA0LTR6Ii8+PC9nPjwvc3ZnPg==')]" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          {/* Login Form Section */}
          <div className="max-w-md mx-auto">
            <div className="bg-gray-800/40 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Welcome Back
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="space-y-2">
                  <div className="relative group">
                    <input
                      type="email"
                      placeholder="Email Address"
                      className={`w-full px-6 py-4 bg-gray-900/50 text-white rounded-xl border focus:ring-2 transition-all outline-none backdrop-blur-xl pl-12
                        ${errors.email
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/20 group-hover:border-emerald-500/50'}`}
                      value={formData.email}
                      onChange={handleChange('email')}
                    />
                    <Mail className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <X className="w-4 h-4" /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className={`w-full px-6 py-4 bg-gray-900/50 text-white rounded-xl border focus:ring-2 transition-all outline-none backdrop-blur-xl pl-12 pr-12
                        ${errors.password
                          ? 'border-red-500 focus:ring-red-500/20'
                          : 'border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/20 group-hover:border-emerald-500/50'}`}
                      value={formData.password}
                      onChange={handleChange('password')}
                    />
                    <Lock className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ?
                        <EyeOff className="w-5 h-5" /> :
                        <Eye className="w-5 h-5" />
                      }
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <X className="w-4 h-4" /> {errors.password}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Link to="/reset" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                {formError && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/40">
                    <p className="text-sm text-red-400">{formError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg hover:shadow-emerald-500/20 transform hover:translate-y-[-2px] transition-all duration-300 focus:ring-2 focus:ring-emerald-500/20 outline-none disabled:opacity-60 disabled:transform-none"
                >
                  {isAuthenticating ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center text-gray-400">
                Don't have an account?{' '}
                <Link to="/registration" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
