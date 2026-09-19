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
 * Nobody but Ignition is holding this one yet.
 *
 * `requested` included: from the student's side an application they opened and
 * one a counsellor has accepted are the same answer to "where is it" — with
 * us, not with a university. The distinction between them is an internal one
 * about whether work has been agreed to, and surfacing it as a separate group
 * would ask the student to care about our queue.
 */
export const IN_REVIEW_STATUSES = [
  "requested",
  "draft",
  "documents_pending",
  "ready_to_submit",
  "under_review",
];

export const SUBMITTED_STATUSES = ["submitted"];

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

/**
 * The filter chips, in journey order.
 *
 * "With your counsellor" and "In review" used to be two separate chips. They
 * are one now: both mean "someone is reading it, you cannot act on it", and
 * whether the reader is a counsellor or the university is a backend
 * distinction. Splitting it made two applications at the same point in the
 * journey look like they were at different ones. The timeline on the detail
 * page still says precisely which, for anyone who wants to know.
 */
export const STATUS_FILTERS = [
  { value: "all", label: "All", match: () => true },
  { value: "submitted", label: "Submitted", match: (status) => SUBMITTED_STATUSES.includes(status) },
  { value: "in-review", label: "In review", match: (status) => IN_REVIEW_STATUSES.includes(status) },
  { value: "offer", label: "Offers", match: (status) => OFFER_STATUSES.includes(status) },
  { value: "visa", label: "Visa & enrolment", match: (status) => VISA_STATUSES.includes(status) },
];

export const isKnownFilter = (value) => STATUS_FILTERS.some((filter) => filter.value === value);

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
 * The four-step progress card on the application page.
 *
 * Shortlisted → Submitted → Document verification → Offer letter. `reached` is
 * the index of the step the application is currently *on*; everything before it
 * is done. An application that was turned down or withdrawn stops where it is.
 */
export const PROGRESS_STEPS = [
  "Course Shortlisted",
  "Application Submitted",
  "Document Verification",
  "Offer Letter",
];

const STEP_OF_STATUS = {
  requested: 1,
  draft: 1,
  documents_pending: 1,
  ready_to_submit: 1,
  // Filed with the university and waiting: the submission is the live step
  // until the university starts checking documents.
  submitted: 1,
  under_review: 2,
  rejected: 2,
  withdrawn: 1,
};

/** Index of the step in progress; `PROGRESS_STEPS.length` when every step is done. */
export const progressStepOf = (status) => STEP_OF_STATUS[status] ?? PROGRESS_STEPS.length;
