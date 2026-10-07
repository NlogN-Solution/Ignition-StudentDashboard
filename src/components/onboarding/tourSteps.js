// The one place the dashboard walkthrough is described.
//
// To add, remove or reorder a step, edit this file — nothing else in the app
// needs to change. A step is only ever *described* here; finding it on screen,
// navigating to it and drawing it are the tour engine's job.
//
// Step shape
// ----------
//   id            stable key, also what analytics reports
//   target        CSS selector for a `data-tour` attribute on a real element.
//                 A step whose target never appears is skipped, not fatal —
//                 so it is safe to describe a section that only some students
//                 have.
//   route         path the student must be on for the target to exist. Omit
//                 for anything in the persistent shell (sidebar, header).
//   placement     preferred tooltip side; the engine overrides it when the
//                 preferred side would run off screen.
//   requiresNav   target lives in the sidebar, which is a drawer on mobile —
//                 the engine opens it for the step and closes it after.
//   title/body    copy. Either may be written as a function of the tour
//                 context so the wording reflects what the student has
//                 actually done.
//   tip           optional one-liner shown under the body.
//   enabled       optional predicate; a step that returns false is never
//                 built into the run at all.

import { STATUS_LABELS } from "../common/StatusBadge";

/** Application statuses this portal actually uses, in the order a student
 * meets them — read off the shared status vocabulary rather than invented. */
const APPLICATION_JOURNEY = ["draft", "submitted", "in-review", "offer"];

const applicationFlowSentence = () =>
  APPLICATION_JOURNEY.map((status) => STATUS_LABELS[status]).join(" → ");

const plural = (count, singular, pluralWord) =>
  `${count} ${count === 1 ? singular : pluralWord}`;

export const dashboardTourSteps = [
  {
    id: "dashboard-overview",
    target: '[data-tour="dashboard-overview"]',
    route: "/",
    placement: "bottom",
    title: "Your journey starts here",
    body: ({ applicationCount }) =>
      applicationCount > 0
        ? "This is your central dashboard. Your application progress, upcoming tasks and the latest updates are all summarised here, so you can see what needs your attention at a glance."
        : "This is your central dashboard. Once your counsellor opens your first application, its progress, your upcoming tasks and the latest updates all appear here.",
    tip: "Come back here first whenever you sign in — it always shows what changed.",
  },
  {
    id: "profile",
    target: '[data-tour="profile-overview"]',
    route: "/profile",
    placement: "bottom",
    title: ({ profileCompletion }) =>
      profileCompletion >= 90 ? "Your profile is ready" : "Complete your profile",
    body: ({ profileCompletion }) =>
      profileCompletion >= 90
        ? `Your profile is ${profileCompletion}% complete. Keep your personal, academic, contact and study information up to date — your counsellor uses it throughout your application.`
        : `Add and keep your personal, academic, contact and study information up to date. Your counsellor will use this information throughout your application.${
            profileCompletion > 0 ? ` You're at ${profileCompletion}% so far.` : ""
          }`,
    tip: "Use Edit Profile to fill in anything still missing.",
  },
  // No "explore courses" step: removed at the user's request (2026-10-02).
  // Explore stays in the sidebar; the tour just no longer stops on it.
  {
    id: "applications",
    target: '[data-tour="nav-applications"]',
    placement: "right",
    requiresNav: true,
    title: "Track your applications",
    body: ({ applicationCount }) =>
      applicationCount > 0
        ? `Every university application lives here — you currently have ${plural(
            applicationCount,
            "application",
            "applications"
          )}. Follow each one through ${applicationFlowSentence()}.`
        : `Once your counsellor opens an application for you it appears here, and you can follow it through ${applicationFlowSentence()}.`,
    tip: "Open an application to see its timeline and its own document checklist.",
  },
  {
    id: "documents",
    target: '[data-tour="nav-documents"]',
    placement: "right",
    requiresNav: true,
    title: "Keep your documents organised",
    body: ({ documentCount, pendingDocumentCount }) =>
      documentCount > 0
        ? `You've already got ${plural(documentCount, "document", "documents")} here${
            pendingDocumentCount > 0
              ? `, and ${pendingDocumentCount} still needs attention`
              : ""
          }. This is where you monitor their review status — your counsellor checks each one and tells you if anything needs re-uploading.`
        : "Upload and manage your passport, academic certificates, transcripts, English test results and financial documents. Your counsellor reviews each one and lets you know if anything needs to be updated.",
  },
  {
    id: "tasks",
    target: '[data-tour="nav-tasks"]',
    placement: "right",
    requiresNav: true,
    title: "Know exactly what to do next",
    body: ({ openTaskCount }) =>
      openTaskCount > 0
        ? `Your checklist holds the tasks your advisor has set for you — ${plural(
            openTaskCount,
            "task is",
            "tasks are"
          )} waiting right now.`
        : "When your advisor needs something from you, it appears here as a task. Tick each one off as you finish it.",
    tip: "The checklist icon in the header shows what's due without leaving the page.",
  },
  {
    id: "messages",
    target: '[data-tour="nav-messages"]',
    placement: "right",
    requiresNav: true,
    title: "Stay connected with your counsellor",
    body: "Use Messages whenever you need help. You can talk to your assigned counsellor and keep every important application conversation in one place.",
    tip: "Prefer to talk it through? Book a slot from Appointments.",
  },
  {
    id: "interviews",
    target: '[data-tour="nav-interviews"]',
    placement: "right",
    requiresNav: true,
    title: "Prepare for interviews",
    body: "Rehearse admission and visa interviews with guided practice sets, then review your score and the feedback on each answer before the real thing.",
  },
  // No "finance" step while My Finance is locked (still in development) —
  // the tour should not introduce a section the student cannot open.
  {
    id: "visa",
    target: '[data-tour="nav-visa"]',
    placement: "right",
    requiresNav: true,
    title: "Get ready for the next stage",
    body: "When your application progresses, this area walks you through visa requirements, appointments, fees and your pre-departure checklist.",
  },
  {
    id: "notifications",
    target: '[data-tour="notifications"]',
    placement: "bottom",
    title: "Never miss an important update",
    body: ({ unreadNotificationCount }) =>
      unreadNotificationCount > 0
        ? `Application updates, document requests, messages and deadlines land here — you have ${plural(
            unreadNotificationCount,
            "unread update",
            "unread updates"
          )} right now.`
        : "Application updates, document requests, messages, deadlines and status changes all appear here.",
  },
  {
    id: "help",
    target: '[data-tour="help-support"]',
    placement: "right",
    requiresNav: true,
    title: "Help is always available",
    body: "If you're ever unsure what to do next, book time with the support team from here — or message your counsellor and ask.",
  },
];

/** Resolves a step field that may be written as a function of the context. */
export const resolveStepText = (value, context) =>
  typeof value === "function" ? value(context) : value;

/**
 * The steps that apply to this student, with their copy still unresolved so
 * the tooltip re-reads it if the underlying data changes mid-tour.
 */
export const buildDashboardTourSteps = (context) =>
  dashboardTourSteps.filter((step) =>
    typeof step.enabled === "function" ? step.enabled(context) : true
  );

export default dashboardTourSteps;
