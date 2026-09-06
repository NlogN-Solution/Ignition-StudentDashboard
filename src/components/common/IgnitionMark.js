import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

/** The "ignition" brand mark — rocket badge + wordmark, matched to the marketing site. */
const IgnitionMark = ({ dark = false, to = '/', size = 'md' }) => {
  const badge = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const text = size === 'sm' ? 'text-lg' : 'text-xl';

  return (
    <Link to={to} className="inline-flex items-center gap-2.5 select-none">
      <span
        className={`flex ${badge} shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ignite-400 to-ignite-600 shadow-md shadow-ignite-600/30`}
      >
        <Rocket className={`${icon} text-white`} strokeWidth={2.25} />
      </span>
      <span className={`${text} font-bold tracking-tight ${dark ? 'text-white' : 'text-navy-900'}`}>
        ignition
      </span>
    </Link>
  );
};

export default IgnitionMark;
