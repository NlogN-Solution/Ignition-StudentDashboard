import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthShell,
} from '../../components/auth/AuthShell';

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
    <AuthShell
      title="Welcome back."
      subtitle="Pick up your UK application where you left it."
      footer={
        <>
          Don&rsquo;t have an account yet?{' '}
          <Link
            to="/registration"
            className="font-bold text-blue-link transition-colors hover:text-navy"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email}
          value={formData.email}
          onChange={handleChange('email')}
        />

        <AuthField
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Your password"
          icon={Lock}
          error={errors.password}
          value={formData.password}
          onChange={handleChange('password')}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-[14px] top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-navy"
            >
              {showPassword ? (
                <EyeOff className="h-[17px] w-[17px]" aria-hidden />
              ) : (
                <Eye className="h-[17px] w-[17px]" aria-hidden />
              )}
            </button>
          }
        />

        <div className="flex justify-end">
          <Link
            to="/reset"
            className="text-[14px] font-semibold text-blue-link transition-colors hover:text-navy"
          >
            Forgot your password?
          </Link>
        </div>

        <AuthError>{formError}</AuthError>

        <AuthButton type="submit" disabled={isAuthenticating}>
          {isAuthenticating ? 'Signing in…' : 'Sign in'}
        </AuthButton>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
