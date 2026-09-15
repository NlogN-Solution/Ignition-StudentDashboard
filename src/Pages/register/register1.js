import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useApplyIntentPreview } from "../../hooks/useApplyIntentPreview";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import { parseApiErrorDetail } from "../../lib/apiErrors";
import {
  AuthButton,
  AuthError,
  AuthField,
  AuthShell,
} from "../../components/auth/AuthShell";

const RegistrationPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  // Null unless the student arrived from Apply Now. See lib/applyIntent.
  const intent = useApplyIntentPreview();
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
    if (!formData.fullName) newErrors.fullName = "Full name is required.";
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "A valid email address is required.";
    if (!formData.phone || !/^\d+$/.test(formData.phone))
      newErrors.phone = "A valid phone number is required.";
    if (!formData.password || formData.password.length < 8)
      newErrors.password = "Use at least 8 characters.";
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

  const set = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  };

  const revealButton = (key, shown) => (
    <button
      type="button"
      onClick={() => setShowPassword((current) => ({ ...current, [key]: !current[key] }))}
      aria-label={shown ? "Hide password" : "Show password"}
      className="absolute right-[14px] top-1/2 -translate-y-1/2 text-ink-faint transition-colors hover:text-navy-900"
    >
      {shown ? (
        <EyeOff className="h-[17px] w-[17px]" aria-hidden />
      ) : (
        <Eye className="h-[17px] w-[17px]" aria-hidden />
      )}
    </button>
  );

  return (
    <AuthShell
      intent={intent}
      title="Create your Ignition application."
      subtitle="One account for your profile, your documents and every application you make. It takes a couple of minutes and costs nothing."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-blue-link transition-colors hover:text-navy-900"
          >
            Sign in
          </Link>
        </>
      }
    >
      {/*
        One field per row.

        These were briefly paired two-to-a-row to buy height, and it read as
        cramped: a name box half the width of the thing it sits under, two
        password fields side by side that look like one answer split in half.
        A sign-up form is a single column of questions asked in order, and it
        should look like one.

        The height that bought is taken back elsewhere instead — a narrower
        430px column, 46px controls, smaller heading, tighter rhythm — and the
        photograph beside it is `sticky`, so the fold stops mattering. See the
        layout note in components/auth/AuthShell.
      */}
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <AuthField
          id="fullName"
          label="Full name"
          autoComplete="name"
          placeholder="As on your passport"
          icon={User}
          error={errors.fullName}
          value={formData.fullName}
          onChange={set("fullName")}
        />

        <AuthField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={Mail}
          error={errors.email}
          value={formData.email}
          onChange={set("email")}
        />

        <div>
          <label htmlFor="phone" className="block text-[13px] font-semibold text-ink-soft">
            Phone number
          </label>
          <div className="mt-[5px] flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              aria-label="Country dialling code"
              className="h-[44px] shrink-0 rounded-xl border border-ring-idle bg-white px-3 text-[15px] font-medium text-ink outline-none transition-colors hover:border-nav/40 focus:border-blue-bright focus:ring-4 focus:ring-blue-bright/15"
            >
              {formOptions.countryCodes.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.label}
                </option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={formData.phone}
              onChange={set("phone")}
              placeholder="123 456 7890"
              aria-invalid={errors.phone ? "true" : undefined}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={`h-[44px] min-w-0 flex-1 rounded-xl border bg-white px-4 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-blue-bright focus:ring-4 focus:ring-blue-bright/15 ${
                errors.phone ? "border-orange" : "border-ring-idle hover:border-nav/40"
              }`}
            />
          </div>
          {errors.phone ? (
            <p id="phone-error" className="mt-[5px] text-[13px] font-semibold text-orange">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <AuthField
          id="password"
          label="Password"
          type={showPassword.password ? "text" : "password"}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={Lock}
          error={errors.password}
          value={formData.password}
          onChange={set("password")}
          trailing={revealButton("password", showPassword.password)}
        />

        <AuthField
          id="confirmPassword"
          label="Confirm password"
          type={showPassword.confirm ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={Lock}
          error={errors.confirmPassword}
          value={formData.confirmPassword}
          onChange={set("confirmPassword")}
          trailing={revealButton("confirm", showPassword.confirm)}
        />

        <AuthError>{formError}</AuthError>

        <AuthButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating your account…" : "Create my account"}
        </AuthButton>

        <p className="text-[12.5px] font-medium leading-[1.5] text-ink-faint">
          Next you will tell us about your studies and what you want to apply for.
          Nothing is sent to any university until you and your Ignition advisor agree
          it is ready.
        </p>
      </form>
    </AuthShell>
  );
};

export default RegistrationPage;
