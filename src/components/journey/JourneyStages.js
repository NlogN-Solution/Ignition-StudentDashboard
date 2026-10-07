import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  Hourglass,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Paperclip,
  RotateCcw,
  Upload,
  Video,
  XCircle,
} from "lucide-react";

import { buttonClass } from "../dashboard/ui";
import { formatDateTime } from "../../lib/simulate";
import { bestVaultMatch } from "../../lib/reusableDocuments";
import { OFFER_TYPE_LABELS } from "../../lib/applicationStatus";
import { guideHrefForResource } from "../../data/interviewGuides";
import { useAppData } from "../../context/AppDataContext";
import { INTERVIEW_STAGE_KEYS, completedPracticeKeys } from "../../lib/interviewPractice";

/**
 * One screen per stage *kind* — the kinds the backend defines in
 * `WorkflowStageKind`. A stage's name and copy come from the template; what it
 * asks of the student comes from its kind, so a new stage of an existing kind
 * needs no code here.
 */

/* --------------------------------------------------------------- shared --- */

const TONES = {
  done: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  wait: "bg-amber-50 text-amber-700 ring-amber-100",
  stop: "bg-red-50 text-red-700 ring-red-100",
  quiet: "bg-slate-100 text-ink-muted ring-slate-200",
  navy: "bg-navy-50 text-navy-900 ring-navy-100",
};

