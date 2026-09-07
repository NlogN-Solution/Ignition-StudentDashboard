// Minimal analytics seam.
//
// The portal has no analytics vendor wired in, and onboarding is not a good
// reason to add one. This is the single place a product event is announced
// from; when a real vendor arrives it is swapped in here and nothing that
// calls `trackEvent` has to change.
//
// It forwards to whatever the host page happens to expose (GTM's `dataLayer`,
// a Segment-style `window.analytics`) and is a no-op when neither exists, so
// dropping a tag manager onto the page is enough to start collecting.

const subscribers = new Set();

/** Local listeners — used by tests and by anything that wants to mirror
 * events into an in-app debug panel. Returns an unsubscribe function. */
export const onTrackedEvent = (listener) => {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
};

export const trackEvent = (event, properties = {}) => {
  const payload = { event, ...properties, timestamp: new Date().toISOString() };

  if (typeof window !== "undefined") {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    if (typeof window.analytics?.track === "function") {
      window.analytics.track(event, properties);
    }
  }

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, properties);
  }

  subscribers.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // A broken listener must not take down whatever triggered the event.
    }
  });
};

export default trackEvent;
