import React from "react";

// Shared status vocabulary for applications, appointments and documents so the
// same status never renders two different ways across screens.
const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-navy-100 text-navy-900",
  "in-review": "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-600",
  rejected: "bg-red-100 text-red-600",
  withdrawn: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-600",
  completed: "bg-navy-100 text-navy-900",
  cancelled: "bg-red-100 text-red-600",
  uploading: "bg-navy-100 text-navy-900",
  uploaded: "bg-navy-100 text-navy-900",
  approved: "bg-green-100 text-green-600",
  verified: "bg-green-100 text-green-600",
  missing: "bg-red-100 text-red-600",
  booked: "bg-green-100 text-green-600",
  "not-booked": "bg-gray-100 text-gray-600",
  paid: "bg-green-100 text-green-600",
  due: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-600",
  preparing: "bg-yellow-100 text-yellow-700",
  waived: "bg-gray-100 text-gray-500",
  under_review: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-600",
  cas_received: "bg-green-100 text-green-600",
  // The backend's `ApplicationStatus` values a student-opened application
  // moves through. Without them the badge printed the raw enum —
  // "Ready_to_submit" — which is the database talking, not the product.
  // A request nobody has accepted yet. Blue rather than yellow: yellow on
  // this screen means "you have something to do", and the student does not.
  requested: "bg-navy-100 text-navy-800",
  // The counsellor needs something from the student before accepting. Amber,
  // not red: it is a to-do, not a verdict.
  request_rejected: "bg-yellow-100 text-yellow-700",
  documents_pending: "bg-yellow-100 text-yellow-700",
  // Same tone as `under_review`, because they now say the same word.
  ready_to_submit: "bg-yellow-100 text-yellow-700",
  offer_received: "bg-green-100 text-green-600",
  offer_accepted: "bg-green-100 text-green-600",
  offer_declined: "bg-gray-100 text-gray-500",
  visa_processing: "bg-yellow-100 text-yellow-700",
  visa_approved: "bg-green-100 text-green-600",
  visa_rejected: "bg-red-100 text-red-600",
  enrolled: "bg-green-100 text-green-600",
};

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  "in-review": "In review",
  offer: "Offer received",
  rejected: "Not successful",
  withdrawn: "Withdrawn",
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  uploading: "Uploading",
  uploaded: "Uploaded",
  approved: "Approved",
  verified: "Verified",
  missing: "Missing",
  booked: "Booked",
  "not-booked": "Not booked",
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
  preparing: "Preparing",
  waived: "Waived",
  expired: "Expired",
  //: What a student's own "Apply" lands on. It says who is holding it,
  //: because "Requested" would describe the student's action rather than
  //: answer their question.
  requested: "With Ignition",
  request_rejected: "Needs more from you",
  documents_pending: "Documents needed",
  //: What a student's own submit lands on, and what `under_review` is called
  //: too: both are "somebody is reading it, it is not with you".
  //:
  //: They used to be "With your counsellor" and "In review", which is a
  //: distinction only the backend cares about — whether the reader is Ignition
  //: or the university — and it split one honest answer to "where is my
  //: application" across two words, two badge colours and two filter chips. A
  //: student reading "With your counsellor" next to another application's "In
  //: review" reasonably concluded they were at different stages.
  ready_to_submit: "In review",
  //: Reads the same for a document as for an application, so there is one
  //: entry rather than two that would shadow each other in this object.
  under_review: "In review",
  offer_received: "Offer received",
  cas_received: "CAS received",
  offer_accepted: "Offer accepted",
  offer_declined: "Offer declined",
  visa_processing: "Visa in progress",
  visa_approved: "Visa approved",
  visa_rejected: "Visa refused",
  enrolled: "Enrolled",
};

const StatusBadge = ({ status, className = "" }) => (
  <span
    className={`px-2 py-1 rounded text-xs font-medium ${
      STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
    } ${className}`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default StatusBadge;
