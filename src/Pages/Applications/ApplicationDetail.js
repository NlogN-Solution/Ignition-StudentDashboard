import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BedDouble,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  Globe,
  Landmark,
  Link2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Stamp,
  Star,
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
} from "../../api/studentPortal";
import {
  CAS_STAGES,
  OFFER_STATUSES,
  OFFER_TYPE_LABELS,
  PROGRESS_STEPS,
  VISA_STATUSES,
  applicationPill,
  hasOffer,
  progressStepOf,
} from "../../lib/applicationStatus";
import UnlockModal from "../../components/access/UnlockModal";
import { useAccess } from "../../hooks/useAccess";
import { openDocumentFile } from "../../lib/documentFile";
import { formatDate, formatFileSize } from "../../lib/simulate";

const HERO_FALLBACK_IMAGE = "/images/campus-historic.webp";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "course", label: "Course Details" },
  { id: "fees", label: "Fees & Funding" },
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
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
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

const HeroFact = ({ icon: Icon, label, value, divider }) => (
  <div className={`flex items-start gap-3 ${divider ? "sm:border-l sm:border-hairline sm:pl-5" : ""}`}>
    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-ink-muted">
      <Icon className="h-4 w-4" aria-hidden />
    </span>
    <div className="min-w-0">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-navy-900">{value || "To be confirmed"}</p>
    </div>
  </div>
);

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

