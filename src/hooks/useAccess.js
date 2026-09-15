import { useCallback, useEffect, useState } from "react";

import { getAccessState } from "../api/access";

/**
 * Whether this student has unlocked their application package.
 *
 * Read from the server every time the hook mounts. There is deliberately no
 * cache and no context: the answer changes exactly once per account, and a
 * stale `false` after a successful payment is the single worst thing this
 * could get wrong.
 *
 * It is **not** the security boundary either — the backend enforces the gate on
 * the document routes themselves, so a student who forced this to `true` would
 * still get a 402 from the file. This only decides which of two screens to
 * show.
 */
export const useAccess = () => {
  const [access, setAccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setAccess(await getAccessState());
    } catch {
      // Treat an unknown answer as locked. Failing open would hand out a
      // document the student has not paid for.
      setAccess((current) => current ?? { hasAccess: false, fee: null, methods: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { access, isLoading, reload, hasAccess: Boolean(access?.hasAccess) };
};