export const Chip = ({ tone = "quiet", children }) => (
  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${TONES[tone]}`}>
    {children}
  </span>
);

export const Note = ({ tone = "navy", icon: Icon = CheckCircle2, title, children }) => {
  const surface = {
    done: "bg-emerald-50 text-emerald-900",
    wait: "bg-amber-50 text-amber-900",
    stop: "bg-red-50 text-red-900",
    navy: "bg-navy-50 text-navy-900",
  }[tone];
  return (
    <div className={`mt-4 flex items-start gap-3 rounded-xl px-4 py-3 ${surface}`}>
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-0.5 opacity-80">{children}</div>}
      </div>
    </div>
  );
};

const Feedback = ({ label, children }) => (
  <div className="mt-3 rounded-r-xl border-l-[3px] border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950">
    <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">{label}</p>
    <p className="mt-1 whitespace-pre-line">{children}</p>
  </div>
);

/** Nothing to do yet: the stage opens after the one before it. */
const NotYet = ({ step }) =>
  step.status === "pending" ? (
    <Note tone="navy" icon={Hourglass} title="Not open yet">
      This stage opens once the stages before it are done.
    </Note>
  ) : step.status === "skipped" ? (
    <Note tone="navy" icon={CheckCircle2} title="No longer needed">
      Your application moved past this stage.
    </Note>
  ) : step.status === "cancelled" ? (
    <Note tone="stop" icon={XCircle} title="Closed">
      This application's journey has ended.
    </Note>
  ) : null;

const ITEM_STATUS = {
  pending: { tone: "quiet", label: "Needed" },
  submitted: { tone: "wait", label: "Uploaded · in review" },
  verified: { tone: "done", label: "Verified" },
  rejected: { tone: "stop", label: "Re-upload needed" },
  waived: { tone: "quiet", label: "Not needed" },
};

/* ------------------------------------------------------------ documents --- */

export const DocumentsStage = ({
  step,
  journey,
  uploadingItemId,
  onUpload,
  onReuse,
  vaultDocuments = [],
  onToggleGap,
  onSubmit,
  busy,
}) => {
  const inputs = useRef({});
  const isOpen = step.status === "current";
  // `progress` is passed through as the backend wrote it, hence snake_case.
  const submitted = Boolean(step.progress?.submitted_at) || step.status === "completed";
  const items = step.checklist.filter((item) => item.status !== "waived");
  const settled = items.filter((item) => ["submitted", "verified"].includes(item.status)).length;
  const blocking = items.filter((item) => item.isRequired && !["submitted", "verified"].includes(item.status));

  return (
    <>
      {step.config.level_aware && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink-soft">
            Study level:{" "}
            <span className="font-semibold text-navy-900">
              {journey.studyLevel === "pg" ? "Postgraduate (PG)" : "Undergraduate (UG)"}
            </span>
            <span className="text-ink-muted"> · from your course</span>
          </p>
          <label
            className={`flex items-start gap-3 rounded-xl border border-hairline bg-slate-50 px-4 py-3 ${
              isOpen && !submitted ? "cursor-pointer" : "opacity-70"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-navy-900"
              checked={journey.hasStudyGap}
              disabled={!isOpen || submitted || busy}
              onChange={(event) => onToggleGap(event.target.checked)}
            />
            <span className="text-sm">
              <span className="font-semibold text-navy-900">I have a study gap of more than 6 months</span>
              <span className="block text-xs text-ink-muted">Adds a gap explanation document to your list.</span>
            </span>
          </label>
        </div>
      )}

      <h3 className="mt-5 text-sm font-semibold text-navy-900">
        Documents · {settled}/{items.length}
      </h3>
      <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
        {items.map((item) => {
          const state = ITEM_STATUS[item.status] ?? ITEM_STATUS.pending;
          const canUpload = isOpen && !submitted && item.status !== "verified";
          const vaultMatch =
            canUpload && ["pending", "rejected"].includes(item.status)
              ? bestVaultMatch(vaultDocuments, item.documentType)
              : null;
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <FileText className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
              <span className="min-w-[160px] flex-1 text-sm font-medium text-navy-900">{item.label}</span>
              <Chip tone={state.tone}>{state.label}</Chip>
              {vaultMatch && vaultMatch.id !== item.documentId && (
                <button
                  type="button"
                  onClick={() => onReuse(item, vaultMatch.id)}
                  disabled={uploadingItemId === item.id}
                  title={`Use ${vaultMatch.file?.name ?? "the file"} from your Paper Vault`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-navy-900 hover:border-navy-200 disabled:opacity-60"
                >
                  <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                  Use from vault
                </button>
              )}
              {canUpload && (
                <>
                  <input
                    ref={(node) => (inputs.current[item.id] = node)}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={(event) => {
                      onUpload(item, event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => inputs.current[item.id]?.click()}
                    disabled={uploadingItemId === item.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-navy-200 hover:text-navy-900 disabled:opacity-60"
                  >
                    {uploadingItemId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Upload className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {item.documentId ? "Replace" : "Upload"}
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      {submitted ? (
        <Note tone="done" title="Submitted">
          Your counsellor verifies each document. You'll be told if one needs replacing.
        </Note>
      ) : isOpen ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className={buttonClass()} disabled={blocking.length > 0 || busy} onClick={onSubmit}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Submit documents
          </button>
          {blocking.length > 0 && (
            <span className="text-xs text-ink-muted">Upload all {items.length} documents to submit.</span>
          )}
        </div>
      ) : (
        <NotYet step={step} />
      )}
    </>
  );
};

/* --------------------------------------------------------------- issued --- */

const ISSUED_TYPE = { offer_received: "offer_letter", cas_received: "cas_letter" };

export const IssuedStage = ({ step, application, documents, onOpenDocument }) => {
  const milestone = step.config.milestone_status;
  const letters = documents.filter((doc) => doc.documentType === ISSUED_TYPE[milestone]);
  const isCas = milestone === "cas_received";

  if (step.status === "completed") {
    return (
      <>
        {isCas ? (
          application?.casNumber && (
            <div className="mt-5 text-center">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Your CAS number</p>
              <p className="mt-2 inline-block rounded-xl bg-slate-100 px-5 py-2.5 font-mono text-xl tracking-[0.08em] text-navy-900">
                {application.casNumber}
              </p>
            </div>
          )
        ) : (
          <Note tone="done" icon={FileText} title={OFFER_TYPE_LABELS[application?.offerType] ?? "Offer received"}>
            Congratulations. Review your offer, then carry on to the next stage.
          </Note>
        )}
        {letters.length > 0 && (
          <ul className="mt-4 space-y-2">
            {letters.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline p-3">
                <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-navy-900">
                  <FileText className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
                  <span className="truncate">{doc.title || doc.file?.name}</span>
                </span>
                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDocument(doc, "inline")}
                    className="inline-flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink-soft hover:border-navy-200 hover:text-navy-900"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDocument(doc, "attachment")}
                    className="inline-flex items-center gap-1 rounded-lg border border-hairline px-3 py-1.5 text-xs text-ink-soft hover:border-navy-200 hover:text-navy-900"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden /> Download
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }
  if (step.status === "current") {
    return (
      <div className="mt-6 flex flex-col items-center py-6 text-center">
        <Hourglass className="h-9 w-9 text-navy-900" aria-hidden />
        <p className="mt-3 font-semibold text-navy-900">{isCas ? "Awaiting your CAS" : "Awaiting your offer letter"}</p>
        <p className="mt-1 max-w-sm text-sm text-ink-muted">
          You'll be notified the moment the university responds. There's nothing you need to do right now.
        </p>
      </div>
    );
  }
  return <NotYet step={step} />;
};

/* --------------------------------------------------------------- review --- */

const SUBMISSION_STATUS = {
  submitted: { tone: "wait", label: "Waiting for your counsellor" },
  verified: { tone: "done", label: "Verified" },
  changes_requested: { tone: "stop", label: "Feedback received" },
};

const Resource = ({ resource }) => {
  const href = guideHrefForResource(resource);
  const body = (
    <>
      <span className="block text-sm font-semibold text-navy-900">{resource.title}</span>
      {resource.description && <span className="mt-0.5 block text-xs text-ink-muted">{resource.description}</span>}
    </>
  );
  const className = "block rounded-xl border border-hairline bg-slate-50 px-4 py-3";
  if (href?.startsWith("/")) {
    return (
      <Link to={href} className={`${className} hover:border-navy-200`}>
        {body}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={`${className} hover:border-navy-200`}>
        {body}
      </a>
    );
  }
  return <div className={className}>{body}</div>;
};

/** Every round handed in for a review stage, newest first, with the counsellor's feedback. */
export const SubmissionHistory = ({ submissions, isVideo = false }) =>
  submissions.length > 0 ? (
    <>
      <h3 className="mt-5 text-sm font-semibold text-navy-900">Your submissions</h3>
      <ol className="mt-2 space-y-3">
        {[...submissions].reverse().map((sub) => {
          const state = SUBMISSION_STATUS[sub.status];
          return (
            <li key={sub.id} className="rounded-xl border border-hairline p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-navy-900">
                  {isVideo ? "Attempt" : "Round"} {sub.round}
                </span>
                <Chip tone={state.tone}>{state.label}</Chip>
              </div>
              {sub.bodyText && <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-ink-soft">{sub.bodyText}</p>}
              {sub.documentName && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                  <Paperclip className="h-3.5 w-3.5" aria-hidden /> {sub.documentName}
                </p>
              )}
              {sub.externalUrl && (
                <a
                  href={sub.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex items-center gap-1.5 break-all text-xs font-medium text-navy-900 underline"
                >
                  <Link2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden /> {sub.externalUrl}
                </a>
              )}
              {sub.feedback && <Feedback label="Counsellor feedback">{sub.feedback}</Feedback>}
              {sub.feedbackDocumentIds.length > 0 && (
                <p className="mt-2 text-xs text-ink-muted">
                  Your counsellor attached {sub.feedbackDocumentIds.length} document
                  {sub.feedbackDocumentIds.length === 1 ? "" : "s"} — find them in{" "}
                  <Link to="/documents" className="font-medium text-navy-900 underline">
                    My Documents
                  </Link>
                  .
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </>
  ) : null;

/**
 * The way into the Interview Preparation page from the journey's two interview
 * stages. The recording stage also says how far through the three practice
 * interviews the student is, since that is what its hand-in waits on.
 */
const InterviewPrepLink = ({ step }) => {
  const { interviewSessions } = useAppData();
  const required = step.config.requires_practice ?? [];
  const done = completedPracticeKeys(interviewSessions, required).size;
  return (
    <Link
      to="/interviews"
      className="mt-5 flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 px-4 py-3 hover:border-navy-200"
    >
      <GraduationCap className="h-5 w-5 flex-shrink-0 text-navy-900" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-navy-900">Open Interview Preparation →</span>
        <span className="block text-xs text-ink-muted">
          {required.length > 0
            ? `${done} of ${required.length} practice interviews completed`
            : "Guides, practice interviews and your written answers in one place"}
        </span>
      </span>
    </Link>
  );
};

export const ReviewStage = ({ step, onSubmit, busy }) => {
  const config = step.config;
  const latest = step.submissions[step.submissions.length - 1];
  const isOpen = step.status === "current";
  const canSubmit = isOpen && (!latest || latest.status === "changes_requested");
  const isVideo = config.accept === "video";
  const allowText = config.allow_text !== false;
  const allowDocument = config.allow_document !== false;
  const allowLink = Boolean(config.allow_link);
  const isInterviewStage = INTERVIEW_STAGE_KEYS.includes(step.key);
  // A stage that waits on practice interviews is handed in from the
  // Interview Preparation page, which compiles the scores into the hand-in.
  const handInElsewhere = Boolean(config.requires_practice?.length);

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const fileInput = useRef(null);

  const empty = !text.trim() && !file && !link.trim();
  const send = async () => {
    const ok = await onSubmit({ text, file, link, isVideo });
    if (ok) {
      setText("");
      setFile(null);
      setLink("");
    }
  };

  return (
    <>
      {isInterviewStage && <InterviewPrepLink step={step} />}

      {config.resources?.length > 0 && (
        <>
          <h3 className="mt-5 text-sm font-semibold text-navy-900">Resources</h3>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
            {config.resources.map((resource) => (
              <Resource key={resource.title} resource={resource} />
            ))}
          </div>
        </>
      )}

      <SubmissionHistory submissions={step.submissions} isVideo={isVideo} />

      {step.status === "completed" ? (
        <Note tone="done" title="Verified by your counsellor" />
      ) : canSubmit && handInElsewhere ? (
        <Note tone="navy" icon={GraduationCap} title="Hand this in from Interview Preparation">
          Complete the three practice interviews there, then send your scores to your counsellor.{" "}
          <Link to="/interviews" className="font-semibold underline">
            Go to Interview Preparation
          </Link>
        </Note>
      ) : canSubmit ? (
        <div className="mt-5 space-y-3">
          <h3 className="text-sm font-semibold text-navy-900">
            {latest ? "Send an improved version" : isVideo ? "Hand in your recording" : "Your answers"}
          </h3>
          {allowText && (
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={6}
              placeholder="Type your answers here…"
              className="w-full rounded-xl border border-hairline bg-white p-3 text-sm focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
            />
          )}
          {allowDocument && (
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                accept={isVideo ? "video/*,audio/*,.mp4,.mov,.webm,.m4v,.m4a,.mp3" : ".pdf,.doc,.docx,.txt"}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-2 text-sm text-ink-soft hover:border-navy-200 hover:text-navy-900"
              >
                {isVideo ? <Video className="h-4 w-4" aria-hidden /> : <Paperclip className="h-4 w-4" aria-hidden />}
                {file ? "Change file" : isVideo ? "Upload a recording" : allowText ? "Attach a document (optional)" : "Attach a document"}
              </button>
              {file && <span className="truncate text-xs text-ink-muted">{file.name}</span>}
              {isVideo && <span className="text-xs text-ink-muted">Up to 50 MB.</span>}
            </div>
          )}
          {allowLink && (
            <div>
              <label className="text-xs text-ink-muted" htmlFor={`link-${step.id}`}>
                {allowDocument ? "Too big to upload? Paste a link instead (unlisted YouTube, Google Drive…)" : "Link"}
              </label>
              <input
                id={`link-${step.id}`}
                type="url"
                value={link}
                onChange={(event) => setLink(event.target.value)}
                placeholder="https://"
                className="mt-1 h-10 w-full rounded-xl border border-hairline px-3 text-sm focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
              />
            </div>
          )}
          <button type="button" className={buttonClass()} disabled={empty || busy} onClick={send}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {latest ? "Resubmit" : "Send for verification"}
          </button>
        </div>
      ) : isOpen ? (
        <Note tone="wait" icon={Clock} title="Submitted for verification">
          Your counsellor will verify it or send feedback.
        </Note>
      ) : (
        <NotYet step={step} />
      )}
    </>
  );
};

/* -------------------------------------------------------------- booking --- */

const slotTime = (slot) => formatDateTime(slot.startsAt);

export const BookingStage = ({ step, onBook, busy }) => {
  const [picked, setPicked] = useState(null);
  const isOpen = step.status === "current";
  const open = step.slots.filter((slot) => slot.status === "open");
  const booked = step.slots.find((slot) => slot.status === "booked");
  const decided = step.slots.filter((slot) => slot.status === "completed");
  const lastOutcome = decided[decided.length - 1];
  const reschedule = lastOutcome?.outcome === "reschedule";

  if (step.status === "failed") {
    return (
      <div className="mt-6 flex flex-col items-center py-4 text-center">
        <XCircle className="h-10 w-10 text-red-600" aria-hidden />
        <p className="mt-3 text-lg font-semibold text-red-700">Not successful</p>
        <p className="mt-1 max-w-md text-sm text-ink-muted">
          Unfortunately this interview was not successful, and no intake is available for this application.
          {lastOutcome?.outcomeNote ? ` ${lastOutcome.outcomeNote}` : ""}
        </p>
        <Link to="/messages" className={`${buttonClass()} mt-5`}>
          <MessageCircle className="h-4 w-4" aria-hidden /> Talk to your counsellor
        </Link>
      </div>
    );
  }
  if (step.status === "completed") {
    return <Note tone="done" title="Passed">{lastOutcome ? `Interview on ${slotTime(lastOutcome)}.` : null}</Note>;
  }
  if (!isOpen) return <NotYet step={step} />;

  if (booked) {
    return (
      <Note tone="navy" icon={CalendarDays} title="Interview booked">
        <p>{slotTime(booked)}</p>
        {booked.location && (
          <p className="mt-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden /> {booked.location}
          </p>
        )}
        {booked.meetingLink && (
          <a href={booked.meetingLink} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-medium underline">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Join link
          </a>
        )}
        <p className="mt-1">It's on your Appointments page too. Your counsellor will record the result.</p>
      </Note>
    );
  }

  return (
    <>
      {reschedule && (
        <Note tone="wait" icon={RotateCcw} title="Another attempt">
          {lastOutcome.outcomeNote || "Choose a new slot for another attempt."}
        </Note>
      )}
      {open.length === 0 ? (
        <Note tone="navy" icon={Clock} title="Times coming soon">
          Your counsellor will offer interview times here. You'll get a notification when they do.
        </Note>
      ) : (
        <>
          <h3 className="mt-5 text-sm font-semibold text-navy-900">Available slots</h3>
          <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setPicked(slot.id)}
                className={`rounded-xl border-[1.5px] px-4 py-3 text-left transition-colors ${
                  picked === slot.id ? "border-navy-900 bg-navy-50" : "border-hairline bg-white hover:border-navy-200"
                }`}
              >
                <span className="block text-sm font-semibold text-navy-900">{slotTime(slot)}</span>
                {slot.location && <span className="mt-0.5 block text-xs text-ink-muted">{slot.location}</span>}
                {!slot.location && slot.meetingLink && <span className="mt-0.5 block text-xs text-ink-muted">Online</span>}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`${buttonClass()} mt-4`}
            disabled={!picked || busy}
            onClick={() => onBook(picked)}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Confirm booking
          </button>
        </>
      )}
    </>
  );
};

/* ------------------------------------------------------------ checklist --- */

export const ChecklistStage = ({ step, onTick, busy }) => {
  const tasks = step.config.tasks ?? [];
  const ticks = step.progress?.tasks ?? {};
  const done = tasks.filter((task) => ticks[task.key]).length;
  const isOpen = step.status === "current";

  return (
    <>
      <h3 className="mt-5 text-sm font-semibold text-navy-900">
        Checklist · {done}/{tasks.length}
      </h3>
      <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
        {tasks.map((task) => {
          const checked = Boolean(ticks[task.key]);
          return (
            <li key={task.key}>
              <label className={`flex items-center gap-3 px-4 py-3 ${isOpen ? "cursor-pointer" : ""}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-600"
                  checked={checked}
                  disabled={!isOpen || busy}
                  onChange={(event) => onTick(task.key, event.target.checked)}
                />
                <span className={`text-sm ${checked ? "text-ink-muted line-through" : "text-navy-900"}`}>{task.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {step.status === "completed" ? (
        <Note tone="done" title="All visa steps complete">
          Awaiting your visa decision. Good luck!
        </Note>
      ) : isOpen ? (
        <p className="mt-3 text-xs text-ink-muted">
          Fees, appointments and documents for your visa are on the{" "}
          <Link to="/visa" className="font-medium text-navy-900 underline">
            Visa page
          </Link>
          .
        </p>
      ) : (
        <NotYet step={step} />
      )}
    </>
  );
};

/* ----------------------------------------------------------------- info --- */

export const InfoStage = ({ step }) =>
  step.status === "completed" ? (
    <Note tone="done" title="Done" />
  ) : step.status === "current" ? (
    <Note tone="navy" icon={AlertCircle} title="In progress">
      Your counsellor is working on this stage.
    </Note>
  ) : (
    <NotYet step={step} />
  );
