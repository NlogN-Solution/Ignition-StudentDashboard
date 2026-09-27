import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useApplyIntentPreview } from "../../hooks/useApplyIntentPreview";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import { parseApiErrorDetail } from "../../lib/apiErrors";
import { checkPassword } from "../../lib/passwordPolicy";
import PasswordChecklist from "../../components/auth/PasswordChecklist";
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

  /**
   * The same rules the backend enforces, said in advance and one at a time.
   *
   * Every message here names the field's own problem, because a form that can
   * only say "check the fields above" is a form the student has to debug. Two
   * of these mirror a server rule that used to fail invisibly:
   *
   *   - **A surname is required.** `PublicRegisterRequest.last_name` is
   *     `min_length=1`, and this form builds it by splitting the full name on
   *     whitespace — so a student who typed one word got a 422 on a field that
   *     does not appear on screen, and the only thing shown was the generic
   *     sentence at the bottom.
   *   - **The phone number is capped at 20 characters** once the dialling code
   *     is prepended, which is now what we send.
   */
  const validateForm = () => {
    const newErrors = {};

    const nameParts = formData.fullName.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) {
      newErrors.fullName = "Enter your full name.";
    } else if (nameParts.length === 1) {
      newErrors.fullName = "Enter your first and last name, as they appear on your passport.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = "That doesn't look like an email address — check for a typo.";
    }

    const digits = formData.phone.replace(/[\s-]/g, "");
    if (!digits) {
      newErrors.phone = "Enter your phone number.";
    } else if (!/^\d+$/.test(digits)) {
      newErrors.phone = "Digits only — leave out spaces, brackets and the country code.";
    } else if (digits.length < 6 || `${countryCode}${digits}`.length > 20) {
      newErrors.phone = "That number is the wrong length. Check it and try again.";
    }

    if (!formData.password) {
      newErrors.password = "Choose a password.";
    } else {
      const missing = checkPassword(formData.password).filter((rule) => !rule.met);
      if (missing.length > 0) {
        newErrors.password = `Your password still needs: ${missing
          .map((rule) => rule.label.toLowerCase())
          .join(", ")}.`;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Re-enter your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "These two don't match.";
    }

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
    //
    // The dialling code travels with the number. The selector has been on this
    // form since it was written and its value was thrown away, so every
    // account was created with a bare local number and no country — which is
    // not a number anyone can ring from the office.
    const result = await register({
      email: formData.email.trim(),
      first_name: firstName || "",
      last_name: rest.join(" "),
      phone: `${countryCode}${formData.phone.replace(/[\s-]/g, "")}`,
      password: formData.password,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      // The account was created and only the sign-in that follows failed. Do
      // not send them back to the form — the form worked, and a second attempt
      // would fail on a duplicate email and look like their fault.
      if (result.stage === "session") {
        setFormError(
          "Your account was created, but we couldn't sign you in just now. Try signing in from the login page.",
        );
        return;
      }

      // `result.error` is the parsed response body — either
      // `{ detail: "message" }` (a conflict, e.g. duplicate email) or
      // `{ detail: [{ loc, msg }, ...] }` (a 422 field-validation failure).
      const { fields, message, isValidation } = parseApiErrorDetail(result.error?.detail);

      // `last_name` has no box of its own — the form asks for one full name and
      // splits it — so its error belongs on the field the student can actually
      // edit, said in terms of that field.
      const nameError =
        fields.first_name ??
        (fields.last_name ? "Enter your first and last name, as they appear on your passport." : undefined);

      setErrors((current) => ({
        ...current,
        email: fields.email ?? current.email,
        phone: fields.phone ?? current.phone,
        password: fields.password ?? current.password,
        fullName: nameError ?? current.fullName,
      }));

      // Everything the server complained about that has nowhere to go on this
      // form. Without this the request is rejected and the screen says nothing
      // — which is the whole complaint about this page.
      const shown = new Set(["email", "phone", "password", "first_name", "last_name"]);
      const orphans = Object.entries(fields)
        .filter(([field]) => !shown.has(field))
        .map(([field, text]) => `${field.replace(/_/g, " ")}: ${text}`);

      if (message) {
        setFormError(message);
      } else if (orphans.length > 0) {
        setFormError(orphans.join(" "));
      } else if (isValidation) {
        setFormError("Some details need correcting — see the fields marked above.");
      } else if (result.status === undefined) {
        // No status means the request never got an answer.
        setFormError("We couldn't reach Ignition. Check your connection and try again.");
      } else {
        setFormError(`Something went wrong at our end (error ${result.status}). Please try again.`);
      }
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
            className="font-bold text-navy-900 transition-colors hover:text-navy-900"
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
              className="h-[44px] shrink-0 rounded-xl border border-ring-idle bg-white px-3 text-[15px] font-medium text-ink outline-none transition-colors hover:border-nav/40 focus:border-navy-900 focus:ring-4 focus:ring-navy-900/15"
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
              className={`h-[44px] min-w-0 flex-1 rounded-xl border bg-white px-4 text-[15px] font-medium text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-navy-900 focus:ring-4 focus:ring-navy-900/15 ${
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
          placeholder="Create a strong password"
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

        {/* Shown once the student starts typing a password, so the empty form
            stays short; from then on every rule ticks off live. */}
        {formData.password || formData.confirmPassword ? (
          <PasswordChecklist
            id="password-requirements"
            password={formData.password}
            confirmPassword={formData.confirmPassword}
          />
        ) : null}

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
