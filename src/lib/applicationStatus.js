// One vocabulary for where an application is, shared by every screen that
// groups them.
//
// It exists because the dashboard and the Applications list each had their own
// idea of what "an offer" meant, and they disagreed: the dashboard tile counted
// `status === 'offer'` — a value from the pre-backend JSON fixtures that no
// application has ever had, so it counted zero forever — while the list matched
// three real statuses. A student was shown "0 offers received" on one screen and
// an offer on the next.
//
// Anything that filters or counts applications by phase imports from here, so
// a tile's number and the list that tile opens are the same set by construction.

/**
 * An offer exists on this application.
 *
 * Includes `offer_accepted` and `offer_declined`: an offer you accepted is
 * still an offer you received, and one you turned down is a decision worth
 * being able to look back at. Excludes everything past the CAS, which has its
 * own group — by then the question the student is asking is about the visa.
 */
export const OFFER_STATUSES = ["offer_received", "offer_accepted", "offer_declined", "cas_received"];

export const VISA_STATUSES = ["visa_processing", "visa_approved", "visa_rejected", "enrolled"];

/** Statuses where an offer letter should exist and be worth showing. */
export const HAS_OFFER_STATUSES = [
  "offer_received",
  "offer_accepted",
  "cas_received",
  ...VISA_STATUSES,
];

export const hasOffer = (status) => HAS_OFFER_STATUSES.includes(status);

/** Where a CAS is worth talking about, even before it exists. */
export const CAS_STAGES = ["offer_accepted", "cas_received", ...VISA_STATUSES];

/**
 * What kind of offer it is.
 *
 * Worth spelling out on screen: a conditional offer is a place *if* the
 * remaining conditions are met, and a student reading only "Offer received"
 * will reasonably assume it is unconditional.
 */
export const OFFER_TYPE_LABELS = {
  conditional: "Conditional offer",
  unconditional: "Unconditional offer",
  other: "Offer",
};

/**
 * How an application's status reads in a pill: a title-case label and one of
 * five tones. The tone is the phase, not the individual status — every "someone
 * is reading it" status is the same orange, so two applications at the same
 * point in the journey never look different.
 */
const PILL_LABELS = {
  requested: "Requested",
  request_rejected: "Needs More Info",
  draft: "Preparing",
  documents_pending: "Documents Needed",
  ready_to_submit: "In Review",
  under_review: "In Review",
  submitted: "Submitted",
  offer_received: "Offer Received",
  offer_accepted: "Offer Accepted",
  offer_declined: "Offer Declined",
  cas_received: "CAS Received",
  visa_processing: "Visa In Progress",
  visa_approved: "Visa Approved",
  visa_rejected: "Visa Refused",
  enrolled: "Enrolled",
  withdrawn: "Withdrawn",
  rejected: "Not Successful",
};

const PILL_TONES = {
  requested: "navy",
  request_rejected: "orange",
  draft: "navy",
  submitted: "navy",
  documents_pending: "orange",
  ready_to_submit: "orange",
  under_review: "orange",
  visa_processing: "orange",
  offer_received: "green",
  offer_accepted: "green",
  cas_received: "green",
  visa_approved: "green",
  enrolled: "green",
  rejected: "red",
  visa_rejected: "red",
  withdrawn: "gray",
  offer_declined: "gray",
};

export const applicationPill = (status) => ({
  label: PILL_LABELS[status] ?? status,
  tone: PILL_TONES[status] ?? "gray",
});

/**
 * The progress card on the application page, from shortlist to enrolment.
 *
 * Shortlisted → Submitted → Offer letter → CAS → Visa lodged → Enrolled.
 * It follows the backend's `ApplicationStatus` order but not every value in
 * it: the university's review (`under_review`) is part of "Application
 * Submitted" from the student's side, accepting an offer is a click between
 * "Offer Letter" and "CAS", and a visa approval is the outcome of "Visa
 * Lodged" — six steps a student can scan beat eleven they have to read. The
 * backend keeps every status; only this display folds them.
 *
 * `reached` is the index of the step the application is currently *on*;
 * everything before it is done. An application that was turned down,
 * withdrawn or refused a visa stops where it is.
 */
