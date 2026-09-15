import { useEffect, useState } from "react";

import { getIntentPreview, peekIntentId } from "../lib/applyIntent";

/**
 * The course behind the pending intent, for screens the student has not
 * authenticated on yet.
 *
 * Used by the register and login screens. Returns null when there is no
 * intent, which is the common case — a student who came to the portal
 * directly — and those screens then render exactly as they always did.
 */
export const useApplyIntentPreview = () => {
  const [intent, setIntent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const id = peekIntentId();
    if (!id) return undefined;
    getIntentPreview(id).then((value) => {
      if (!cancelled) setIntent(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return intent;
};
