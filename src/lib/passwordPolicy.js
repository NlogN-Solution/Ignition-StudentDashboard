/**
 * The student sign-up password policy.
 *
 * Mirrors `validate_password_policy` in backend/app/schemas/auth.py, which
 * rejects the same passwords with a 422. Keep the two in step: a rule shown
 * here that the server does not enforce is decoration, and a rule the server
 * enforces that is not shown here is a failure the student cannot predict.
 */
export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (value) => value.length >= 8 },
  { id: "upper", label: "One uppercase letter (A–Z)", test: (value) => /[A-Z]/.test(value) },
  { id: "lower", label: "One lowercase letter (a–z)", test: (value) => /[a-z]/.test(value) },
  { id: "number", label: "One number (0–9)", test: (value) => /\d/.test(value) },
  { id: "symbol", label: "One symbol (e.g. ! @ # $ %)", test: (value) => /[^A-Za-z0-9\s]/.test(value) },
];

export const checkPassword = (value = "") =>
  PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(value) }));

export const passwordMeetsPolicy = (value = "") => PASSWORD_RULES.every((rule) => rule.test(value));

/** 0–4, for the strength bar. Length past 12 earns a bonus point. */
export const passwordStrength = (value = "") => {
  if (!value) return 0;
  const met = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  if (met < 3) return 1;
  if (met < PASSWORD_RULES.length) return 2;
  return value.length >= 12 ? 4 : 3;
};