export const PROGRESS_STEPS = [
  "Course Shortlisted",
  "Application Submitted",
  "Offer Letter",
  "CAS Received",
  "Visa Lodged",
  "Enrolled",
];

const STEP_OF_STATUS = {
  requested: 1,
  request_rejected: 1,
  draft: 1,
  documents_pending: 1,
  ready_to_submit: 1,
  // Filed with the university and waiting — including while it reviews the
  // documents: the submission is the live step until a decision comes back.
  submitted: 1,
  under_review: 1,
  withdrawn: 1,
  rejected: 1,
  offer_declined: 2,
  // Offer in hand; the university issues the CAS once it is accepted.
  offer_received: 3,
  offer_accepted: 3,
  cas_received: 4,
  visa_processing: 4,
  visa_rejected: 4,
  visa_approved: 5,
  enrolled: 6,
};

/** Statuses that end the journey where they stand. */
export const STOPPED_STATUSES = ["rejected", "withdrawn", "offer_declined", "visa_rejected"];

/** Index of the step in progress; `PROGRESS_STEPS.length` when every step is done. */
export const progressStepOf = (status) => STEP_OF_STATUS[status] ?? 0;

/**
 * The four-stage summary of the journey, as the dashboard shows it.
 *
 * Course Shortlisted → Application Submitted → Offer Letter → CAS Received.
 * These labels are the same strings as the matching steps of `PROGRESS_STEPS`
 * above — the dashboard summary is those steps with the in-between ones
 * (document verification, visa, enrolment) folded away, not a second
 * vocabulary. Each stage says which backend `ApplicationStatus` values have
 * *reached* it; an application counts towards every stage up to its own.
 */
export const SUMMARY_STAGES = [
  { key: "shortlisted", label: PROGRESS_STEPS[0] },
  { key: "submitted", label: PROGRESS_STEPS[1] },
  { key: "offer", label: PROGRESS_STEPS[2] },
  { key: "cas", label: PROGRESS_STEPS[3] },
];

/** The furthest summary stage each status has reached (index into SUMMARY_STAGES). */
const SUMMARY_RANK = {
  requested: 0,
  request_rejected: 0,
  draft: 0,
  documents_pending: 0,
  ready_to_submit: 0,
  withdrawn: 0,
  submitted: 1,
  under_review: 1,
  rejected: 1,
  offer_received: 2,
  offer_accepted: 2,
  offer_declined: 2,
  cas_received: 3,
  visa_processing: 3,
  visa_approved: 3,
  visa_rejected: 3,
  enrolled: 3,
};

/**
 * Index of the furthest summary stage `status` has reached. A status this
 * build does not know yet — the backend added one — counts as shortlisted
 * rather than throwing or vanishing: it is at least an application.
 */
export const summaryStageOf = (status) => SUMMARY_RANK[status] ?? 0;

/**
 * The Applications list's filter chips: the four summary stages, in journey
 * order, each matching the applications *currently at* that stage.
 *
 * Built from `SUMMARY_STAGES` rather than listed separately, so the dashboard
 * card that says "2 · Offer Letter" and the chip it opens are the same set by
 * construction. `under_review` sits with Application Submitted: from the
 * student's side it is with the university, and the detail page's tracker
 * still says precisely which, for anyone who wants to know.
 */
export const STATUS_FILTERS = [
  { value: "all", label: "All", match: () => true },
  ...SUMMARY_STAGES.map((stage, index) => ({
    value: stage.key,
    label: stage.label,
    match: (status) => summaryStageOf(status) === index,
  })),
];

/** Filter values older links still carry (`?status=offer` etc.), mapped onto today's. */
const FILTER_ALIASES = { "in-review": "shortlisted", visa: "cas" };

/** A `?status=` value as a current filter value, or null if it names none. */
export const normalizeFilter = (value) => {
  const next = FILTER_ALIASES[value] ?? value;
  return STATUS_FILTERS.some((filter) => filter.value === next) ? next : null;
};
