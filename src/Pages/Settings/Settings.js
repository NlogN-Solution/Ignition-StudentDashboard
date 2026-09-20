import React, { useEffect, useState } from "react";
import { Bell, KeyRound, Loader2, Mail, ShieldCheck, Wallet } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { changePassword } from "../../api/auth";
import { getPreferencesApi, updatePreferencesApi } from "../../api/studentPortal";

/**
 * The settings screen.
 *
 * The sidebar has linked to `/settings` since the portal was built and no route
 * ever answered it — the link fell through to the 404 page. Meanwhile
 * `GET/PATCH /student/me/preferences` had been live on the backend the whole
 * time with nothing calling it, and `getPreferencesApi` sat unused in the API
 * client. This screen is both halves meeting.
 *
 * What is deliberately *not* here: email verification and two-factor
 * authentication. Both have a column on `users` (`email_verified_at`,
 * `two_factor_enabled`) and neither has an endpoint, a mailer or a TOTP
 * implementation behind it. A toggle that flips a flag nothing enforces is
 * worse than no toggle, because it tells a student they are protected.
 */

const CURRENCIES = [
  { code: "", label: "Match my destination country" },
  { code: "NPR", label: "Nepalese rupee (NPR)" },
  { code: "GBP", label: "Pound sterling (GBP)" },
  { code: "USD", label: "US dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "AUD", label: "Australian dollar (AUD)" },
];

const Card = ({ icon: Icon, title, description, children }) => (
  <section className="rounded-2xl border border-hairline bg-white shadow-card">
    <div className="flex items-start gap-3 border-b border-hairline p-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-navy-900">{title}</h2>
        <p className="mt-0.5 text-[13px] leading-[1.5] text-ink-muted">{description}</p>
      </div>
    </div>
    <div className="p-5">{children}</div>
  </section>
);

const Toggle = ({ label, hint, checked, disabled, onChange }) => (
  <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
    <span className="min-w-0">
      <span className="block text-sm font-medium text-navy-900">{label}</span>
      <span className="block text-[13px] leading-[1.5] text-ink-muted">{hint}</span>
    </span>
    <input
      type="checkbox"
      role="switch"
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-navy-900 disabled:cursor-not-allowed disabled:opacity-50"
    />
  </label>
);

const Settings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [preferences, setPreferences] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingField, setSavingField] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getPreferencesApi()
      .then((data) => {
        if (!cancelled) setPreferences(data);
      })
      .catch(() => {
        if (!cancelled) showToast("Couldn't load your settings. Refresh to try again.", "error");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `showToast` is stable from its provider; re-running this on it would refetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Save one field at a time, optimistically.
   *
   * A settings screen with a Save button makes people wonder whether a switch
   * they flipped took effect. Each control writes its own field and rolls back
   * if the server refuses, so what is on screen is always what is stored.
   */
  const savePreference = async (field, value) => {
    const previous = preferences;
    setPreferences((current) => ({ ...current, [field]: value }));
    setSavingField(field);
    try {
      const saved = await updatePreferencesApi({ [field]: value });
      setPreferences(saved);
    } catch {
      setPreferences(previous);
      showToast("That didn't save. Check your connection and try again.", "error");
    } finally {
      setSavingField(null);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <PageHeader
        title="Settings"
        description="How we contact you, how money is shown, and your password."
      />

      <main className="mx-auto max-w-3xl space-y-5 px-4 pt-6 sm:px-8">
        <Card
          icon={Mail}
          title="Your account"
          description="The address your counsellor and every notification go to."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-navy-900">{user?.email ?? "—"}</p>
              <p className="text-[13px] text-ink-muted">
                {user?.fullName || "Your name is on your profile"}
              </p>
            </div>
            <p className="text-[13px] text-ink-muted">
              Ask your counsellor to change your email address.
            </p>
          </div>
        </Card>

        <Card
          icon={Bell}
          title="Notifications"
          description="Offers, document requests and appointment confirmations always appear in the portal. These control what else reaches you."
        >
          {isLoading ? (
            <p className="flex items-center gap-2 py-3 text-sm text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading your settings…
            </p>
          ) : (
            <div className="divide-y divide-hairline">
              <Toggle
                label="Email me"
                hint="Updates on your applications, documents and appointments, sent to your inbox."
                checked={Boolean(preferences?.email_notifications_enabled)}
                disabled={savingField === "email_notifications_enabled"}
                onChange={(value) => savePreference("email_notifications_enabled", value)}
              />
              <Toggle
                label="Push notifications"
                hint="Alerts on this device while the portal is open in a tab."
                checked={Boolean(preferences?.push_notifications_enabled)}
                disabled={savingField === "push_notifications_enabled"}
                onChange={(value) => savePreference("push_notifications_enabled", value)}
              />
              <Toggle
                label="Show my Ignition points"
                hint="The points widget on your dashboard."
                checked={Boolean(preferences?.show_points_widget)}
                disabled={savingField === "show_points_widget"}
                onChange={(value) => savePreference("show_points_widget", value)}
              />
            </div>
          )}
        </Card>

        <Card
          icon={Wallet}
          title="Currency"
          description="What tuition, living costs and the budget calculator are shown in."
        >
          <select
            value={preferences?.preferred_currency ?? ""}
            disabled={isLoading || savingField === "preferred_currency"}
            onChange={(event) => savePreference("preferred_currency", event.target.value || null)}
            className="h-11 w-full rounded-xl border border-hairline bg-white px-3 text-[15px] text-navy-900 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100 disabled:opacity-60 sm:max-w-sm"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.label}
              </option>
            ))}
          </select>
        </Card>

        <PasswordCard />

        <Card
          icon={ShieldCheck}
          title="Signing in"
          description="Extra protection for your account."
        >
          <p className="text-[13px] leading-[1.6] text-ink-muted">
            Email verification and two-step sign-in aren&rsquo;t available yet. Until they are, the
            strongest thing you can do is use a password you don&rsquo;t use anywhere else — and tell
            your counsellor straight away if you think someone else has it.
          </p>
        </Card>
      </main>
    </div>
  );
};

/** Its own component so a keystroke in the password form does not re-render
 *  the preference toggles above it. */
const PasswordCard = () => {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Your new password needs at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The two new passwords don't match.");
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed. You're signed out everywhere else.");
    } catch (caught) {
      setError(
        caught?.message?.includes("incorrect")
          ? "That's not your current password."
          : "Couldn't change your password. Try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const input =
    "h-11 w-full rounded-xl border border-hairline bg-white px-3 text-[15px] text-navy-900 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100";

  return (
    <Card
      icon={KeyRound}
      title="Password"
      description="Changing it signs you out on every other device."
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:max-w-sm">
        <div className="space-y-1.5">
          <label htmlFor="current-password" className="text-sm font-medium text-navy-900">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className={input}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-sm font-medium text-navy-900">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className={input}
            required
          />
          <p className="text-[13px] text-ink-muted">At least 8 characters.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-sm font-medium text-navy-900">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={input}
            required
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving || !currentPassword || !newPassword}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy-900 px-5 text-[15px] font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Change password
        </button>
      </form>
    </Card>
  );
};

export default Settings;
