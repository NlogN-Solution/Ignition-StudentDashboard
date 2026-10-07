import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FolderOpen,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  Globe,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Stamp,
  Timer,
  Upload,
  UserRound,
  Wallet,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import StatusBadge, { STATUS_LABELS } from "../../components/common/StatusBadge";
import { SkeletonList } from "../../components/common/Skeleton";
import {
  UniversityCrest,
  formatDay,
} from "../../components/applications/ApplicationBits";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import {
  DOCUMENT_TYPE_LABELS,
  ISSUED_DOCUMENT_TYPES,
  getApplicationApi,
  getApplicationChecklistApi,
  getApplicationDocumentsApi,
  getApplicationTimeline,
  linkChecklistItemDocumentApi,
  submitApplicationApi,
} from "../../api/studentPortal";
import {
  CAS_STAGES,
  OFFER_STATUSES,
  OFFER_TYPE_LABELS,
  PROGRESS_STEPS,
  STOPPED_STATUSES,
  VISA_STATUSES,
  applicationPill,
  hasOffer,
  progressStepOf,
} from "../../lib/applicationStatus";
import { openDocumentFile } from "../../lib/documentFile";
import { bestVaultMatch } from "../../lib/reusableDocuments";
import { getJourney } from "../../api/journey";
import JourneyPanel, { JourneySummaryCard } from "../../components/journey/JourneyPanel";
import { formatDate, formatFileSize } from "../../lib/simulate";
import { parseApiErrorDetail } from "../../lib/apiErrors";

const HERO_FALLBACK_IMAGE = "/images/campus-historic.webp";

//: First when the application has a journey (UK applications); see `tabsFor`.
const JOURNEY_TAB = { id: "journey", label: "Journey" };

const TABS = [
  { id: "overview", label: "Overview" },
  // Fees & Funding lives inside Course Details: a seventh tab pushed the strip
  // past the column width and made it scroll sideways.
  { id: "course", label: "Course Details" },
  { id: "requirements", label: "Requirements" },
  { id: "timeline", label: "Timeline" },
  { id: "documents", label: "Documents" },
];

/* ------------------------------------------------------------- formatting --- */

