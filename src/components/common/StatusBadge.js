import React from "react";

// Shared status vocabulary for applications, appointments and documents so the
// same status never renders two different ways across screens.
const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-600",
  "in-review": "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-600",
  rejected: "bg-red-100 text-red-600",
  withdrawn: "bg-gray-100 text-gray-500",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-600",
  completed: "bg-blue-100 text-blue-600",
  cancelled: "bg-red-100 text-red-600",
  uploading: "bg-blue-100 text-blue-600",
  uploaded: "bg-blue-100 text-blue-600",
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
    className={`px-2 py-1 rounded text-xs font-medium capitalize ${
      STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
    } ${className}`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

export default StatusBadge;
