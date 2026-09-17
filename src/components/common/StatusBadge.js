import React from "react";

// Shared status vocabulary for applications, appointments and documents so the
// same status never renders two different ways across screens. Colors are
// tuned to sit alongside the navy/ignite brand palette rather than stock
// Tailwind hues — "in progress" states use ignite instead of amber, success
// stays green, and neutral/danger stay legible without clashing.
const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600",
  submitted: "bg-navy-50 text-navy-700",
  "in-review": "bg-ignite-50 text-ignite-700",
  offer: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  withdrawn: "bg-slate-100 text-slate-500",
  pending: "bg-ignite-50 text-ignite-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-navy-50 text-navy-700",
  cancelled: "bg-red-50 text-red-600",
  uploading: "bg-navy-50 text-navy-700",
  uploaded: "bg-navy-50 text-navy-700",
  approved: "bg-emerald-50 text-emerald-700",
  verified: "bg-emerald-50 text-emerald-700",
  missing: "bg-red-50 text-red-600",
  booked: "bg-emerald-50 text-emerald-700",
  "not-booked": "bg-slate-100 text-slate-600",
  paid: "bg-emerald-50 text-emerald-700",
  due: "bg-ignite-50 text-ignite-700",
  overdue: "bg-red-50 text-red-600",
  preparing: "bg-ignite-50 text-ignite-700",
  waived: "bg-slate-100 text-slate-500",
  under_review: "bg-ignite-50 text-ignite-700",
  expired: "bg-red-50 text-red-600",
};

const STATUS_DOTS = {
  draft: "bg-slate-400",
  submitted: "bg-navy-500",
  "in-review": "bg-ignite-500",
  offer: "bg-emerald-500",
  rejected: "bg-red-500",
  withdrawn: "bg-slate-400",
  pending: "bg-ignite-500",
  confirmed: "bg-emerald-500",
  completed: "bg-navy-500",
  cancelled: "bg-red-500",
  uploading: "bg-navy-500",
  uploaded: "bg-navy-500",
  approved: "bg-emerald-500",
  verified: "bg-emerald-500",
  missing: "bg-red-500",
  booked: "bg-emerald-500",
  "not-booked": "bg-slate-400",
  paid: "bg-emerald-500",
  due: "bg-ignite-500",
  overdue: "bg-red-500",
  preparing: "bg-ignite-500",
  waived: "bg-slate-400",
  under_review: "bg-ignite-500",
  expired: "bg-red-500",
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
  under_review: "Under review",
  expired: "Expired",
};

const StatusBadge = ({ status, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
      STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
    } ${className}`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] ?? "bg-slate-400"}`} aria-hidden="true" />
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default StatusBadge;
