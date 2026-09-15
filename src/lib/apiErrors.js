// FastAPI's error body is not DRF's. A field-validation failure (422) is
// `{ detail: [{ loc: ["body", "email"], msg, type }, ...] }` — an array, not
// a per-field dict — and every other rejection (409 conflict, 400 bad
// request, 403) is `{ detail: "<message>" }`, a plain string. Screens ported
// from the Django-backed prototype expect `errors.email[0]`-style dicts;
// this bridges the gap so their JSX doesn't have to change.

/** @returns {{ fields: Record<string, string>, message: string|null }} */
export const parseApiErrorDetail = (detail) => {
  if (Array.isArray(detail)) {
    const fields = {};
    for (const item of detail) {
      const field = item?.loc?.[item.loc.length - 1];
      if (field && !fields[field]) fields[field] = item.msg;
    }
    return { fields, message: null };
  }
  if (typeof detail === "string") return { fields: {}, message: detail };
  return { fields: {}, message: null };
};