const money = (amount, symbol = "£") =>
  amount === null || amount === undefined || amount === ""
    ? null
    : `${symbol}${Number(amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const durationLabel = (course, courseName) => {
  if (!course) return null;
  let label = null;
  if (course.durationYears) {
    const years = Number(course.durationYears);
    label = `${years % 1 === 0 ? years : years.toFixed(1)} Year${years === 1 ? "" : "s"}`;
  } else if (course.durationMonths) {
    const months = course.durationMonths;
    label =
      months % 12 === 0
        ? `${months / 12} Year${months === 12 ? "" : "s"}`
        : `${months} Month${months === 1 ? "" : "s"}`;
  }
  if (label && /top[\s-]?up/i.test(courseName ?? "")) label += " (Top-Up)";
  return label;
};

/** "16th August 2026" — how the notice box states a date. */
const longOrdinalDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix} ${date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
};

const rankingBadge = (ranking) => {
  if (!ranking) return null;
  if (ranking.position && ranking.scope) {
    return `${ranking.position} in ${ranking.scope}${ranking.category ? ` (${ranking.category})` : ""}`;
  }
  return ranking.title;
};

const locationOf = (application) => {
  const university = application.university;
  const country = application.universityCountry === "United Kingdom" ? "UK" : application.universityCountry;
  const region = university?.region ? university.region.split(" — ")[0] : null;
  return [university?.city, region, country].filter(Boolean).join(", ") || null;
};

/* ---------------------------------------------------------------- pieces --- */

const SectionTitle = ({ icon: Icon, children, action }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-3 text-[17px] font-semibold text-navy-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      {children}
    </h2>
    {action}
  </div>
);

const Card = ({ children, className = "" }) => (
  <section className={`rounded-2xl border border-hairline bg-white shadow-card ${className}`}>{children}</section>
);

const HeroFact = ({ icon: Icon, label, value }) => (
  <div className="flex min-w-0 items-center gap-3">
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
    </span>
    <div className="min-w-0">
      <p className="text-[12px] leading-tight text-ink-muted">{label}</p>
      {/* Wraps rather than overflowing: a fee range or a long intake name
          must never push the card wider than its column. */}
      <p className="mt-1 break-words text-[14px] font-semibold leading-snug text-navy-900">
        {value || "To be confirmed"}
      </p>
    </div>
  </div>
);

/**
 * One headline figure out of the catalogue's fee prose.
 *
 * Route fee text is written for people, not layouts — "Full time: £15,500
 * Extended Master's: £15,500+£3,500" — and printed verbatim it wrapped the hero
 * into a column of fragments. The hero states the first figure the way the
 * design does ("£15,500.00 / year"), or a range where the text opens with one;
 * the full wording stays in Course Details, where there is room for it.
 */
const feeHeadline = (text, symbol = "£") => {
  if (!text) return null;
  const pattern = /([£$€])\s?(\d[\d,]*(?:\.\d+)?)(?:\s*(?:-|–|to)\s*[£$€]?\s?(\d[\d,]*(?:\.\d+)?))?/;
  const match = String(text).match(pattern);
  if (!match) return null;
  const currency = match[1] || symbol;
  const low = Number(match[2].replace(/,/g, ""));
  const high = match[3] ? Number(match[3].replace(/,/g, "")) : null;
  if (!low) return null;
  const whole = (n) => `${currency}${n.toLocaleString("en-GB")}`;
  return high && high !== low ? `${whole(low)} – ${whole(high)} / year` : `${money(low, currency)} / year`;
};

const DetailFact = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-ink-faint" strokeWidth={1.75} aria-hidden />
    <div className="min-w-0">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-[15px] font-medium text-navy-900">{value || "—"}</p>
    </div>
  </div>
);

/** Prose from the catalogue, printed only where there is some. */
const Prose = ({ title, children }) =>
  children ? (
    <div>
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  ) : null;

const TabEmpty = ({ children }) => <p className="text-sm text-ink-muted">{children}</p>;

/* ------------------------------------------------------------- progress --- */

/** The line under a step: a date, a state, or why the journey stopped. */
const stepCaption = (application, index, current, date) => {
  const { status } = application;
  if (index === current) {
    if (STOPPED_STATUSES.includes(status)) return applicationPill(status).label;
    if (status === "visa_processing") return date ? `Lodged ${date} · awaiting decision` : "Awaiting decision";
    return "In progress";
  }
  if (index < current) {
    // The visa step is "done" once it is decided; say which way.
    if (PROGRESS_STEPS[index] === "Visa Lodged") {
      const decided = formatDay(application.visaDecisionDate);
      return decided ? `Approved · ${decided}` : "Approved";
    }
    return date ?? "Completed";
  }
  return "Pending";
};

/* Compact rows — label and caption on one line — so seven steps sit beside
   the hero card at the same height instead of running a screen down. */
const ProgressCard = ({ application, stepDates, className = "" }) => {
  const current = progressStepOf(application.status);
  const stopped = STOPPED_STATUSES.includes(application.status);
  const stepNumber = Math.min(current + 1, PROGRESS_STEPS.length);

  return (
    <Card className={`flex flex-col p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-semibold text-navy-900">Application Progress</h2>
        <span className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-900">
          {current >= PROGRESS_STEPS.length ? "Complete" : `Step ${stepNumber} of ${PROGRESS_STEPS.length}`}
        </span>
      </div>

      <ol className="mt-4 flex flex-1 flex-col justify-between">
        {PROGRESS_STEPS.map((label, index) => {
          const done = index < current;
          const isCurrent = index === current;
          const last = index === PROGRESS_STEPS.length - 1;
          const caption = stepCaption(application, index, current, formatDay(stepDates[index]));
          return (
            <li key={label} className="relative flex items-center gap-3 py-[5px]">
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-[12px] top-[calc(50%+13px)] h-[calc(100%-16px)] w-0.5 ${
                    done ? "bg-emerald-400" : "bg-gray-200"
                  }`}
                />
              )}
              <span
                aria-hidden
                className={`relative z-10 flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? stopped
                      ? "border-2 border-red-500 bg-white text-red-600"
                      : "border-2 border-navy-500 bg-white text-navy-900"
                    : "border border-gray-300 bg-white text-ink-faint"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} /> : index + 1}
              </span>
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <p
                  className={`truncate text-sm ${
                    isCurrent ? (stopped ? "font-semibold text-red-600" : "font-semibold text-navy-900") : "font-medium text-navy-900"
                  }`}
                >
                  {label}
                </p>
                <p
                  className={`flex-shrink-0 text-right text-xs ${
                    isCurrent && stopped ? "font-medium text-red-600" : done ? "text-emerald-700" : "text-ink-muted"
                  }`}
                >
                  {caption}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

/** What the student should do next, worked out from where the file is. */
const nextStepOf = (application, outstandingCount) => {
  const { status } = application;
  if (outstandingCount > 0) {
    return {
      title: "Submit Required Documents",
      body: "Complete your document verification to move to the next stage.",
      cta: "Upload Documents",
      tab: "documents",
    };
  }
  if (status === "requested") {
    return {
      title: "Your counsellor is reviewing your request",
      body: "They'll accept it and open your application — message them if anything has changed.",
      cta: "Message Counsellor",
      to: "/messages",
    };
  }
  if (status === "request_rejected") {
    return {
      title: "Your counsellor needs more from you",
      body: "Do what they asked — usually uploading documents or completing your profile — then send the request again.",
      cta: "Upload Documents",
      to: "/documents",
    };
  }
  if (["draft", "documents_pending", "ready_to_submit"].includes(status)) {
    return {
      title: "Get your application ready",
      body: "Keep your documents up to date so your counsellor can submit it to the university.",
      cta: "View Documents",
      tab: "documents",
    };
  }
  if (["submitted", "under_review"].includes(status)) {
    return {
      title: "Await the university's decision",
      body: "Your application is with the university. We'll let you know the moment anything changes.",
      cta: "View Timeline",
      tab: "timeline",
    };
  }
  if (OFFER_STATUSES.includes(status) && status !== "cas_received") {
    return {
      title: "Review your offer",
      body: "Your offer letter is ready. Read the conditions and talk them through with your counsellor.",
      cta: "View Offer",
      tab: "documents",
    };
  }
  if (status === "cas_received" || VISA_STATUSES.includes(status)) {
    if (status === "enrolled") {
      return {
        title: "You're enrolled",
        body: "Congratulations — everything you need for arrival is on your dashboard.",
        cta: "Go to Dashboard",
        to: "/",
      };
    }
    return {
      title: "Prepare your visa",
      body: "Your CAS unlocks the visa application. Track every step on the Visa page.",
      cta: "Open Visa",
      to: "/visa",
    };
  }
  if (status === "rejected" || status === "withdrawn") {
    return {
      title: "Explore your other options",
      body: "This one didn't work out. Your counsellor can help you find courses that fit just as well.",
      cta: "Explore Courses",
      to: "/explore",
    };
  }
  return null;
};

const NextStepCard = ({ step, onTab }) => {
  if (!step) return null;
  const buttonClass =
    "mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-navy-950";
  return (
    <section className="relative rounded-2xl border border-hairline bg-white p-5 shadow-card">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-muted">
        <Send className="h-3.5 w-3.5" aria-hidden />
        Next step
      </p>
      <h2 className="mt-2 text-[16px] font-semibold text-navy-900">{step.title}</h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{step.body}</p>
      {step.to ? (
        <Link to={step.to} className={buttonClass}>
          {step.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <button type="button" onClick={() => onTab(step.tab)} className={buttonClass}>
          {step.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </section>
  );
};

/**
 * The assigned counsellor and how to reach them.
 *
 * Name, phone and email come from the application detail API — the
 * application's `counsellor` relation, summarised server-side as
 * `ApplicationCounsellorSummary` — never from anything in the frontend.
 * WhatsApp is offered only when there is a phone number to open it with.
 */
const CounsellorCard = ({ application }) => {
  const { counsellorName: name, counsellorPhone: phone, counsellorEmail: email } = application;
  const dial = phone ? phone.replace(/[^\d+]/g, "") : null;
  const initials = (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const actionClass =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-navy-900 text-[13px] font-semibold text-white transition-colors hover:bg-navy-950";

  return (
    <Card className="p-5">
      <h2 className="text-[16px] font-semibold text-navy-900">Your counsellor</h2>
      {name ? (
        <>
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 text-[13px] font-semibold text-white"
            >
              {initials || <UserRound className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-navy-900">{name}</p>
              <p className="text-[12px] text-ink-muted">Assigned to this application</p>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-[13px]">
            {phone && (
              <a href={`tel:${dial}`} className="flex items-center gap-2.5 text-ink-soft hover:text-navy-900">
                <Phone className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex min-w-0 items-center gap-2.5 text-ink-soft hover:text-navy-900">
                <Mail className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                <span className="truncate">{email}</span>
              </a>
            )}
          </div>
          <div className={`mt-4 grid gap-2 ${phone ? "grid-cols-3" : "grid-cols-2"}`}>
            {phone && (
              <a href={`tel:${dial}`} className={actionClass}>
                <Phone className="h-3.5 w-3.5" aria-hidden />
                Call
              </a>
            )}
            {email ? (
              <a href={`mailto:${email}`} className={actionClass}>
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Email
              </a>
            ) : (
              <Link to="/messages" className={actionClass}>
                <Mail className="h-3.5 w-3.5" aria-hidden />
                Message
              </Link>
            )}
            {phone ? (
              <a
                href={`https://wa.me/${dial.replace(/^\+/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass}
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                WhatsApp
              </a>
            ) : (
              <Link to="/messages" className={actionClass}>
                <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                Chat
              </Link>
            )}
          </div>
        </>
      ) : (
        <p className="mt-3 text-[13px] leading-5 text-ink-muted">
          A counsellor will be assigned to your application shortly — their name, phone and email will appear here.
        </p>
      )}
    </Card>
  );
};

/* ---------------------------------------------------------------- tabs --- */

const OverviewTab = ({ application }) => {
  const university = application.university;
  const rankings = university?.rankings ?? [];
  const qs = rankings.find((ranking) => /\bQS\b/i.test(ranking.source ?? ""));
  const featured = qs ?? rankings.find((ranking) => ranking.position);
  const badges = (rankings.length ? rankings.map(rankingBadge) : university?.highlights ?? [])
    .filter(Boolean)
    .slice(0, 2);
  const website = university?.website || (university?.slug ? `/explore/universities/${university.slug}` : null);
  const isExternal = Boolean(university?.website);

  const deadlines = [
    { label: "Application Deadline", date: application.applicationDeadline },
    { label: "Payment Deadline", date: application.paymentDeadline },
  ];

  const notices = [
    application.conditionDeadline && `Condition meeting deadline : ${longOrdinalDate(application.conditionDeadline)}`,
    ...(application.studentNotice || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  ].filter(Boolean);

  return (
    <Card>
      {/* University details */}
      <div className="p-6">
        <SectionTitle
          icon={Landmark}
          action={
            website &&
            (isExternal ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-900 hover:underline"
              >
                View on Details <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            ) : (
              <Link
                to={website}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-900 hover:underline"
              >
                View Details <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            ))
          }
        >
          University Details
        </SectionTitle>

        <div className="mt-4 flex items-center gap-5 border-b border-hairline pb-5">
          <UniversityCrest
            name={application.universityName}
            monogram={university?.monogram || application.universityMonogram}
            logoUrl={university?.logoUrl || application.universityLogoUrl}
            size={72}
          />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-navy-900">{application.universityName}</h3>
            {badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 rounded-full bg-navy-50/70 px-3 py-1 text-xs font-medium text-navy-900"
                  >
                    {index === 0 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" aria-hidden />
                    ) : (
                      <Globe className="h-3.5 w-3.5 text-navy-900" aria-hidden />
                    )}
                    <span className={index === 0 ? "" : "text-navy-900"}>{badge}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <DetailFact icon={MapPin} label="Location" value={locationOf(application)} />
          <DetailFact icon={Landmark} label="Type" value={university?.kind || "University"} />
          <DetailFact
            icon={ShieldCheck}
            label={qs || !featured ? "QS Ranking" : "Ranking"}
            value={
              featured
                ? `${/^\d+$/.test(featured.position) ? `#${featured.position}` : featured.position} (${featured.scope || "World"})`
                : "Not listed"
            }
          />
        </div>
      </div>

      {/* Deadlines + notice */}
      <div className="border-t border-hairline p-6">
        <SectionTitle icon={CalendarDays}>Key Deadlines</SectionTitle>
        <ul className="mt-4 space-y-3">
          {deadlines.map((deadline) => (
            <li key={deadline.label} className="flex items-center gap-3">
              <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
              </span>
              <span className="w-44 text-sm text-navy-900">{deadline.label}</span>
              {deadline.date ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ignite-50 px-3 py-1 text-sm font-medium text-ignite-700">
                  <Clock className="h-4 w-4" aria-hidden />
                  {formatDay(deadline.date)}
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-ink-muted">To be confirmed</span>
              )}
            </li>
          ))}
        </ul>

        {notices.length > 0 && (
          <div className="mt-6 flex items-start gap-4 rounded-xl bg-gradient-to-r from-ignite-50 to-red-50/70 px-6 py-4">
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ignite-300 text-white">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-ignite-700">Please note:</p>
              <ol className="mt-1 space-y-0.5 text-[13px] text-ignite-700">
                {notices.map((notice, index) => (
                  <li key={notice}>
                    {index + 1}. {notice}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

/** A labelled block inside Course Details — Course, Fees, Funding. */
const SubSection = ({ title, children }) => (
  <div className="border-t border-hairline pt-5 first:border-t-0 first:pt-0">
    <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-ink-muted">{title}</h3>
    <div className="mt-4 space-y-5">{children}</div>
  </div>
);

/**
 * Course Details, with Fees and Funding folded in.
 *
 * One card with three labelled sub-sections rather than two tabs: fees are a
 * property of the course, and a separate tab both hid them from anyone reading
 * about the course and pushed the tab strip past the column width. Only fields
 * the API actually returns are shown — there is no per-application application
 * fee or funding status on the backend, so neither is invented here.
 */
const CourseTab = ({ application }) => {
  const course = application.course;
  const symbol = course?.currencySymbol ?? "£";
  const tuition = application.tuitionFee ?? course?.tuitionFee ?? null;
  const hasTuition = tuition !== null && tuition !== undefined;
  const scholarship = application.scholarshipAmount;
  const payable = hasTuition ? Number(tuition) - Number(scholarship ?? 0) : null;
  const modules = (course?.modules ?? [])
    .map((module) => (typeof module === "string" ? module : module.title ?? module.name ?? null))
    .filter(Boolean);

  return (
    <Card className="space-y-6 p-6">
      <SectionTitle icon={GraduationCap}>Course Details</SectionTitle>

      <SubSection title="Course">
        {!course && <TabEmpty>Full course details aren't available yet.</TabEmpty>}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailFact icon={BookOpen} label="Course" value={application.courseName} />
          <DetailFact icon={Building2} label="University" value={application.universityName} />
          <DetailFact icon={MapPin} label="Campus" value={course?.campus} />
          <DetailFact icon={CalendarDays} label="Intake" value={application.intakeDetail?.name || application.intake} />
          <DetailFact icon={GraduationCap} label="Study level" value={course?.qualification || application.degreeLevel} />
          <DetailFact icon={Timer} label="Duration" value={durationLabel(course, application.courseName)} />
          <DetailFact icon={Clock} label="Study mode" value={application.studyMode || course?.courseType} />
          {course?.intakesSummary?.length > 0 && (
            <DetailFact icon={CalendarDays} label="Other intakes" value={course.intakesSummary.join(", ")} />
          )}
        </div>
        <Prose title="Overview">{course?.overview}</Prose>
        <Prose title="What you'll study">{course?.whatYouStudy}</Prose>
        {modules.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-navy-900">Modules</h4>
            <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {modules.map((module) => (
                <li key={module} className="rounded-lg bg-canvas px-3 py-2 text-sm text-ink-soft ring-1 ring-hairline">
                  {module}
                </li>
              ))}
            </ul>
          </div>
        )}
        {course?.careerOutcomes?.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-navy-900">Career outcomes</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {course.careerOutcomes.map((outcome) => (
                <span key={outcome} className="rounded-full bg-navy-50 px-3 py-1 text-xs font-medium text-navy-900">
                  {outcome}
                </span>
              ))}
            </div>
          </div>
        )}
        {course && !course.overview && !course.whatYouStudy && modules.length === 0 && application.university?.slug && (
          <Link
            to={`/explore/universities/${application.university.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 hover:text-navy-600"
          >
            See the full course listing <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </SubSection>

      <SubSection title="Fees">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailFact
            icon={Wallet}
            label="Tuition fee"
            value={hasTuition ? `${money(tuition, symbol)} / year` : feeHeadline(course?.feeStructure, symbol)}
          />
          <DetailFact icon={Landmark} label="CAS deposit" value={course?.casDeposit} />
          <DetailFact icon={FileCheck} label="Enrolment fee" value={course?.enrolmentFee} />
        </div>
        <Prose title="Fee structure">{course?.feeStructure}</Prose>
      </SubSection>

      <SubSection title="Funding">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailFact icon={Award} label="Scholarship" value={scholarship ? money(scholarship, symbol) : "None recorded"} />
          <DetailFact
            icon={CheckCircle2}
            label="Payable after scholarship"
            value={payable !== null ? money(payable, symbol) : null}
          />
          {application.university?.livingCostMonthly ? (
            <DetailFact
              icon={Wallet}
              label="Living costs"
              value={`Around ${money(application.university.livingCostMonthly, "£")} / month`}
            />
          ) : null}
        </div>
        <Prose title="Scholarships available">{course?.scholarshipText}</Prose>
      </SubSection>
    </Card>
  );
};

const listOf = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const RequirementsTab = ({ application }) => {
  const course = application.course;
  const academic = listOf(course?.requirements?.academic);
  const documents = listOf(course?.requirements?.documents);
  const hasAny =
    course &&
    (course.academicCriteria || course.englishCriteria || course.minimumIelts || course.extraRequirements || academic.length || documents.length);
  return (
    <Card className="space-y-6 p-6">
      <SectionTitle icon={FileCheck}>Entry Requirements</SectionTitle>
      {!hasAny && <TabEmpty>Your counsellor will confirm the entry requirements for this course.</TabEmpty>}
      <Prose title="Academic">{course?.academicCriteria}</Prose>
      {academic.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
          {academic.map((line) => (
            <li key={String(line)}>{String(line)}</li>
          ))}
        </ul>
      )}
      <Prose title="English language">
        {course?.englishCriteria || (course?.minimumIelts ? `IELTS ${course.minimumIelts} overall` : null)}
      </Prose>
      <Prose title="English waiver">{course?.englishWaiver}</Prose>
      <Prose title="Additional requirements">{course?.extraRequirements}</Prose>
      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-navy-900">Documents</h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            {documents.map((line) => (
              <li key={String(line)}>{String(line)}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

const TimelineTab = ({ steps, isLoading }) => (
  <Card className="p-6">
    <SectionTitle icon={Clock}>Timeline</SectionTitle>
    <div className="mt-5">
      {isLoading ? (
        <SkeletonList count={2} />
      ) : steps.length === 0 ? (
        <TabEmpty>No status changes recorded yet.</TabEmpty>
      ) : (
        <ol>
          {steps.map((step, index) => (
            <li key={step.id} className="relative flex gap-4 pb-5 last:pb-0">
              {index < steps.length - 1 && (
                <span aria-hidden className="absolute left-[11px] top-7 h-[calc(100%-28px)] w-0.5 bg-gray-200" />
              )}
              {step.state === "current" ? (
                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-navy-500 bg-white">
                  <span className="h-2 w-2 rounded-full bg-navy-900" />
                </span>
              ) : (
                <CheckCircle2 className="relative z-10 h-6 w-6 fill-emerald-500 text-white" aria-hidden />
              )}
              <div className="min-w-0">
                <p className={`text-sm ${step.state === "current" ? "font-semibold text-navy-900" : "font-medium text-navy-900"}`}>
                  {STATUS_LABELS[step.label] ?? step.label}
                </p>
                {step.date && <p className="mt-0.5 text-[13px] text-ink-muted">{formatDate(step.date)}</p>}
                {step.remarks && <p className="mt-1 text-[13px] text-ink-soft">{step.remarks}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  </Card>
);

const DocumentRow = ({ document, onOpen }) => (
  <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline p-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <FileText className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-navy-900">
          {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.title}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {document.file?.name}
          {document.file?.sizeBytes ? ` · ${formatFileSize(document.file.sizeBytes)}` : ""}
        </p>
      </div>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(document, "inline")}
        className="flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-navy-200 hover:text-navy-600"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        View
      </button>
      <button
        type="button"
        onClick={() => onOpen(document, "attachment")}
        className="flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-navy-200 hover:text-navy-600"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Download
      </button>
    </div>
  </li>
);

const DocumentsTab = ({
  application,
  documents,
  isDocumentsLoading,
  checklist,
  isChecklistLoading,
  uploadingItemId,
  fileInputRefs,
  onUpload,
  onReuse,
  vaultDocuments,
  onOpen,
}) => {
  const offerDocuments = documents.filter((doc) => doc.documentType === "offer_letter");
  const casDocuments = documents.filter((doc) => doc.documentType === "cas_letter");
  const supportingDocuments = documents.filter((doc) => !ISSUED_DOCUMENT_TYPES.includes(doc.documentType));
  const showOffer = hasOffer(application.status) || offerDocuments.length > 0;
  const showCas = CAS_STAGES.includes(application.status) || casDocuments.length > 0;

  const issuedRows = (list) =>
    list.map((document) => <DocumentRow key={document.id} document={document} onOpen={onOpen} />);

  return (
    <div className="space-y-5">
      {/* Offer — first once there is one: it is the thing the student came for. */}
      {showOffer && (
        <Card className="border-emerald-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Award className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-navy-900">
                  {application.status === "offer_declined" ? "Offer declined" : "Your offer"}
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {application.offerReceivedDate
                    ? `${application.universityName} issued it on ${formatDate(application.offerReceivedDate)}.`
                    : `${application.universityName} has made you an offer.`}
                </p>
                {/* A conditional offer is a place *if* the conditions are met;
                    "Offer received" alone reads as unconditional. */}
                {application.offerType && (
                  <p className="mt-1.5 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-soft ring-1 ring-hairline">
                    {OFFER_TYPE_LABELS[application.offerType] ?? application.offerType}
                  </p>
                )}
              </div>
            </div>
            <StatusBadge status={application.status} />
          </div>
          {isDocumentsLoading ? (
            <div className="mt-4">
              <SkeletonList count={1} />
            </div>
          ) : offerDocuments.length > 0 ? (
            <ul className="mt-4 space-y-2">{issuedRows(offerDocuments)}</ul>
          ) : (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Your counsellor is filing the letter — it will appear here as soon as it is uploaded.
            </p>
          )}
        </Card>
      )}

      {/* CAS — "not yet" is information: it is where UK applications stall. */}
      {showCas && (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-navy-900">
              <Stamp className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h3 className="font-semibold text-navy-900">
                {application.casReceivedDate ? "Your CAS" : "CAS not issued yet"}
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                {application.casReceivedDate
                  ? `Issued on ${formatDate(application.casReceivedDate)}.${
                      application.casNumber ? ` Reference ${application.casNumber}.` : ""
                    } You need it to apply for your visa.`
                  : "The university issues this once you have accepted your offer and settled the deposit. Your counsellor will chase it."}
              </p>
            </div>
          </div>
          {casDocuments.length > 0 && <ul className="mt-4 space-y-2">{issuedRows(casDocuments)}</ul>}
        </Card>
      )}

      {/* Requested documents */}
      <Card className="p-6">
        <SectionTitle icon={FileCheck}>Requested Documents</SectionTitle>
        <div className="mt-4">
          {isChecklistLoading ? (
            <SkeletonList count={2} />
          ) : checklist.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              Nothing requested yet
            </div>
          ) : (
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item.id} className="rounded-xl border border-hairline p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-navy-900">
                      {item.label}
                      {!item.isRequired && <span className="ml-1.5 text-xs text-ink-faint">(optional)</span>}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  {item.notes && <p className="mt-1 text-xs text-ink-muted">{item.notes}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {item.documentId && (
                      <button
                        type="button"
                        onClick={() => onOpen({ id: item.documentId }, "inline")}
                        className="flex items-center gap-1 text-xs font-medium text-navy-900 hover:text-navy-600"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        View what you sent
                      </button>
                    )}
                    {(item.status === "pending" || item.status === "rejected") && (
                      <>
                        {(() => {
                          const match = bestVaultMatch(vaultDocuments, item.documentType);
                          if (!match || match.id === item.documentId) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => onReuse(item, match.id)}
                              disabled={uploadingItemId === item.id}
                              title={`Use ${match.file?.name ?? "the file"} from your Paper Vault`}
                              className="flex items-center gap-1 rounded-lg border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-navy-900 hover:border-navy-200 disabled:opacity-60"
                            >
                              <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                              Use from vault
                            </button>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                          disabled={uploadingItemId === item.id}
                          className="flex items-center gap-1 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-950 disabled:opacity-60"
                        >
                          <Upload className="h-3.5 w-3.5" aria-hidden />
                          {uploadingItemId === item.id ? "Uploading…" : item.status === "rejected" ? "Re-upload" : "Upload"}
                        </button>
                        <input
                          ref={(element) => {
                            fileInputRefs.current[item.id] = element;
                          }}
                          type="file"
                          className="hidden"
                          onChange={(event) => {
                            onUpload(item, event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* Everything else filed against the application */}
      <Card className="p-6">
        <SectionTitle icon={FileText}>Files on this application</SectionTitle>
        <div className="mt-4">
          {isDocumentsLoading ? (
            <SkeletonList count={2} />
          ) : supportingDocuments.length === 0 ? (
            <TabEmpty>Nothing attached yet. Anything you upload for a requested document lands here.</TabEmpty>
          ) : (
            <ul className="space-y-2">
              {supportingDocuments.map((document) => (
                <DocumentRow key={document.id} document={document} onOpen={onOpen} />
              ))}
            </ul>
          )}
        </div>
      </Card>

      {application.notes && (
        <Card className="p-6">
          <SectionTitle icon={Mail}>Your note to your counsellor</SectionTitle>
          <p className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">{application.notes}</p>
        </Card>
      )}
    </div>
  );
};

/**
 * The counsellor's answer to the student's request, in their own words.
 *
 * Registration is free, so a request is reviewed before anyone works on it.
 * While it waits, this says so. If the counsellor rejected it, their feedback
 * is the list of what to do next — so it leads, with the way to send the
 * request back once it is done. If they accepted it with a note, the note is
 * shown for as long as the application is in its first stage.
 */
const ReviewNotice = ({ application, onResend, isResending }) => {
  const { status, reviewFeedback, reviewedAt } = application;

  if (status === "requested") {
    return (
      <section className="mb-4 flex items-start gap-3 rounded-2xl border border-navy-100 bg-navy-50/60 p-4">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-navy-700" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-navy-900">
            Your application request is being reviewed
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
            Your counsellor will check your details and documents and accept the request, or let
            you know if anything else is needed. You'll get a notification either way.
          </p>
        </div>
      </section>
    );
  }

  if (status === "request_rejected") {
    return (
      <section className="mb-4 rounded-2xl border border-ignite-200 bg-ignite-50/50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold text-navy-900">
              Your counsellor needs a little more before accepting this request
            </h2>
            {reviewFeedback ? (
              <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink">
                {reviewFeedback}
              </p>
            ) : null}
            {reviewedAt && (
              <p className="mt-1.5 text-xs text-ink-faint">{formatDate(reviewedAt)}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to="/documents"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-hairline bg-white px-3.5 text-[13px] font-semibold text-navy-900 hover:border-navy-200"
              >
                <Upload className="h-4 w-4" aria-hidden />
                Upload documents
              </Link>
              <button
                type="button"
                onClick={onResend}
                disabled={isResending}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 text-[13px] font-semibold text-white hover:bg-navy-950 disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden />
                {isResending ? "Sending…" : "I've done this — send request again"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (reviewFeedback && ["draft", "documents_pending"].includes(status)) {
    return (
      <section className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-navy-900">
            Your counsellor accepted your application request
          </h2>
          <p className="mt-1.5 whitespace-pre-line text-[13.5px] leading-relaxed text-ink">
            {reviewFeedback}
          </p>
        </div>
      </section>
    );
  }

  return null;
};

/* ----------------------------------------------------------------- page --- */

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const {
    applications,
    documents: vaultDocuments,
    isLoading: isListLoading,
    uploadDocument,
    reloadApplications,
  } = useAppData();
  const { showToast } = useToast();
  const [isResending, setIsResending] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeline, setTimeline] = useState([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [checklist, setChecklist] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [journey, setJourney] = useState(null);
  const fileInputRefs = useRef({});
  const tabsRef = useRef(null);
  // Set once the student picks a tab, so the journey arriving late does not
  // pull them off the tab they chose.
  const pickedTab = useRef(false);

  // The list entry renders instantly; the detail read (university + course
  // particulars) fills in behind it.
  const listEntry = applications.find((app) => app.id === applicationId);
  const application = detail ?? listEntry;

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) return undefined;
    setDetail(null);
    setDetailError(false);
    getApplicationApi(applicationId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetailError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) return undefined;
    setIsTimelineLoading(true);
    getApplicationTimeline(applicationId)
      .then((steps) => !cancelled && setTimeline(steps))
      .catch(() => !cancelled && setTimeline([]))
      .finally(() => !cancelled && setIsTimelineLoading(false));
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) return undefined;
    setIsChecklistLoading(true);
    getApplicationChecklistApi(applicationId)
      .then((items) => !cancelled && setChecklist(items))
      .catch(() => !cancelled && setChecklist([]))
      .finally(() => !cancelled && setIsChecklistLoading(false));
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  const loadDocuments = useCallback(async (id) => {
    setIsDocumentsLoading(true);
    try {
      setDocuments(await getApplicationDocumentsApi(id));
    } catch {
      setDocuments([]);
    } finally {
      setIsDocumentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (applicationId) loadDocuments(applicationId);
  }, [applicationId, loadDocuments]);

  const loadJourney = useCallback(async (id) => {
    try {
      setJourney(await getJourney(id));
    } catch {
      setJourney(null);
    }
  }, []);

  useEffect(() => {
    if (!applicationId) return;
    setJourney(null);
    pickedTab.current = false;
    loadJourney(applicationId);
  }, [applicationId, loadJourney]);

  // An application with a journey opens on it: it is where the next thing to do is.
  useEffect(() => {
    if (journey && !pickedTab.current) setActiveTab("journey");
  }, [journey]);

  /** After an upload from the journey: the journey, its checklist and the files all moved. */
  const reloadFiles = useCallback(async () => {
    await Promise.all([
      loadJourney(applicationId),
      loadDocuments(applicationId),
      getApplicationChecklistApi(applicationId).then(setChecklist).catch(() => {}),
    ]);
  }, [applicationId, loadJourney, loadDocuments]);

  const tabs = journey ? [JOURNEY_TAB, ...TABS] : TABS;

  const openTab = (tab) => {
    pickedTab.current = true;
    setActiveTab(tab);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** A rejected request, sent back once the student has done what was asked. */
  const handleResendRequest = async () => {
    setIsResending(true);
    try {
      const updated = await submitApplicationApi(applicationId);
      setDetail((current) => (current ? { ...current, status: updated.status } : updated));
      await reloadApplications();
      showToast("Your application request has been sent again and will be reviewed by your counsellor.");
    } catch (error) {
      const { message } = parseApiErrorDetail(error?.data?.detail);
      showToast(message || "Couldn't send the request. Please try again.", "error");
    } finally {
      setIsResending(false);
    }
  };


  const handleOpenDocument = async (document, disposition) => {
    const result = await openDocumentFile(document.id, { disposition });
    if (result.ok) return;
    showToast("Couldn't open that file. Please try again.", "error");
  };

  /** Answer a request with a file already in the Paper Vault. */
  const handleReuseForItem = async (item, documentId) => {
    setUploadingItemId(item.id);
    try {
      const updated = await linkChecklistItemDocumentApi(applicationId, item.id, documentId);
      setChecklist((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      await loadDocuments(applicationId);
      showToast(`${item.label} attached from your Paper Vault.`);
    } catch (error) {
      const { message } = parseApiErrorDetail(error?.data?.detail);
      showToast(message || "Couldn't use that document. Please try again.", "error");
    } finally {
      setUploadingItemId(null);
    }
  };

  const handleUploadForItem = async (item, file) => {
    if (!file) return;
    setUploadingItemId(item.id);
    try {
      const uploaded = await uploadDocument(item.documentType || "other", file, { applicationId });
      const updated = await linkChecklistItemDocumentApi(applicationId, item.id, uploaded.id);
      setChecklist((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      await loadDocuments(applicationId);
      showToast(`${item.label} uploaded — awaiting review.`);
    } catch {
      showToast("Couldn't upload that document. Please try again.", "error");
    } finally {
      setUploadingItemId(null);
    }
  };

  // The date each progress step was reached, from the status history.
  const stepDates = useMemo(() => {
    const firstAt = (statuses) => timeline.find((step) => statuses.includes(step.label))?.date ?? null;
    if (!application) return [];
    return [
      application.createdAt ?? application.applicationDate,
      application.submittedAt ?? firstAt(["submitted"]),
      application.offerReceivedDate ?? firstAt(["offer_received"]),
      application.casReceivedDate ?? firstAt(["cas_received"]),
      application.visaAppliedDate ?? firstAt(["visa_processing"]),
      application.enrollmentDate ?? firstAt(["enrolled"]),
    ];
  }, [application, timeline]);

  const outstandingCount = checklist.filter((item) => item.status === "pending" || item.status === "rejected").length;

  if (!application && (isListLoading || (!detail && !detailError))) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <SkeletonList count={3} />
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <EmptyState
            icon={FileCheck}
            title="Application not found"
            description="This application doesn't exist or isn't yours."
            action={
              <Link
                to="/applications"
                className="inline-flex h-10 items-center rounded-xl bg-navy-900 px-5 text-sm font-semibold text-white hover:bg-navy-950"
              >
                Back to My Applications
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  const course = application.course;
  const tuition = application.tuitionFee ?? course?.tuitionFee ?? null;
  const tuitionLabel =
    tuition !== null && tuition !== undefined
      ? `${money(tuition, course?.currencySymbol ?? "£")} / year`
      : feeHeadline(course?.feeStructure, course?.currencySymbol ?? "£");
  const intakeLabel =
    application.intakeDetail?.name || application.intake || course?.intakesSummary?.[0] || null;
  const heroImage = application.university?.heroImageUrl || HERO_FALLBACK_IMAGE;
  const heroLabel = application.status === "submitted" ? "Applied" : applicationPill(application.status).label;

  /* Hero. The photo is a backdrop, not a column: it sits under the right of
     the card and fades towards the text, so the text keeps most of the width.
     Below `lg` it becomes a band across the top instead.

     From `xl` it shares a row with the progress card and stretches to its
     height; the content centres vertically in whatever height that gives. */
  const hero = (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="relative h-36 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[44%]">
        <img
          src={heroImage}
          alt=""
          onError={(event) => {
            if (!event.currentTarget.src.endsWith(HERO_FALLBACK_IMAGE)) {
              event.currentTarget.src = HERO_FALLBACK_IMAGE;
            }
          }}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent lg:bg-gradient-to-r lg:from-[#F4F5FD] lg:via-[#F4F5FD]/55 lg:to-transparent" />
      </div>

      <div className="relative bg-gradient-to-r from-white via-[#F8F9FE] to-[#F4F5FD] px-6 py-7 sm:px-8 lg:flex lg:w-[68%] lg:flex-1 lg:flex-col lg:justify-center lg:bg-none lg:pr-4">
        <div className="flex items-start gap-5">
          <UniversityCrest
            name={application.universityName}
            monogram={application.university?.monogram || application.universityMonogram}
            logoUrl={application.university?.logoUrl || application.universityLogoUrl}
            size={76}
          />
          <div className="min-w-0 flex-1 pt-1.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-navy-900">
                {application.universityName}
              </h1>
              <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-xs font-medium text-navy-900 ring-1 ring-navy-100">
                {heroLabel}
              </span>
            </div>
            <p className="mt-2 text-[15px] text-ink-soft">{application.courseName}</p>
            {application.universityCountry && (
              <p className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-muted">
                <MapPin className="h-4 w-4" aria-hidden />
                {application.universityCountry}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* The three facts, as an even strip across the full width of the card
          rather than squeezed into the text column beside the photo: three
          equal columns from `sm`, stacked below it. Over the photo on wide
          screens, so the strip is an opaque surface of its own. */}
      <div className="relative grid grid-cols-1 gap-4 border-t border-hairline bg-white/95 px-6 py-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-hairline sm:px-8">
        {[
          { icon: CalendarDays, label: "Course Intake", value: intakeLabel },
          { icon: Clock, label: "Course Duration", value: durationLabel(course, application.courseName) },
          { icon: Wallet, label: "Tuition Fees", value: tuitionLabel },
        ].map((fact) => (
          <div key={fact.label} className="min-w-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
            <HeroFact icon={fact.icon} label={fact.label} value={fact.value} />
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-[1480px] px-4 pt-6 sm:px-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-3 text-sm font-medium text-navy-900 hover:text-navy-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Applications
        </Link>

        {/* Hero and progress side by side, the same height. */}
        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {hero}
          {/* One tracker per page: a journey replaces the status steps. */}
          {journey ? (
            <JourneySummaryCard journey={journey} onOpen={() => openTab("journey")} />
          ) : (
            <ProgressCard application={application} stepDates={stepDates} />
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* ---------------------------------------------------- main --- */}
          <div className="min-w-0">
            <ReviewNotice
              application={application}
              onResend={handleResendRequest}
              isResending={isResending}
            />

            {/* Tabs */}
            {/* Wrapping, never scrolling sideways: five short labels fit a
                laptop column on one row and fall to a second on a phone. */}
            <div ref={tabsRef} className="scroll-mt-20 border-b border-hairline">
              <div role="tablist" className="flex flex-wrap gap-x-1">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => {
                        pickedTab.current = true;
                        setActiveTab(tab.id);
                      }}
                      className={`relative px-3.5 py-3 text-sm font-medium transition-colors sm:px-4 ${
                        active ? "font-semibold text-navy-900" : "text-ink-muted hover:text-navy-900"
                      }`}
                    >
                      {tab.label}
                      {tab.id === "documents" && outstandingCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-ignite-500 px-1.5 text-[11px] font-semibold text-white">
                          {outstandingCount}
                        </span>
                      )}
                      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-navy-900" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              {activeTab === "journey" && journey && (
                <JourneyPanel
                  applicationId={applicationId}
                  application={application}
                  journey={journey}
                  onJourney={setJourney}
                  documents={documents}
                  onOpenDocument={handleOpenDocument}
                  onFilesChanged={reloadFiles}
                />
              )}
              {activeTab === "overview" && <OverviewTab application={application} />}
              {activeTab === "course" && <CourseTab application={application} />}
              {activeTab === "requirements" && <RequirementsTab application={application} />}
              {activeTab === "timeline" && <TimelineTab steps={timeline} isLoading={isTimelineLoading} />}
              {activeTab === "documents" && (
                <DocumentsTab
                  application={application}
                  documents={documents}
                  isDocumentsLoading={isDocumentsLoading}
                  checklist={checklist}
                  isChecklistLoading={isChecklistLoading}
                  uploadingItemId={uploadingItemId}
                  fileInputRefs={fileInputRefs}
                  onUpload={handleUploadForItem}
                  onReuse={handleReuseForItem}
                  vaultDocuments={vaultDocuments}
                  onOpen={handleOpenDocument}
                />
              )}
            </div>
          </div>

          {/* --------------------------------------------------- aside --- */}
          <aside className="space-y-6">
            <CounsellorCard application={application} />
            <NextStepCard step={nextStepOf(application, outstandingCount)} onTab={openTab} />
          </aside>
        </div>
      </main>

    </div>
  );
};

export default ApplicationDetail;
