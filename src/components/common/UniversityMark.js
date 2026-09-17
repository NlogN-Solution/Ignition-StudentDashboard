import React from "react";

// A stable accent per university, derived from its name — same school
// always gets the same monogram tone across the list and detail views.
const TONES = [
  "from-navy-700 to-navy-900 text-white",
  "from-ignite-400 to-ignite-600 text-white",
  "from-navy-500 to-navy-700 text-white",
];
const toneForName = (name) => {
  const sum = [...(name || "")].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return TONES[sum % TONES.length];
};

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-14 w-14 text-sm",
};

/** University "logo" — a monogram badge in place of real per-university artwork. */
const UniversityMark = ({ name, size = "md", className = "" }) => {
  const initials = (name || "")
    .split(/\s+/)
    .filter((word) => word.length > 2 || /^[A-Z]/.test(word))
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold shadow-sm ring-2 ring-white ${SIZES[size]} ${toneForName(
        name
      )} ${className}`}
    >
      {initials}
    </div>
  );
};

export default UniversityMark;
