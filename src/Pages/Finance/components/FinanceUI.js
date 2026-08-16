import React from "react";

// Shared presentational primitives for the Financial Readiness Center.
//
// These carry the finance module's existing look — white cards, green accents,
// h-2 rounded progress bars, the same framer-motion stagger — so the eight
// sections stay visually identical to the page they replaced. Nothing new is
// introduced here; it is the markup that used to be repeated inline.

export const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.2 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

/* ------------------------------------------------------------- statuses --- */

// One vocabulary for every finance status so the same word never renders two
// different ways across the eight sections.
const STATUS_STYLES = {
  // funding sources
  Available: "bg-green-100 text-green-600",
  Processing: "bg-yellow-100 text-yellow-600",
  Pending: "bg-blue-100 text-blue-600",
  Declined: "bg-red-100 text-red-600",
  // verification / documents / checklist
  verified: "bg-green-100 text-green-600",
  uploaded: "bg-blue-100 text-blue-600",
  pending: "bg-yellow-100 text-yellow-600",
  rejected: "bg-red-100 text-red-600",
  missing: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-600",
  // payments
  paid: "bg-green-100 text-green-600",
  due: "bg-yellow-100 text-yellow-600",
  upcoming: "bg-blue-100 text-blue-600",
  overdue: "bg-red-100 text-red-600",
  // loan tranches
  released: "bg-green-100 text-green-600",
  scheduled: "bg-blue-100 text-blue-600",
};

const STATUS_LABELS = {
  verified: "Verified",
  uploaded: "Uploaded",
  pending: "Pending",
  rejected: "Rejected",
  missing: "Missing",
  expired: "Expired",
  paid: "Paid",
  due: "Due soon",
  upcoming: "Upcoming",
  overdue: "Overdue",
  released: "Released",
  scheduled: "Scheduled",
};

export const StatusPill = ({ status, className = "" }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
      STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
    } ${className}`}
  >
    {STATUS_LABELS[status] ?? status}
  </span>
);

const SEVERITY_STYLES = {
  high: "bg-red-100 text-red-600",
  medium: "bg-yellow-100 text-yellow-600",
  low: "bg-green-100 text-green-600",
};

export const SeverityPill = ({ severity }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-xs font-medium capitalize ${
      SEVERITY_STYLES[severity] ?? "bg-gray-100 text-gray-600"
    }`}
  >
    {severity}
  </span>
);

/* --------------------------------------------------------------- pieces --- */

/** The pill that sat in the old "Total Cost Breakdown" card header. */
export const HeaderPill = ({ children, tone = "green" }) => (
  <span
    className={`px-3 py-1 text-sm rounded-full ${
      tone === "red"
        ? "bg-red-100 text-red-600"
        : tone === "yellow"
        ? "bg-yellow-100 text-yellow-600"
        : tone === "blue"
        ? "bg-blue-100 text-blue-600"
        : "bg-green-100 text-green-600"
    }`}
  >
    {children}
  </span>
);

const METER_TONES = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

/** The h-2 bar used throughout the original page. */
export const Meter = ({ value, tone = "green", className = "" }) => (
  <div className={`h-2 bg-gray-200 rounded-full ${className}`}>
    <div
      className={`h-2 rounded-full transition-all duration-500 ${
        METER_TONES[tone] ?? METER_TONES.green
      }`}
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

/** The bordered mini-metric box from the old "Financial Status" card. */
export const StatTile = ({ label, value, hint, tone = "gray" }) => (
  <div className="p-4 border rounded-lg hover:bg-gray-50 transition">
    <p className="text-gray-500 text-sm">{label}</p>
    <p
      className={`text-lg font-bold mt-1 ${
        tone === "green"
          ? "text-green-600"
          : tone === "red"
          ? "text-red-600"
          : "text-gray-800"
      }`}
    >
      {value}
    </p>
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

/** Label / value line used inside the requirement and loan cards. */
export const DetailRow = ({ label, value, strong, tone }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span
      className={`text-sm ${strong ? "font-bold" : "font-medium"} ${
        tone === "green"
          ? "text-green-600"
          : tone === "red"
          ? "text-red-600"
          : "text-gray-800"
      }`}
    >
      {value}
    </span>
  </div>
);

/** Small bordered row wrapper — matches the old funding / payment list items. */
export const ListRow = ({ children, className = "" }) => (
  <div className={`p-4 border rounded-lg hover:bg-gray-50 transition ${className}`}>
    {children}
  </div>
);
