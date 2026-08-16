import React from "react";

// The four illustrated stat icons that used to be inlined in courseSearch.js.
// Keyed by the `icon` field in formOptions.courseSearchStatistics.

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 64 64",
  className: "w-12 h-12 text-emerald-500",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
};

const ICONS = {
  students: (
    <svg {...baseProps}>
      <path d="M32 12 L8 24 L32 36 L56 24 Z" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L56 24" strokeDasharray="4 4" strokeLinecap="round" opacity="0.5" />
      <line x1="32" y1="36" x2="32" y2="54" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="54" r="2" fill="currentColor" stroke="none" />
      <rect x="16" y="38" width="32" height="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  faculty: (
    <svg {...baseProps}>
      <circle cx="32" cy="16" r="8" fill="none" strokeLinecap="round" />
      <path d="M24 28 Q32 24 40 28 L40 44 Q40 50 36 52 L28 52 Q24 50 24 44 Z" fill="none" strokeLinejoin="round" />
      <path d="M24 32 L16 40" fill="none" strokeLinecap="round" />
      <path d="M40 32 L48 40" fill="none" strokeLinecap="round" />
      <rect x="12" y="42" width="8" height="10" fill="none" strokeLinejoin="round" />
      <line x1="12" y1="46" x2="20" y2="46" strokeLinecap="round" />
      <line x1="32" y1="36" x2="32" y2="44" strokeLinecap="round" />
      <path d="M28 24 Q32 22 36 24" fill="none" strokeLinecap="round" />
    </svg>
  ),
  programs: (
    <svg {...baseProps}>
      <rect x="12" y="40" width="40" height="8" rx="2" fill="none" strokeLinejoin="round" />
      <line x1="12" y1="42" x2="52" y2="42" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="16" y="30" width="32" height="8" rx="2" fill="none" strokeLinejoin="round" />
      <line x1="16" y1="32" x2="48" y2="32" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="20" y="20" width="24" height="8" rx="2" fill="none" strokeLinejoin="round" />
      <line x1="20" y1="22" x2="44" y2="22" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 22 L46 22 L44 26 Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  countries: (
    <svg {...baseProps}>
      <circle cx="32" cy="32" r="20" fill="none" />
      <path d="M12 32 Q32 24 52 32 Q32 40 12 32 Z" fill="none" strokeWidth="1.5" />
      <path d="M20 20 Q32 16 44 20" fill="none" strokeWidth="1.5" />
      <path d="M20 44 Q32 48 44 44" fill="none" strokeWidth="1.5" />
      <path d="M32 12 Q24 32 32 52 Q40 32 32 12 Z" fill="none" strokeWidth="1.5" />
      <path d="M20 32 Q32 24 44 32 Q32 40 20 32 Z" fill="none" strokeWidth="1.5" />
      <path d="M36 18 L37 20 L34 20 Z" fill="currentColor" stroke="none" />
      <circle cx="36" cy="18" r="1" fill="white" />
      <path d="M28 46 L29 48 L26 48 Z" fill="currentColor" stroke="none" />
      <circle cx="28" cy="46" r="1" fill="white" />
      <path d="M44 36 L45 38 L42 38 Z" fill="currentColor" stroke="none" />
      <circle cx="44" cy="36" r="1" fill="white" />
      <path d="M20 28 L21 30 L18 30 Z" fill="currentColor" stroke="none" />
      <circle cx="20" cy="28" r="1" fill="white" />
    </svg>
  ),
};

const CourseSearchStatIcon = ({ name }) => ICONS[name] ?? null;

export default CourseSearchStatIcon;
