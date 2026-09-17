import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, Clock3, Trophy, ShieldCheck } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import IgnitionMark from '../../components/common/IgnitionMark';
import StudyIllustration from '../../components/common/StudyIllustration';

const TRUST_POINTS = [
  {
    icon: Clock3,
    stat: '3 years',
    label: 'A bachelor’s, one for a taught master’s',
  },
  {
    icon: Trophy,
    stat: '4 in the top 10',
    label: 'UK universities among the world’s best',
  },
  {
    icon: ShieldCheck,
    stat: 'TEF · REF · QAA',
    label: 'Quality independently checked, not self-declared',
  },
];

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
    <div className="min-h-screen w-full bg-navy-50 lg:flex">
      {/* Brand panel — hidden on small screens, shown alongside the form on lg+ */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Subtle dot-grid texture, matched to the marketing site's hero treatment */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: '28px 28px',
          }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-ignite-500/20 blur-3xl"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-navy-500/30 blur-3xl"
        />

        <div className="relative">
          <IgnitionMark dark />
        </div>

        <div className="relative flex flex-1 flex-col justify-center gap-8 py-8">
          {/* Illustration — a student mid-application, in brand colors instead of a hotlinked stock photo */}
          <div className="mx-auto w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <StudyIllustration className="h-auto w-full" />
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Everything you need,{' '}
              <span className="text-ignite-400">back where you left off.</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-navy-200">
              Sign in to track your applications, message your advisor, and pick
              up your journey to the UK exactly where you left it.
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          {TRUST_POINTS.map(({ icon: Icon, stat }) => (
            <div
              key={stat}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-3.5 text-center backdrop-blur-sm"
            >
              <Icon className="mx-auto h-5 w-5 text-ignite-400" strokeWidth={2} />
              <p className="mt-1.5 text-xs font-semibold leading-tight text-white">{stat}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:w-1/2 lg:flex-none lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <IgnitionMark />
          </div>

          <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue your application journey.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-navy-900">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-navy-900 placeholder:text-slate-400 outline-none transition-colors focus:ring-4
                    ${errors.email
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 hover:border-slate-300 focus:border-ignite-500 focus:ring-ignite-500/10'}`}
                  value={formData.email}
                  onChange={handleChange('email')}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" /> {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-navy-900">
                  Password
                </label>
                <Link to="/reset" className="text-sm font-medium text-ignite-600 hover:text-ignite-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`w-full rounded-xl border bg-white py-3 pl-11 pr-11 text-navy-900 placeholder:text-slate-400 outline-none transition-colors focus:ring-4
                    ${errors.password
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                      : 'border-slate-200 hover:border-slate-300 focus:border-ignite-500 focus:ring-ignite-500/10'}`}
                  value={formData.password}
                  onChange={handleChange('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-navy-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" /> {errors.password}
                </p>
              )}
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-6 py-3.5 font-semibold text-white shadow-lg shadow-navy-900/20 transition-all hover:bg-navy-800 hover:shadow-xl hover:shadow-navy-900/25 focus:outline-none focus:ring-4 focus:ring-navy-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAuthenticating && <Loader2 className="h-5 w-5 animate-spin" />}
              {isAuthenticating ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/registration" className="font-semibold text-ignite-600 hover:text-ignite-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
