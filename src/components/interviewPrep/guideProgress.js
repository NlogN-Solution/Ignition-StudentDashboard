import { useCallback, useEffect, useState } from "react";

/**
 * Which guides this student has marked as read — in this browser only.
 *
 * A convenience tick, not a record: nothing is gated on it, and a counsellor
 * learns how prepared a student is from what they hand in, not from this. So
 * browser storage is the right home, and every access is guarded because it
 * can be blocked or empty.
 */
const KEY = "ignition.interviewGuides.read";
const EVENT = "ignition:interview-guides-read";

const load = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

export const useGuidesRead = () => {
  const [read, setRead] = useState(load);

  useEffect(() => {
    const sync = () => setRead(load());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const setGuideRead = useCallback((slug, isRead) => {
    const next = isRead ? [...new Set([...load(), slug])] : load().filter((s) => s !== slug);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the tick lasts for this visit only.
    }
    setRead(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { read, setGuideRead };
};
