// Helpers that stand in for the things a backend would normally do.
// Nothing here touches the network — the delay only exists so that skeletons,
// spinners and success states still get exercised in the UI.

export const SIMULATED_LATENCY_MS = 700;

export const simulateDelay = (ms = SIMULATED_LATENCY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 0;

/** Locally generated id, in the same shape the JSON fixtures use. */
export const generateId = (prefix) => {
  idCounter += 1;
  return `${prefix}-local-${Date.now().toString(36)}${idCounter}`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/** "2 hours ago" style label used across the activity feed and notifications. */
export const formatRelativeTime = (value) => {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";

  const units = [
    { limit: 3600, divisor: 60, unit: "minute" },
    { limit: 86400, divisor: 3600, unit: "hour" },
    { limit: 2592000, divisor: 86400, unit: "day" },
    { limit: 31536000, divisor: 2592000, unit: "month" },
  ];

  for (const { limit, divisor, unit } of units) {
    if (seconds < limit) {
      const amount = Math.floor(seconds / divisor);
      return `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
    }
  }

  const years = Math.floor(seconds / 31536000);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

/** Whole days from now until `value`; negative once the date has passed. */
export const daysUntil = (value) => {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86400000);
};

export const formatDeadline = (value) => {
  const days = daysUntil(value);
  if (days === null) return "No deadline set";
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} remaining`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} remaining`;
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};