const ProgressCard = ({ application, stepDates }) => {
  const current = progressStepOf(application.status);
  const stopped = ["rejected", "withdrawn"].includes(application.status);
  const stepNumber = Math.min(current + 1, PROGRESS_STEPS.length);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-navy-900">Application Progress</h2>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
          Step {stepNumber} of {PROGRESS_STEPS.length}
        </span>
      </div>

      <ol className="mt-5">
        {PROGRESS_STEPS.map((label, index) => {
          const done = index < current;
          const isCurrent = index === current;
          const last = index === PROGRESS_STEPS.length - 1;
          const date = formatDay(stepDates[index]);
          return (
            <li key={label} className="relative flex gap-4 pb-6 last:pb-0">
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-[14px] top-8 h-[calc(100%-32px)] w-0.5 ${done ? "bg-emerald-400" : "bg-gray-200"}`}
                />
              )}
              <span
                aria-hidden
                className={`relative z-10 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                    ? stopped
                      ? "border-2 border-red-500 bg-white text-red-600"
                      : "border-2 border-indigo-600 bg-white text-indigo-600"
                    : "border border-gray-300 bg-white text-ink-faint"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
              </span>
              <div className="min-w-0 pt-1">
                <p
                  className={`text-sm ${
                    isCurrent ? (stopped ? "font-semibold text-red-600" : "font-semibold text-indigo-600") : "font-medium text-navy-900"
                  }`}
                >
                  {index + 1}. {label}
                </p>
                <p className="mt-1 text-[13px] text-ink-muted">
                  {isCurrent && stopped
                    ? applicationPill(application.status).label
                    : date ?? (done ? "Completed" : "Pending")}
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
    "mt-5 inline-flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800";
  return (
    <section className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-indigo-50 via-white to-ignite-50 p-6 shadow-card">
      <span aria-hidden className="absolute right-10 top-5 h-5 w-5 rounded-full bg-ignite-100" />
      <span aria-hidden className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-100/60 blur-2xl" />
      <Send className="relative h-5 w-5 text-indigo-600" aria-hidden />
      <p className="relative mt-3 text-sm font-medium text-indigo-600">Next Step</p>
      <h2 className="relative mt-0.5 text-[17px] font-bold text-navy-900">{step.title}</h2>
      <p className="relative mt-3 text-[13px] leading-relaxed text-ink-muted">{step.body}</p>
      {step.to ? (
        <Link to={step.to} className={`relative ${buttonClass}`}>
          {step.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <button type="button" onClick={() => onTab(step.tab)} className={`relative ${buttonClass}`}>
          {step.cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </section>
  );
};

const QuickLinksCard = ({ application, onTab }) => {
  const slug = application.university?.slug;
  const profile = slug ? `/explore/universities/${slug}` : "/explore";
  const links = [
    { label: "View University Profile", icon: Building2, to: profile },
    { label: "Course Curriculum", icon: BookOpen, tab: "course" },
    { label: "Scholarship Opportunities", icon: Award, tab: "fees" },
    { label: "Accommodation Options", icon: BedDouble, to: profile },
  ];
  const rowClass =
    "flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-left text-sm text-ink-soft transition-colors hover:text-indigo-600";
  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-navy-900">
        <Link2 className="h-5 w-5 text-indigo-600" aria-hidden />
        Quick Links
      </h2>
      <ul className="mt-3">
        {links.map((link) => {
          const Icon = link.icon;
          const inner = (
            <>
              <Icon className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
              <span className="flex-1">{link.label}</span>
              <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden />
            </>
          );
          return (
            <li key={link.label}>
              {link.to ? (
                <Link to={link.to} className={rowClass}>
                  {inner}
                </Link>
              ) : (
                <button type="button" onClick={() => onTab(link.tab)} className={rowClass}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

const DreamsCard = () => (
  <section className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-br from-white via-indigo-50/40 to-indigo-100/70 p-6 shadow-card">
    <svg aria-hidden viewBox="0 0 200 100" className="absolute bottom-0 right-0 h-28 w-56 text-indigo-200" preserveAspectRatio="none">
      <path d="M0 100 C60 90 110 40 200 10 L200 100 Z" fill="currentColor" opacity="0.55" />
      <path d="M40 100 C90 85 140 60 200 45 L200 100 Z" fill="currentColor" opacity="0.6" />
    </svg>
    <Star className="relative h-5 w-5 fill-ignite-400 text-ignite-400" aria-hidden />
    <p className="relative mt-4 text-[15px] font-semibold text-navy-900">Big dreams. Real pathways.</p>
    <p className="relative mt-1.5 text-xs text-ink-muted">You're one step closer to your future.</p>
  </section>
);

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
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
              >
                View on Website <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            ) : (
              <Link
                to={website}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
              >
                View on Website <ArrowRight className="h-4 w-4" aria-hidden />
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/70 px-3 py-1 text-xs font-medium text-navy-900"
                  >
                    {index === 0 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" aria-hidden />
                    ) : (
                      <Globe className="h-3.5 w-3.5 text-indigo-600" aria-hidden />
                    )}
                    <span className={index === 0 ? "" : "text-indigo-600"}>{badge}</span>
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

      {/* Advisor */}
      <div className="border-t border-hairline p-6">
        <SectionTitle icon={UserRound}>Assigned Advisor &amp; Contact Details</SectionTitle>
        {application.counsellorName ? (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-hairline bg-[#F7F8FC] p-5 sm:grid-cols-3 sm:gap-0">
            <div className="sm:pr-5">
              <p className="text-sm font-medium text-navy-900">Assigned Advisor</p>
              <p className="mt-2 text-sm text-ink-muted">
                <span className="font-semibold text-navy-900">Name : </span>
                {application.counsellorName}
              </p>
            </div>
            <div className="sm:border-l sm:border-hairline sm:px-5">
              <p className="text-sm font-medium text-navy-900">Contact Number</p>
              {application.counsellorPhone ? (
                <a
                  href={`tel:${application.counsellorPhone.replace(/[^\d+]/g, "")}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-indigo-600"
                >
                  <span className="font-semibold text-navy-900">Mobile No : </span>
                  {application.counsellorPhone}
                  <Phone className="h-4 w-4 text-navy-900" aria-hidden />
                </a>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">Reach them through Messages</p>
              )}
            </div>
            <div className="min-w-0 sm:border-l sm:border-hairline sm:pl-5">
              <p className="text-sm font-medium text-navy-900">Email</p>
              {application.counsellorEmail ? (
                <a
                  href={`mailto:${application.counsellorEmail}`}
                  className="mt-2 inline-flex max-w-full items-center gap-1.5 text-sm text-ink-muted hover:text-indigo-600"
                >
                  <span className="truncate">{application.counsellorEmail}</span>
                  <Mail className="h-4 w-4 flex-shrink-0 text-navy-900" aria-hidden />
                </a>
              ) : (
                <Link to="/messages" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                  Send a message
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-hairline bg-[#F7F8FC] p-5 text-sm text-ink-muted">
            An advisor will be assigned to your application shortly — their name and number will appear here.
          </div>
        )}
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

const CourseTab = ({ application }) => {
  const course = application.course;
  if (!course) return <Card className="p-6"><TabEmpty>Course details aren't available yet.</TabEmpty></Card>;
  const modules = course.modules.map((module) =>
    typeof module === "string" ? module : module.title ?? module.name ?? null
  ).filter(Boolean);
  return (
    <Card className="space-y-6 p-6">
      <SectionTitle icon={GraduationCap}>Course Details</SectionTitle>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <DetailFact icon={GraduationCap} label="Qualification" value={course.qualification || application.degreeLevel} />
        <DetailFact icon={Timer} label="Duration" value={durationLabel(course, application.courseName)} />
        <DetailFact icon={MapPin} label="Campus" value={course.campus} />
        <DetailFact icon={CalendarDays} label="Intake" value={application.intakeDetail?.name || application.intake} />
        <DetailFact icon={BookOpen} label="Study mode" value={course.courseType} />
        <DetailFact
          icon={CalendarDays}
          label="Other intakes"
          value={course.intakesSummary.length ? course.intakesSummary.join(", ") : null}
        />
      </div>
      <Prose title="Overview">{course.overview}</Prose>
      <Prose title="What you'll study">{course.whatYouStudy}</Prose>
      {modules.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-navy-900">Modules</h3>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {modules.map((module) => (
              <li key={module} className="rounded-lg bg-[#F7F8FC] px-3 py-2 text-sm text-ink-soft">
                {module}
              </li>
            ))}
          </ul>
        </div>
      )}
      {course.careerOutcomes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-navy-900">Career outcomes</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {course.careerOutcomes.map((outcome) => (
              <span key={outcome} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                {outcome}
              </span>
            ))}
          </div>
        </div>
      )}
      {!course.overview && !course.whatYouStudy && modules.length === 0 && application.university?.slug && (
        <Link
          to={`/explore/universities/${application.university.slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
        >
          See the full course listing <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      )}
    </Card>
  );
};

const FeesTab = ({ application }) => {
  const course = application.course;
  const symbol = course?.currencySymbol ?? "£";
  const tuition = application.tuitionFee ?? course?.tuitionFee ?? null;
  const scholarship = application.scholarshipAmount;
  const payable = tuition !== null && tuition !== undefined ? Number(tuition) - Number(scholarship ?? 0) : null;
  return (
    <Card className="space-y-6 p-6">
      <SectionTitle icon={Wallet}>Fees &amp; Funding</SectionTitle>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <DetailFact
          icon={Wallet}
          label="Tuition fees"
          value={tuition !== null && tuition !== undefined ? `${money(tuition, symbol)} / year` : course?.feeStructure}
        />
        <DetailFact icon={Award} label="Scholarship" value={scholarship ? money(scholarship, symbol) : "None recorded"} />
        <DetailFact
          icon={CheckCircle2}
          label="Payable after scholarship"
          value={payable !== null ? money(payable, symbol) : null}
        />
      </div>
      <Prose title="Fee structure">{course?.feeStructure}</Prose>
      <Prose title="Scholarships">{course?.scholarshipText}</Prose>
      <Prose title="CAS deposit">{course?.casDeposit}</Prose>
      <Prose title="Enrolment fee">{course?.enrolmentFee}</Prose>
      {application.university?.livingCostMonthly ? (
        <Prose title="Living costs">
          {`Around ${money(application.university.livingCostMonthly, "£")} a month.`}
        </Prose>
      ) : null}
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
                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                </span>
              ) : (
                <CheckCircle2 className="relative z-10 h-6 w-6 fill-emerald-500 text-white" aria-hidden />
              )}
              <div className="min-w-0">
                <p className={`text-sm ${step.state === "current" ? "font-semibold text-indigo-600" : "font-medium text-navy-900"}`}>
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

/**
 * A letter the student has to pay to open. The row still *appears* — the
 * student is told their offer letter exists — but the actions become one
 * unlock button. The backend refuses the file itself with a 402, so this is
 * presentation over an enforced boundary rather than the boundary itself.
 */
const LockedDocumentRow = ({ label, onUnlock }) => (
  <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-[#F7F8FC] p-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <Lock className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-navy-900">{label}</p>
        <p className="truncate text-xs text-ink-muted">Available — unlock your package to open it</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onUnlock}
      className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-navy-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800"
    >
      <Lock className="h-3 w-3" aria-hidden />
      Unlock to view
    </button>
  </li>
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
        className="flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-indigo-200 hover:text-indigo-600"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        View
      </button>
      <button
        type="button"
        onClick={() => onOpen(document, "attachment")}
        className="flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-indigo-200 hover:text-indigo-600"
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
  hasAccess,
  uploadingItemId,
  fileInputRefs,
  onUpload,
  onOpen,
  onUnlock,
}) => {
  const offerDocuments = documents.filter((doc) => doc.documentType === "offer_letter");
  const casDocuments = documents.filter((doc) => doc.documentType === "cas_letter");
  const supportingDocuments = documents.filter((doc) => !ISSUED_DOCUMENT_TYPES.includes(doc.documentType));
  const showOffer = hasOffer(application.status) || offerDocuments.length > 0;
  const showCas = CAS_STAGES.includes(application.status) || casDocuments.length > 0;

  const issuedRows = (list, label) =>
    list.map((document) =>
      hasAccess ? (
        <DocumentRow key={document.id} document={document} onOpen={onOpen} />
      ) : (
        <LockedDocumentRow key={document.id} label={label ?? DOCUMENT_TYPE_LABELS[document.documentType]} onUnlock={onUnlock} />
      )
    );

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
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
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
          {casDocuments.length > 0 && <ul className="mt-4 space-y-2">{issuedRows(casDocuments, "CAS letter")}</ul>}
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
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                        View what you sent
                      </button>
                    )}
                    {(item.status === "pending" || item.status === "rejected") && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[item.id]?.click()}
                          disabled={uploadingItemId === item.id}
                          className="flex items-center gap-1 rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-60"
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

/* ----------------------------------------------------------------- page --- */

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const { applications, isLoading: isListLoading, uploadDocument } = useAppData();
  const { showToast } = useToast();

  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeline, setTimeline] = useState([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [checklist, setChecklist] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const { access, hasAccess, reload: reloadAccess } = useAccess();
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const fileInputRefs = useRef({});
  const tabsRef = useRef(null);

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

  const openTab = (tab) => {
    setActiveTab(tab);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOpenDocument = async (document, disposition) => {
    const result = await openDocumentFile(document.id, { disposition });
    if (result.ok) return;
    // 402 means "pay and this works" — the unlock screen, not an error.
    if (result.error?.status === 402) {
      setIsUnlockOpen(true);
      return;
    }
    showToast("Couldn't open that file. Please try again.", "error");
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
      firstAt(["under_review"]),
      application.offerReceivedDate ?? firstAt(["offer_received"]),
    ];
  }, [application, timeline]);

  const outstandingCount = checklist.filter((item) => item.status === "pending" || item.status === "rejected").length;

  if (!application && (isListLoading || (!detail && !detailError))) {
    return (
      <div className="min-h-screen bg-canvas">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <SkeletonList count={3} />
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-canvas">
        <main className="mx-auto max-w-5xl px-4 py-8">
          <EmptyState
            icon={FileCheck}
            title="Application not found"
            description="This application doesn't exist or isn't yours."
            action={
              <Link
                to="/applications"
                className="rounded-full bg-navy-900 px-6 py-2 text-sm font-medium text-white hover:bg-navy-800"
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
      : course?.feeStructure || null;
  const heroImage = application.university?.heroImageUrl || HERO_FALLBACK_IMAGE;
  const heroLabel = application.status === "submitted" ? "Applied" : applicationPill(application.status).label;

  return (
    <div className="min-h-screen bg-canvas pb-16">
      <main className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-8">
        <Link
          to="/applications"
          className="inline-flex items-center gap-3 text-sm font-medium text-navy-900 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Applications
        </Link>

        <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          {/* ---------------------------------------------------- main --- */}
          <div className="min-w-0">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl border border-hairline bg-gradient-to-r from-white via-[#F5F6FD] to-[#EEF0FB] shadow-card">
              <div className="absolute inset-y-0 right-0 hidden w-[48%] md:block">
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#F2F3FC] via-[#F2F3FC]/40 to-transparent" />
              </div>

              <div className="relative p-6 md:w-[64%]">
                <div className="flex items-start gap-5 border-b border-hairline pb-6">
                  <UniversityCrest
                    name={application.universityName}
                    monogram={application.university?.monogram || application.universityMonogram}
                    logoUrl={application.university?.logoUrl || application.universityLogoUrl}
                    size={72}
                  />
                  <div className="min-w-0 pt-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-xl font-semibold text-navy-900 sm:text-[22px]">
                        {application.universityName}
                      </h1>
                      <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600">
                        {heroLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-[15px] text-ink-soft">{application.courseName}</p>
                    {application.universityCountry && (
                      <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-ink-muted">
                        <MapPin className="h-4 w-4" aria-hidden />
                        {application.universityCountry}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-3 sm:gap-5">
                  <HeroFact
                    icon={CalendarDays}
                    label="Course Intake"
                    value={application.intakeDetail?.name || application.intake}
                  />
                  <HeroFact icon={Wallet} label="Tuition Fees" value={tuitionLabel} divider />
                  <HeroFact
                    icon={Clock}
                    label="Course Duration"
                    value={durationLabel(course, application.courseName)}
                    divider
                  />
                </div>
              </div>
            </section>

            {/* Tabs */}
            <div ref={tabsRef} className="mt-6 scroll-mt-20 overflow-x-auto border-b border-hairline">
              <div role="tablist" className="flex min-w-max gap-2">
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      role="tab"
                      type="button"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-5 py-3.5 text-sm font-medium transition-colors ${
                        active ? "text-indigo-600" : "text-ink-soft hover:text-navy-900"
                      }`}
                    >
                      {tab.label}
                      {tab.id === "documents" && outstandingCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-ignite-500 px-1.5 text-[11px] font-semibold text-white">
                          {outstandingCount}
                        </span>
                      )}
                      {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              {activeTab === "overview" && <OverviewTab application={application} />}
              {activeTab === "course" && <CourseTab application={application} />}
              {activeTab === "fees" && <FeesTab application={application} />}
              {activeTab === "requirements" && <RequirementsTab application={application} />}
              {activeTab === "timeline" && <TimelineTab steps={timeline} isLoading={isTimelineLoading} />}
              {activeTab === "documents" && (
                <DocumentsTab
                  application={application}
                  documents={documents}
                  isDocumentsLoading={isDocumentsLoading}
                  checklist={checklist}
                  isChecklistLoading={isChecklistLoading}
                  hasAccess={hasAccess}
                  uploadingItemId={uploadingItemId}
                  fileInputRefs={fileInputRefs}
                  onUpload={handleUploadForItem}
                  onOpen={handleOpenDocument}
                  onUnlock={() => setIsUnlockOpen(true)}
                />
              )}
            </div>
          </div>

          {/* --------------------------------------------------- aside --- */}
          <aside className="space-y-6">
            <ProgressCard application={application} stepDates={stepDates} />
            <NextStepCard step={nextStepOf(application, outstandingCount)} onTab={openTab} />
            <QuickLinksCard application={application} onTab={openTab} />
            <DreamsCard />
          </aside>
        </div>
      </main>

      {isUnlockOpen && (
        <UnlockModal
          access={access}
          onClose={() => setIsUnlockOpen(false)}
          onUnlocked={async () => {
            setIsUnlockOpen(false);
            // Re-read from the server: the entitlement is a payment row.
            await reloadAccess();
            showToast("Unlocked — your documents are open.");
          }}
        />
      )}
    </div>
  );
};

export default ApplicationDetail;
