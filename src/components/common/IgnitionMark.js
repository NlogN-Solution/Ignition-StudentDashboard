import React from 'react';
import { Link } from 'react-router-dom';

import logo from '../../assets/logo.png';

/**
 * The Ignition wordmark.
 *
 * This used to draw a lucide `Rocket` in a gradient square next to the word
 * "ignition" in a system font — a reasonable stand-in, but a stand-in. The
 * real artwork has been in `src/assets/logo.png` all along and is the same
 * file the marketing site's `Logo.tsx` renders, so a student moving between
 * the public platform and the portal now sees one brand rather than two
 * interpretations of it.
 *
 * Sized by height with `w-auto`: the mark is 3:1 and pinning the width would
 * distort it the first time someone swaps in a differently proportioned file.
 *
 * `dark` knocks the whole lockup out to white. The wordmark is navy on
 * transparent, which is invisible on the login screen's navy panel, and there
 * is no white variant of the file in the repo. Inverting loses the orange and
 * blue of the flame, which is a real cost — but a legible monochrome mark on a
 * dark ground is the ordinary treatment for exactly this case, and it beats
 * either an unreadable logo or a white plate cut into the panel behind it.
 */
const IgnitionMark = ({ dark = false, to = '/', size = 'md' }) => {
  const height = size === 'sm' ? 'h-7' : 'h-9';

  return (
    <Link to={to} className="inline-flex items-center select-none" aria-label="Ignition — home">
      <img
        src={logo}
        alt="Ignition"
        className={`${height} w-auto ${dark ? 'brightness-0 invert' : ''}`}
      />
    </Link>
  );
};

export default IgnitionMark;
