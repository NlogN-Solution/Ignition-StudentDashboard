import React from 'react';

/**
 * Custom brand-colored illustration of a student studying/applying — used in
 * place of a stock photo so the login panel has no external asset dependency.
 * Flat-shape style, navy/orange only, matched to the marketing site's palette.
 */
const StudyIllustration = ({ className = '' }) => (
  <svg
    viewBox="0 0 400 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Illustration of a student studying at a laptop, surrounded by books and a graduation cap"
  >
    {/* Soft backdrop glow */}
    <ellipse cx="200" cy="230" rx="150" ry="18" fill="white" fillOpacity="0.06" />

    {/* Desk */}
    <rect x="60" y="210" width="280" height="14" rx="7" fill="white" fillOpacity="0.12" />
    <rect x="80" y="224" width="10" height="34" rx="3" fill="white" fillOpacity="0.1" />
    <rect x="310" y="224" width="10" height="34" rx="3" fill="white" fillOpacity="0.1" />

    {/* Book stack */}
    <g transform="translate(74,150)">
      <rect x="0" y="36" width="72" height="16" rx="3" fill="white" fillOpacity="0.9" transform="rotate(-2 36 44)" />
      <rect x="2" y="20" width="72" height="16" rx="3" fill="#FF7A3D" transform="rotate(3 38 28)" />
      <rect x="-2" y="4" width="72" height="16" rx="3" fill="white" fillOpacity="0.75" transform="rotate(-4 34 12)" />
    </g>

    {/* Chair */}
    <path d="M188 150 L188 214 M266 150 L266 214" stroke="white" strokeOpacity="0.15" strokeWidth="8" strokeLinecap="round" />

    {/* Student silhouette */}
    <g>
      {/* body */}
      <path
        d="M190 214 C190 176 206 156 228 156 C250 156 266 176 266 214 Z"
        fill="white"
        fillOpacity="0.92"
      />
      {/* head */}
      <circle cx="228" cy="122" r="26" fill="white" fillOpacity="0.92" />
      {/* hair */}
      <path
        d="M203 116 C201 96 213 82 228 82 C245 82 257 97 254 117 C249 108 241 104 228 104 C216 104 207 109 203 116 Z"
        fill="#0B1345"
      />
      {/* arm reaching to laptop */}
      <path
        d="M206 176 C196 182 188 190 184 200"
        stroke="white"
        strokeOpacity="0.92"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </g>

    {/* Laptop */}
    <g transform="translate(146,176)">
      <path d="M0 44 L92 44 L84 54 L8 54 Z" fill="white" fillOpacity="0.85" />
      <rect x="10" y="0" width="72" height="46" rx="4" fill="#0F1642" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="18" y="10" width="56" height="4" rx="2" fill="#FF5A1F" />
      <rect x="18" y="19" width="40" height="4" rx="2" fill="white" fillOpacity="0.6" />
      <rect x="18" y="28" width="48" height="4" rx="2" fill="white" fillOpacity="0.35" />
    </g>

    {/* Floating graduation cap */}
    <g className="ignition-float" style={{ animationDelay: '0s' }} transform="translate(276,60)">
      <path d="M27 0 L54 12 L27 24 L0 12 Z" fill="white" />
      <path d="M13 16 L13 28 C13 33 20 37 27 37 C34 37 41 33 41 28 L41 16" stroke="white" strokeWidth="2.5" fill="none" />
      <line x1="49" y1="12" x2="49" y2="30" stroke="#FF5A1F" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="49" cy="33" r="3" fill="#FF5A1F" />
    </g>

    {/* Sparkle accents */}
    <g fill="#FF7A3D">
      <path className="ignition-float" style={{ animationDelay: '0.6s' }} d="M100 70 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z" />
      <path className="ignition-float" style={{ animationDelay: '1.2s' }} d="M320 130 l2.5 6.5 6.5 2.5 -6.5 2.5 -2.5 6.5 -2.5 -6.5 -6.5 -2.5 6.5 -2.5 Z" />
      <path className="ignition-float" style={{ animationDelay: '0.3s' }} d="M64 100 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="white" fillOpacity="0.7" />
    </g>
  </svg>
);

export default StudyIllustration;
