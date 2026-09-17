import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  Bold,
  Building,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock,
  FileCheck,
  FileText,
  Hash,
  Italic,
  List,
  ListOrdered,
  Mail,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  StickyNote,
  Strikethrough,
  Underline,
  Upload,
  X,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import StatusBadge, { STATUS_LABELS } from "../../components/common/StatusBadge";
import UniversityMark from "../../components/common/UniversityMark";
import { SkeletonList } from "../../components/common/Skeleton";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { getApplicationChecklistApi, getApplicationTimeline, linkChecklistItemDocumentApi } from "../../api/studentPortal";
import { formatDate, formatDateTime } from "../../lib/simulate";
import { PREVIEW_APPLICATIONS, PREVIEW_TIMELINES } from "../../data/previewApplications";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "documents", label: "Documents" },
  { key: "history", label: "Application History" },
  { key: "notes", label: "Notes" },
];

const InfoField = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-navy-900">{value || "—"}</p>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) =>
  value ? (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  ) : null;

const getPersonInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

// A stable color per sender, derived from their name — same person always
// gets the same avatar tone across the thread.
const AVATAR_TONES = ["bg-navy-600", "bg-indigo-500", "bg-emerald-600", "bg-ignite-500"];
const toneForSender = (name) => {
  const sum = [...(name || "")].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_TONES[sum % AVATAR_TONES.length];
};

// A small, real toolbar rather than a wall of decorative icons — every
// button here actually formats the draft as you write. `execCommand` is
// deprecated but still broadly supported for exactly this (basic
// bold/italic/list toggling in a contentEditable); the important part is
// what gets saved never round-trips through innerHTML (see handleSend
// below), so there's no HTML-injection surface even though the editor is
// contentEditable.
const TOOLBAR_ACTIONS = [
  { command: "bold", icon: Bold, label: "Bold" },
  { command: "italic", icon: Italic, label: "Italic" },
  { command: "underline", icon: Underline, label: "Underline" },
  { command: "strikeThrough", icon: Strikethrough, label: "Strikethrough" },
  { command: "insertUnorderedList", icon: List, label: "Bullet list" },
  { command: "insertOrderedList", icon: ListOrdered, label: "Numbered list" },
];

/**
 * The "Add Comment" composer, as a modal. Sends are local-only — there's no
 * backend endpoint for a student to write into this thread — so `onSend`
 * just appends to the in-memory timeline for this session. The editor body
 * is contentEditable for a real formatting experience, but only its plain
 * `innerText` is ever read out, so nothing HTML-shaped is stored or rendered
 * back later.
 */
