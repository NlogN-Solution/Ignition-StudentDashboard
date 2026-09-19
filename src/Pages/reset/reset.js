import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Check, X } from 'lucide-react';

import { confirmPasswordReset, requestPasswordReset } from '../../api/auth';
import { useToast } from '../../context/ToastContext';
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthShell,
} from '../../components/auth/AuthShell';

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
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <AuthField
        id="reset-email"
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        icon={Mail}
        error={error}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError('');
        }}
      />
      <AuthButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </AuthButton>
    </form>
  );
};

const RequestSentNotice = () => (
  <div className="rounded-xl border border-hairline bg-white p-6">
    <span
      aria-hidden
      className="flex h-11 w-11 items-center justify-center rounded-full bg-navy/[0.07]"
    >
      <Check className="h-5 w-5 text-navy" strokeWidth={2.6} />
    </span>
    <h2 className="mt-4 text-[18px] font-bold tracking-[-0.01em] text-navy">
      Check your inbox
    </h2>
    <p className="mt-2 text-[15px] font-medium leading-[1.6] text-ink-muted">
      If that email has an Ignition account, a reset link is on its way. Follow the
      link there to choose a new password.
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

  const revealButton = (key, shown) => (
    <button
      type="button"
      onClick={() => setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }))}
      aria-label={shown ? 'Hide password' : 'Show password'}
      className="absolute right-[14px] top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-navy"
    >
      {shown ? (
        <EyeOff className="h-[17px] w-[17px]" aria-hidden />
      ) : (
        <Eye className="h-[17px] w-[17px]" aria-hidden />
      )}
    </button>
  );

  const requirements = [
    { label: '8 or more characters', valid: validation.passwordStrength.length },
    { label: 'A number', valid: validation.passwordStrength.number },
    { label: 'A special character', valid: validation.passwordStrength.special },
    { label: 'An uppercase letter', valid: validation.passwordStrength.uppercase }
  ];

  return (
    <AuthShell
      title={hasResetToken ? 'Choose a new password.' : 'Reset your password.'}
      subtitle={
        hasResetToken
          ? 'Pick something you have not used elsewhere. You will sign in with it straight after.'
          : 'Enter the email on your Ignition account and we will send you a link to set a new password.'
      }
      footer={
        <>
          Remembered it?{' '}
          <Link
            to="/login"
            className="font-bold text-blue-link transition-colors hover:text-navy"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {!hasResetToken ? (
        requestSent ? (
          <RequestSentNotice />
        ) : (
          <RequestResetStep onSent={() => setRequestSent(true)} />
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <AuthField
            id="newPassword"
            label="New password"
            type={showPassword.new ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Your new password"
            icon={Lock}
            value={formData.newPassword}
            onChange={(e) => {
              setFormData({ ...formData, newPassword: e.target.value });
              validatePassword(e.target.value);
            }}
            trailing={revealButton('new', showPassword.new)}
          />

          <AuthField
            id="confirmPassword"
            label="Confirm new password"
            type={showPassword.confirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            icon={Lock}
            error={
              formData.confirmPassword && !validation.confirmPassword.isValid
                ? validation.confirmPassword.message
                : undefined
            }
            value={formData.confirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              validateConfirmPassword(e.target.value);
            }}
            trailing={revealButton('confirm', showPassword.confirm)}
          />

          <div className="rounded-xl border border-hairline bg-white p-4">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.11em] text-ink-faint">
              Your password needs
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {requirements.map((requirement) => (
                <li
                  key={requirement.label}
                  className={`flex items-center gap-2 text-[13.5px] font-semibold ${
                    requirement.valid ? 'text-navy' : 'text-ink-faint'
                  }`}
                >
                  {requirement.valid ? (
                    <Check className="h-[14px] w-[14px] shrink-0 text-orange" strokeWidth={3} aria-hidden />
                  ) : (
                    <X className="h-[14px] w-[14px] shrink-0" strokeWidth={2.4} aria-hidden />
                  )}
                  {requirement.label}
                </li>
              ))}
            </ul>
          </div>

          <AuthError>{formError}</AuthError>

          <AuthButton
            type="submit"
            disabled={
              isSubmitting ||
              !validation.newPassword.isValid ||
              !validation.confirmPassword.isValid
            }
          >
            {isSubmitting ? 'Resetting…' : 'Reset my password'}
          </AuthButton>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
