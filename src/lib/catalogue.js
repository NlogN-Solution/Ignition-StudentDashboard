/**
 * Formatting for catalogue values, shared by every explore screen.
 *
 * These match the public platform's helpers deliberately (`data/courses`'s
 * `durationLabel`, its `Intl` money and date formats). A student who read
 * "3 years 6 months" on the marketing site and "3.5 years" here would
 * reasonably wonder whether they were looking at the same course.
 */

const gbpFormat = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const plainFormat = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

/** "3 years", "3 years 6 months", "1 year". */
export const durationLabel = (years) => {
  if (!years) return null;
  const whole = Math.floor(years);
  const months = Math.round((years - whole) * 12);
  const parts = [];
  if (whole) parts.push(`${whole} ${whole === 1 ? "year" : "years"}`);
  if (months) parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  return parts.join(" ") || null;
};

export const money = (value, currency) => {
  if (value === null || value === undefined) return null;
  if (!currency || currency === "GBP") return gbpFormat.format(value);
  return `${plainFormat.format(value)} ${currency}`;
};

/** Long-form, so a deadline cannot be misread as day/month or month/day. */
export const longDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

/** `applicationDeadline` / `application_deadline` → "Application deadline". */
export const humanise = (key) => {
  const spaced = String(key).replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

/**
 * Build a spec list, dropping anything with nothing to say.
 *
 * The rule the whole catalogue is rendered under: a section whose field is
 * absent does not render. It is what lets one component serve a fully
 * documented university and a sparse one without either looking broken — and
 * the imported catalogue is uneven enough that this matters on nearly every
 * screen.
 */
export const specs = (rows) =>
  rows
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => ({ label, value }));

/** `{academic: [...], documents: [...]}` → `[{label, items}]`, source order kept. */
export const toSections = (grouped) =>
  Object.entries(grouped ?? {})
    .map(([key, value]) => ({
      label: humanise(key),
      items: Array.isArray(value)
        ? value.filter((item) => typeof item === "string" && item.trim())
        : typeof value === "string" && value.trim()
        ? [value.trim()]
        : [],
    }))
    .filter((section) => section.items.length > 0);

/**
 * "N/A" is the spreadsheet's way of writing an empty cell. Printing "English
 * waiver: N/A" states a policy the university never gave, so it is dropped the
 * same way a null is.
 */
export const cleanCriterion = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed || trimmed.toUpperCase() === "N/A") return null;
  return trimmed;
};

/** The route names the public site uses, so both halves label a route alike. */
const ROUTE_NAMES = {
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
  pre_masters: "Pre-Masters",
  extended_masters: "Extended Masters",
  international_foundation_year: "International Foundation Year",
  international_year_one: "International Year One",
  top_up: "Top-up",
  nursing: "Nursing",
  mres: "MRes",
  dba: "DBA",
};

export const routeLabel = (route) =>
  route?.label ??
  ROUTE_NAMES[route?.route_key] ??
  String(route?.route_key ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/** The eleven known criteria labels, in the order the public site prints them. */
export const CRITERIA_ORDER = [
  ["academic_criteria", "Academic requirement"],
  ["english_criteria", "English language"],
  ["english_waiver", "English waiver"],
  ["fee_structure", "Tuition fees"],
  ["scholarship_text", "Scholarship"],
  ["cas_deposit", "CAS deposit"],
  ["enrolment_fee", "Enrolment fee"],
  ["gap_policy", "Study gap policy"],
  ["previous_refusal", "Previous visa refusal"],
  ["deadlines", "Deadlines"],
];

/** One route as label/value rows, long tail included, "N/A" dropped. */
export const routeRows = (route) => {
  if (!route) return [];
  const rows = [];
  CRITERIA_ORDER.forEach(([key, label]) => {
    const value = cleanCriterion(route[key]);
    if (value) rows.push({ label, value });
  });
  Object.entries(route.extras ?? {}).forEach(([label, value]) => {
    const cleaned = cleanCriterion(value);
    if (cleaned) rows.push({ label, value: cleaned });
  });
  return rows;
};

/* ------------------------------------------------------------------ money --- */

/**
 * Pull every £ figure out of a piece of criteria prose, largest last.
 *
 * The fee and the scholarship are **prose, not numbers** — there is no numeric
 * fee anywhere in the catalogue (`programs.tuition_fee` is NULL on all 4,797
 * offerings), because the source workbook states things like "LOWER TIER
 * COURSES: £12,100 / UPPER TIER: £14,900" and "2.4 GPA or 60% - £1000 per year
 * 2.6 GPA or 65% - £2000 per year". Forcing that into a single column would
 * lose the condition, and the condition is the part applicants get wrong.
 *
 * So the full text stays authoritative and is shown in full on the detail
 * page; this only lifts a headline figure so a results card can say roughly
 * what something costs without a student opening thirty pages to find out.
 */
const poundFigures = (text) => {
  if (typeof text !== "string") return [];
  const found = [...text.matchAll(/£\s?(\d[\d,]*(?:\.\d+)?)/g)]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0);
  return [...new Set(found)].sort((a, b) => a - b);
};

const poundLabel = (value) =>
  `£${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value)}`;

/**
 * A card-sized reading of the tuition prose.
 *
 * `from` is true whenever the text names more than one figure — the route's
 * fee often covers several courses at different tiers, and this offering may
 * be at any of them. Saying "from £16,800" is the strongest claim the data
 * supports; printing the first number as if it were *the* fee would not be.
 *
 * Returns `null` when the text names no figure at all, so the card renders
 * nothing rather than an empty fee slot.
 */
export const feeSummary = (text) => {
  const figures = poundFigures(text);
  if (!figures.length) return null;
  return { amount: poundLabel(figures[0]), from: figures.length > 1, source: text };
};

/**
 * A card-sized reading of the scholarship prose.
 *
 * The amount is the **largest** figure named, presented as "up to" — a banded
 * award ("60% - £1000 ... 70% - £3000") is worth its top band only to a
 * student who reaches it, and "up to" is how an award like that is honestly
 * summarised. Where the text names no figure the award still exists, so this
 * returns an entry with no amount rather than nothing.
 */
export const scholarshipSummary = (text) => {
  const cleaned = cleanCriterion(text);
  if (!cleaned) return null;
  const figures = poundFigures(cleaned);
  return {
    amount: figures.length ? poundLabel(figures[figures.length - 1]) : null,
    source: cleaned,
  };
};
