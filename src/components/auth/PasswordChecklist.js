import React from "react";
import { Check, X } from "lucide-react";

import { checkPassword, passwordStrength } from "../../lib/passwordPolicy";

const STRENGTH = [
  null,
  { label: "Weak", bar: "bg-orange", text: "text-orange" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Strong", bar: "bg-green-600", text: "text-green-700" },
  { label: "Very strong", bar: "bg-green-600", text: "text-green-700" },
];

const Rule = ({ met, children }) => (
  <li className={`flex items-center gap-2 text-[12.5px] font-semibold ${met ? "text-green-700" : "text-ink-faint"}`}>
    <span
      aria-hidden
      className={`flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full transition-colors ${
        met ? "bg-green-600 text-white" : "bg-ring-idle/60 text-ink-faint"
      }`}
    >
      {met ? <Check className="h-[10px] w-[10px]" strokeWidth={3.4} /> : <X className="h-[9px] w-[9px]" strokeWidth={3} />}
    </span>
    <span>
      {children}
      <span className="sr-only">{met ? " — done" : " — not yet"}</span>
    </span>
  </li>
);

/**
 * Live password requirements, shown under the password fields while signing
 * up: a strength bar, one tick per rule, and whether the confirmation matches.
 * It only reports — submission is still gated by the form's own validation.
 */
const PasswordChecklist = ({ password, confirmPassword, id }) => {
  const rules = checkPassword(password);
  const strength = STRENGTH[passwordStrength(password)];
  const score = passwordStrength(password);
  const confirmTyped = confirmPassword.length > 0;
  const matches = confirmTyped && password === confirmPassword;

  return (
    <div id={id} className="rounded-xl border border-ring-idle bg-white/70 px-4 py-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] font-bold text-ink-soft">Password requirements</p>
        {strength ? <p className={`text-[12px] font-bold ${strength.text}`}>{strength.label}</p> : null}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-[4px] rounded-full transition-colors ${strength && score >= step ? strength.bar : "bg-ring-idle/60"}`}
          />
        ))}
      </div>

      <ul className="mt-3 grid gap-x-4 gap-y-[6px] sm:grid-cols-2">
        {rules.map((rule) => (
          <Rule key={rule.id} met={rule.met}>
            {rule.label}
          </Rule>
        ))}
        <Rule met={matches}>{confirmTyped && !matches ? "Passwords don't match yet" : "Both passwords match"}</Rule>
      </ul>
    </div>
  );
};

export default PasswordChecklist;