const AddCommentModal = ({ application, onClose, onSend }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [subject, setSubject] = useState("");
  const [hasBody, setHasBody] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const runCommand = (command) => {
    editorRef.current?.focus();
    document.execCommand(command);
  };

  const handleFiles = (files) => {
    setAttachments((current) => [...current, ...Array.from(files).map((file) => file.name)]);
  };

  const handleSend = () => {
    const body = editorRef.current?.innerText.trim() ?? "";
    if (!subject.trim() || !body) return;
    onSend({ subject: subject.trim(), body, attachments });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-navy-900 px-6 py-4 shrink-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Mail className="w-4 h-4 text-ignite-400" />
            Reply
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-navy-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="w-14 shrink-0 font-semibold text-slate-400">From</span>
              <span className="font-medium text-navy-900">You</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 text-sm">
              <span className="w-14 shrink-0 font-semibold text-slate-400">To</span>
              <span className="font-medium text-navy-900">{application.counsellorName || "Your counsellor"}</span>
              <span className="ml-auto text-xs text-slate-400">
                Ref #{application.universityApplicationId || application.id}
              </span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="w-14 shrink-0 text-sm font-semibold text-slate-400">Subject</span>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Add a subject"
                required
                className="w-full text-sm text-navy-900 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
              {TOOLBAR_ACTIONS.map(({ command, icon: Icon, label }) => (
                <button
                  key={command}
                  type="button"
                  aria-label={label}
                  title={label}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runCommand(command)}
                  className="p-1.5 rounded text-slate-500 hover:bg-white hover:text-navy-900 hover:shadow-sm transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => setHasBody(event.currentTarget.innerText.trim().length > 0)}
              data-placeholder="Write your comment…"
              className="min-h-[140px] px-4 py-3 text-sm text-navy-900 outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
            />
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs"
                >
                  <Paperclip className="w-3 h-3" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Attach Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!subject.trim() || !hasBody}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-ignite-500 hover:bg-ignite-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Application History rendered as a real email conversation — a single
 * subject line, one row per message with sender/recipient/date, collapsed
 * to a one-line snippet except the newest, expanding on click. Mirrors how
 * a student would actually read this exchange in their inbox rather than a
 * generic activity timeline.
 */
const MailThread = ({ steps, application, onAddNote }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const counsellorName = application.counsellorName || "Ignition Team";
  const subjectLine = `${application.universityName} — ${
    [application.courseName, application.degreeLevel].filter(Boolean).join(" ")
  } application`;

  // The newest message always opens by default — matches how an inbox
  // expands the latest reply in a thread and collapses the rest.
  useEffect(() => {
    if (steps.length === 0) return;
    const newest = steps.find((step) => step.state === "current") ?? steps[steps.length - 1];
    setExpandedId(newest.id);
  }, [steps]);

  const handleSend = (payload) => {
    onAddNote(payload);
    setIsModalOpen(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100 bg-navy-50/50">
        <div className="min-w-0 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-navy-100 text-navy-600">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">Correspondence</p>
            <h3 className="mt-0.5 text-sm font-bold text-navy-900 truncate">{subjectLine}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {steps.length} {steps.length === 1 ? "message" : "messages"} between you and {counsellorName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ignite-500 hover:bg-ignite-600 transition-colors shadow-sm shrink-0"
        >
          <Reply className="w-4 h-4" />
          Reply
        </button>
      </div>

      {isModalOpen && (
        <AddCommentModal
          application={application}
          onClose={() => setIsModalOpen(false)}
          onSend={handleSend}
        />
      )}

      {steps.length === 0 ? (
        <p className="text-sm text-slate-500 px-5 py-6">No correspondence recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {steps.map((step, index) => {
            const sender = step.author ?? counsellorName;
            const isYou = sender === "You";
            const recipient = isYou ? counsellorName : "You";
            const isOpen = expandedId === step.id;
            const subject = step.subject ?? STATUS_LABELS[step.label] ?? step.label;

            return (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index, 6) * 0.04 }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : step.id)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors ${
                    isOpen ? "bg-white" : isYou ? "bg-ignite-50/30 hover:bg-ignite-50/50" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white ${toneForSender(
                      sender
                    )}`}
                  >
                    {getPersonInitials(sender)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-navy-900">{sender}</span>
                      {step.state === "current" && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-ignite-600 bg-ignite-100 px-1.5 py-0.5 rounded">
                          Latest
                        </span>
                      )}
                    </span>
                    {isOpen ? (
                      <span className="block text-xs text-slate-400 mt-0.5 truncate">
                        To: {recipient} &nbsp;·&nbsp; Subject: {subject}
                      </span>
                    ) : (
                      <span className="block text-sm text-slate-500 truncate mt-0.5">
                        <span className="font-medium text-slate-600">{subject}</span>
                        {step.remarks ? ` — ${step.remarks}` : ""}
                      </span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 pl-2 text-xs text-slate-400">
                    {step.date && <span className="whitespace-nowrap">{formatDateTime(step.date)}</span>}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180 text-navy-500" : ""}`}
                    />
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pl-[3.75rem]">
                    <div className="mb-3">
                      <StatusBadge status={step.label} />
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {step.remarks || "No additional notes were added with this update."}
                    </p>
                    {step.attachments?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {step.attachments.map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs"
                          >
                            <Paperclip className="w-3 h-3" />
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const { applications, uploadDocument } = useAppData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("overview");
  const [timeline, setTimeline] = useState([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);
  const [checklist, setChecklist] = useState([]);
  const [isChecklistLoading, setIsChecklistLoading] = useState(true);
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const fileInputRefs = useRef({});

  const isPreview = applicationId?.startsWith("preview-");
  const application =
    applications.find((app) => app.id === applicationId) ??
    (isPreview ? PREVIEW_APPLICATIONS.find((app) => app.id === applicationId) : null);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId) return undefined;

    // Preview rows aren't real applications the API knows about — use the
    // matching seeded timeline instead of hitting a 404.
    if (isPreview) {
      setTimeline(PREVIEW_TIMELINES[applicationId] ?? []);
      setIsTimelineLoading(false);
      return undefined;
    }

    setIsTimelineLoading(true);
    getApplicationTimeline(applicationId)
      .then((steps) => {
        if (!cancelled) setTimeline(steps);
      })
      .catch(() => {
        if (!cancelled) setTimeline([]);
      })
      .finally(() => {
        if (!cancelled) setIsTimelineLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, isPreview]);

  useEffect(() => {
    let cancelled = false;
    if (!applicationId || isPreview) {
      setIsChecklistLoading(false);
      return undefined;
    }
    setIsChecklistLoading(true);
    getApplicationChecklistApi(applicationId)
      .then((items) => {
        if (!cancelled) setChecklist(items);
      })
      .catch(() => {
        if (!cancelled) setChecklist([]);
      })
      .finally(() => {
        if (!cancelled) setIsChecklistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, isPreview]);

  const handleAddNote = ({ subject, body, attachments }) => {
    setTimeline((current) => [
      ...current.map((step) => (step.state === "current" ? { ...step, state: "completed" } : step)),
      {
        id: `local-${Date.now()}`,
        label: application.status,
        date: new Date().toISOString(),
        state: "current",
        subject,
        remarks: body,
        attachments,
        author: "You",
      },
    ]);
    showToast("Comment added to this application's history.");
  };

  const handleUploadForItem = async (item, file) => {
    if (!file) return;
    setUploadingItemId(item.id);
    try {
      const uploaded = await uploadDocument(item.documentType || "other", file);
      const updated = await linkChecklistItemDocumentApi(applicationId, item.id, uploaded.id);
      setChecklist((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      showToast(`${item.label} uploaded — awaiting review.`);
    } catch {
      showToast("Couldn't upload that document. Please try again.", "error");
    } finally {
      setUploadingItemId(null);
    }
  };

  if (applications.length === 0 && !isPreview) {
    return (
      <div className="min-h-screen bg-slate-50 mt-9 pb-12">
        <main className="max-w-5xl mx-auto px-4 py-8">
          <SkeletonList count={3} />
        </main>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 mt-9 pb-12">
        <main className="max-w-5xl mx-auto px-4 py-8">
          <EmptyState
            icon={FileCheck}
            title="Application not found"
            description="This application doesn't exist or isn't yours."
            action={
              <Link
                to="/applications"
                className="px-6 py-2 rounded-lg text-sm font-medium bg-navy-900 hover:bg-navy-800 text-white transition-all duration-300"
              >
                Back to My Applications
              </Link>
            }
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 mt-9 pb-12">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to My Applications
        </Link>

        {/* Course Details hero */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-navy-900 via-navy-700 to-ignite-500" aria-hidden="true" />
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-navy-900">Course Details</h1>
                <StatusBadge status={application.status} />
              </div>
              <Link
                to="/appointments"
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-ignite-500 hover:bg-ignite-600 transition-all shadow-sm hover:shadow-lg hover:shadow-ignite-500/25"
              >
                Book a Call
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-start gap-6">
              <UniversityMark name={application.universityName} />
              <div className="flex-1 min-w-[220px] grid grid-cols-2 sm:grid-cols-4 gap-6">
                <InfoField label="University" value={application.universityName} />
                <InfoField
                  label="Course Name"
                  value={[application.courseName, application.degreeLevel].filter(Boolean).join(" - ")}
                />
                <InfoField label="Course Intake" value={application.intake} />
                <InfoField
                  label="Tuition Fees"
                  value={
                    application.tuitionFee
                      ? `£${Number(application.tuitionFee).toLocaleString()}`
                      : null
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
              Your Counsellor
            </p>
            {application.counsellorName ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold text-navy-900">{application.counsellorName}</p>
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Link>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not yet assigned.</p>
            )}
          </div>

          <div className="border-t border-slate-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
              Key Deadlines
            </p>
            {application.deadline ? (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ignite-50 text-ignite-700 px-3 py-1.5 text-sm font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Application deadline · {formatDate(application.deadline)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No deadlines set yet.</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex gap-6 px-6 border-b border-slate-100 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key ? "text-ignite-600" : "text-slate-500 hover:text-navy-800"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-ignite-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow icon={Building} label="Country" value={application.universityCountry} />
                  <InfoRow
                    icon={Hash}
                    label="University application ID"
                    value={application.universityApplicationId}
                  />
                  <InfoRow
                    icon={Award}
                    label="Scholarship"
                    value={
                      application.scholarshipAmount
                        ? `£${Number(application.scholarshipAmount).toLocaleString()}`
                        : null
                    }
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy-900 mb-3">Key dates</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={Calendar} label="Application opened" value={formatDate(application.applicationDate)} />
                    <InfoRow icon={Calendar} label="Submitted" value={formatDate(application.submittedAt)} />
                    <InfoRow icon={Calendar} label="Offer received" value={formatDate(application.offerReceivedDate)} />
                    <InfoRow icon={Calendar} label="Visa applied" value={formatDate(application.visaAppliedDate)} />
                    <InfoRow icon={Calendar} label="Visa decision" value={formatDate(application.visaDecisionDate)} />
                    <InfoRow icon={Calendar} label="Enrollment" value={formatDate(application.enrollmentDate)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              isChecklistLoading ? (
                <SkeletonList count={2} />
              ) : checklist.length === 0 ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm w-fit">
                  <CheckCircle2 className="w-5 h-5" />
                  Nothing requested yet
                </div>
              ) : (
                <div className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.id} className="p-3 border border-slate-100 rounded-lg">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {item.label}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      {item.notes && <p className="text-xs text-slate-500 mt-1">{item.notes}</p>}
                      {(item.status === "pending" || item.status === "rejected") && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[item.id]?.click()}
                            disabled={uploadingItemId === item.id}
                            className="flex items-center gap-1 text-xs text-navy-700 hover:text-navy-900 disabled:opacity-60"
                          >
                            <Upload className="h-3 w-3" />
                            {uploadingItemId === item.id
                              ? "Uploading…"
                              : item.status === "rejected"
                              ? "Re-upload"
                              : "Upload"}
                          </button>
                          <input
                            ref={(element) => {
                              fileInputRefs.current[item.id] = element;
                            }}
                            type="file"
                            className="hidden"
                            onChange={(event) => {
                              handleUploadForItem(item, event.target.files?.[0]);
                              event.target.value = "";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === "history" && (
              isTimelineLoading ? (
                <SkeletonList count={2} />
              ) : (
                <MailThread steps={timeline} application={application} onAddNote={handleAddNote} />
              )
            )}

            {activeTab === "notes" && (
              <div className="flex items-start gap-3">
                <StickyNote className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                {application.notes ? (
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{application.notes}</p>
                ) : (
                  <p className="text-sm text-slate-500">No notes yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationDetail;
