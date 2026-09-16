// FastAPI's error body is not DRF's. A field-validation failure (422) is
// `{ detail: [{ loc: ["body", "email"], msg, type }, ...] }` — an array, not
// a per-field dict — and every other rejection (409 conflict, 400 bad
// request, 403) is `{ detail: "<message>" }`, a plain string. Screens ported
// from the Django-backed prototype expect `errors.email[0]`-style dicts;
// this bridges the gap so their JSX doesn't have to change.

/**
 * Pydantic's own wording, turned into something a student can act on.
 *
 * `"String should have at least 8 characters"` is accurate and useless: it does
 * not say which string, and it is written for whoever is holding the schema.
 * The map is keyed on Pydantic's stable `type` rather than on `msg`, which is
 * prose and changes between releases.
 *
 * Anything not listed falls through to the server's own `msg`. Showing a
 * developer's sentence is bad; showing nothing, which is what happened before,
 * is worse — that is how a failed sign-up came to say only "Couldn't create
 * the account. Check the fields above" with no field marked.
 */
const HUMANISE = {
  missing: () => "This is required.",
  string_too_short: (ctx) =>
    ctx?.min_length === 1
      ? "This is required."
      : `Use at least ${ctx?.min_length ?? 1} characters.`,
  string_too_long: (ctx) => `Use ${ctx?.max_length ?? "fewer"} characters or fewer.`,
  value_error: () => "This doesn't look right.",
  string_type: () => "This is required.",
  extra_forbidden: () => "This field isn't accepted here.",
};

const humanise = (item) => {
  const rule = HUMANISE[item?.type];
  return (rule ? rule(item.ctx) : null) ?? item?.msg ?? "This doesn't look right.";
};

/**
 * @returns {{
 *   fields: Record<string, string>,
 *   message: string|null,
 *   isValidation: boolean,
 * }}
 *
 * `isValidation` tells a caller whether the server rejected the *content* of
 * the form (so the field markers below it are the real explanation) or
 * something else entirely — a conflict, a 500, a network failure. The two
 * deserve different sentences, and collapsing them is why every failure used
 * to read as "check the fields above" even when no field was at fault.
 */
export const parseApiErrorDetail = (detail) => {
  if (Array.isArray(detail)) {
    const fields = {};
    for (const item of detail) {
      const field = item?.loc?.[item.loc.length - 1];
      if (field && !fields[field]) fields[field] = humanise(item);
    }
    return { fields, message: null, isValidation: true };
  }
  if (typeof detail === "string") return { fields: {}, message: detail, isValidation: false };
  return { fields: {}, message: null, isValidation: false };
};

/**
 * Did the server say "no such thing", or did we simply fail to ask it?
 *
 * The catalogue screens used to treat every rejection the same way and render
 * "Course not found — it may have been withdrawn from the catalogue". For a
 * while that sentence was shown for all ~4,800 courses in the catalogue,
 * because `GET /public/courses/{slug}` was 500ing and a 500 reached the same
 * `catch` as a 404. A student was told a course had been withdrawn while it
 * was on offer, and sent back to Explore to look for it.
 *
 * So the two are separated. A 404 is about the catalogue and the message
 * should say so; anything else is about us, and the honest thing to offer is
 * "try again" rather than an explanation we have not earned.
 */
export const isNotFoundError = (error) => error?.status === 404;
