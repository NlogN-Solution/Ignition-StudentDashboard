import React, { useState } from "react";

import { applicationPill } from "../../lib/applicationStatus";

/**
 * The small pieces the Applications list and the application page share, so a
 * status or a university reads the same on both.
 */

const PILL_TONE_CLASSES = {
  navy: "bg-navy-50 text-navy-800",
  orange: "bg-ignite-50 text-ignite-600",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
  gray: "bg-gray-100 text-gray-600",
};

const DOT_TONE_CLASSES = {
  navy: "bg-navy-800",
  orange: "bg-ignite-500",
  green: "bg-emerald-500",
  red: "bg-red-500",
  gray: "bg-gray-400",
};

/** Dot + label pill for an application status. */
export const ApplicationStatusPill = ({ status, className = "" }) => {
  const { label, tone } = applicationPill(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[13px] font-semibold ${PILL_TONE_CLASSES[tone]} ${className}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT_TONE_CLASSES[tone]}`} />
      {label}
    </span>
  );
};

const MINOR_WORDS = new Set(["of", "the", "and", "for", "at", "in", "&"]);

/**
 * "University of Leicester" → "UL", "Oxford Brookes University" → "OBU".
 *
 * The catalogue's own `monogram` wins where it has one; this is the fallback
 * for the many records that do not.
 */
export const monogramOf = (name, monogram) => {
  if (monogram) return monogram.toUpperCase();
  const letters = String(name || "")
    .split(/\s+/)
    .filter((word) => word && !MINOR_WORDS.has(word.toLowerCase()))
    .map((word) => word[0].toUpperCase());
  return letters.slice(0, 3).join("") || "U";
};

/** Navy monogram disc — the list's university column. */
export const UniversityMonogram = ({ name, monogram, logoUrl, size = 44 }) => {
  const [failed, setFailed] = useState(false);
  const text = monogramOf(name, monogram);
  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        onError={() => setFailed(true)}
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full bg-white object-contain ring-1 ring-hairline"
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: text.length > 2 ? size * 0.3 : size * 0.34 }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-navy-900 font-bold tracking-tight text-white"
    >
      {text}
    </span>
  );
};

/**
 * The crest the application page leads with: the university's logo where the
 * catalogue has one, otherwise a heraldic shield carrying its monogram — so
 * the header never shows a broken image or an empty box.
 */
export const UniversityCrest = ({ name, monogram, logoUrl, size = 72 }) => {
  const [failed, setFailed] = useState(false);
  const text = monogramOf(name, monogram);
  return (
    <span
      style={{ width: size, height: size }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_-4px_rgba(11,19,69,0.18)] ring-1 ring-hairline"
    >
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          onError={() => setFailed(true)}
          className="h-[78%] w-[78%] object-contain"
        />
      ) : (
        <svg viewBox="0 0 48 56" aria-label={`${name} crest`} role="img" className="h-[72%] w-[72%]">
          <path
            d="M4 4h40v22c0 14-9.5 22.5-20 26C13.5 48.5 4 40 4 26V4z"
            fill="#0B1345"
            stroke="#C8102E"
            strokeWidth="2.5"
          />
          <path d="M4 4h40v10H4z" fill="#C8102E" />
          <path d="M24 16v34" stroke="#F4C542" strokeWidth="1.5" opacity="0.8" />
          <text
            x="24"
            y="36"
            textAnchor="middle"
            fontSize={text.length > 2 ? 11 : 14}
            fontWeight="700"
            fill="#fff"
            fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
          >
            {text}
          </text>
        </svg>
      )}
    </span>
  );
};

/** "Aug 1, 2026, 9:15 AM" — the table's timestamp format. */
export const formatStamp = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** "02 Aug 2026" — the application page's date format. */
export const formatDay = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
