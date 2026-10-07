import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Eye,
  FileImage,
  FileText,
  Info,
  Landmark,
  Lightbulb,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useAppData } from "../../context/AppDataContext";
import { useRequestedDocuments } from "../../hooks/useRequestedDocuments";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import { DOCUMENT_TYPE_LABELS, ISSUED_DOCUMENT_TYPES, getDocumentBlob } from "../../api/studentPortal";
import { openDocumentFile } from "../../lib/documentFile";
import { formatDateTime, formatFileSize } from "../../lib/simulate";

/* --------------------------------------------------------------- taxonomy --- */

/**
 * The five folders the page is organised by. The backend has one flat
 * `DocumentType`; grouping is a presentation decision, so it lives here.
 */
const CATEGORIES = [
  { id: "identity", label: "Identity", types: ["passport", "citizenship", "national_id", "photo"] },
  {
    id: "academic",
    label: "Academic",
    types: [
      "academic_transcript",
      "academic_certificate",
      "provisional_certificate",
      "character_certificate",
      "recommendation_letter",
      "cv",
      "statement_of_purpose",
      "other",
    ],
  },
  { id: "english", label: "English", types: ["english_test"] },
  { id: "financial", label: "Financial", types: ["financial_document"] },
  { id: "visa", label: "Visa", types: ["visa", "offer_letter", "cas_letter", "medical_report"] },
];

const categoryOf = (documentType) =>
  CATEGORIES.find((category) => category.types.includes(documentType)) ?? CATEGORIES[1];

/**
 * How a row's status reads. "Missing" is not a `DocumentStatus` — it is a
 * request with nothing sent against it yet.
 */
const ROW_STATUS = {
  approved: { label: "Approved", pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", group: "ready" },
  rejected: { label: "Changes required", pill: "bg-amber-50 text-amber-600", dot: "bg-amber-500", group: "action" },
  expired: { label: "Expired", pill: "bg-red-50 text-red-600", dot: "bg-red-500", group: "action" },
  under_review: { label: "Under review", pill: "bg-navy-50 text-navy-800", dot: "bg-navy-900", group: "review" },
  uploaded: { label: "Under review", pill: "bg-navy-50 text-navy-800", dot: "bg-navy-900", group: "review" },
  pending: { label: "Under review", pill: "bg-navy-50 text-navy-800", dot: "bg-navy-900", group: "review" },
  missing: { label: "Missing", pill: "bg-red-50 text-red-600", dot: "bg-red-500", group: "action" },
};

const rowStatus = (status) => ROW_STATUS[status] ?? ROW_STATUS.pending;

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "ready", label: "Approved" },
  { value: "review", label: "Under review" },
  { value: "action", label: "Action needed" },
];

const fileKind = (mimeType, name) => {
  const value = `${mimeType ?? ""} ${name ?? ""}`.toLowerCase();
  if (value.includes("pdf")) return "pdf";
  if (/image|\.png|\.jpe?g|\.webp|\.heic/.test(value)) return "image";
  if (/word|\.docx?|document/.test(value)) return "doc";
  return "other";
};

const FILE_TYPE_LABELS = { pdf: "PDF", image: "Image", doc: "Word document", other: "File" };

const shortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

/* ---------------------------------------------------------------- pieces --- */

const FileBadge = ({ kind, missing }) => {
  if (missing) {
    return (
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <FileText className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  if (kind === "pdf") {
    return (
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-red-600 text-[10px] font-bold italic text-white">
        pdf
      </span>
    );
  }
  if (kind === "image") {
    return (
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-400 text-white">
        <FileImage className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white">
      <FileText className="h-5 w-5" aria-hidden />
    </span>
  );
};

const StatusPill = ({ status, small = false }) => {
  const meta = rowStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md ${small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]"} font-medium ${meta.pill}`}
    >
      <span aria-hidden className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const StatCard = ({ icon: Icon, tint, count, label, hint }) => (
  <div className="flex items-center gap-4 rounded-2xl border border-hairline bg-white px-5 py-5 shadow-card">
    <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${tint}`}>
      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
    </span>
    <div className="min-w-0">
      <p className="text-2xl font-bold leading-none text-navy-900">{count}</p>
      <p className="mt-2 text-sm font-semibold text-navy-900">{label}</p>
      <p className="mt-0.5 truncate text-xs text-ink-muted">{hint}</p>
    </div>
  </div>
);

const Select = ({ value, onChange, options, label }) => (
  <label className="relative">
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 appearance-none rounded-lg border border-hairline bg-white pl-3 pr-9 text-sm font-medium text-navy-900 focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
  </label>
);

/** Row "…" menu. Closes on outside click and Escape. */
const RowMenu = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type === "mousedown" && ref.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-label="Document actions"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="rounded-lg p-1.5 text-navy-800 transition-colors hover:bg-navy-50"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <ul className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-hairline bg-white py-1 shadow-float">
          {items
            .filter((item) => !item.hidden)
            .map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled={item.disabled}
                    title={item.disabledReason}
                    onClick={() => {
                      setOpen(false);
                      item.onClick();
                    }}
                    className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                      item.danger ? "text-red-600 hover:bg-red-50" : "text-navy-900 hover:bg-navy-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {item.label}
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

/* ------------------------------------------------------------ side panel --- */

const PreviewPane = ({ document }) => {
  const [state, setState] = useState({ status: "loading", url: null });
  const kind = fileKind(document.file?.mimeType, document.file?.name);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", url: null });
    let objectUrl = null;
    // The bytes, not the signed Cloudinary URL: that one is served with
    // `X-Frame-Options: DENY`, so a PDF in the frame below rendered blank.
    getDocumentBlob(document.id, "inline")
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ status: "ready", url: objectUrl });
      })
      .catch(() => !cancelled && setState({ status: "error", url: null }));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [document.id, document.file?.name]);

  const frame = "flex h-[260px] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100";
  if (state.status === "loading") {
    return (
      <div className={frame}>
        <Loader2 className="h-6 w-6 animate-spin text-ink-faint" aria-label="Loading preview" />
      </div>
    );
  }
  if (state.status === "error" || !state.url) {
    return (
      <div className={`${frame} flex-col gap-2`}>
        <FileText className="h-8 w-8 text-ink-faint" aria-hidden />
        <p className="text-sm text-ink-muted">Preview isn't available for this file.</p>
      </div>
    );
  }
  if (kind === "image") {
    return (
      <div className={`${frame} bg-gray-200`}>
        <img src={state.url} alt={`Preview of ${document.file?.name}`} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }
  if (kind === "pdf") {
    return (
      <div className={frame}>
        <iframe title={`Preview of ${document.file?.name}`} src={`${state.url}#toolbar=0&view=FitH`} className="h-full w-full" />
      </div>
    );
  }
  return (
    <div className={`${frame} flex-col gap-2`}>
      <FileText className="h-8 w-8 text-ink-faint" aria-hidden />
      <p className="text-sm text-ink-muted">No inline preview for this file type.</p>
    </div>
  );
};

const StatusBanner = ({ document }) => {
  if (document.status === "approved") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 fill-emerald-500 text-white" aria-hidden />
        <p className="text-[13px] text-navy-900">
          {document.isFromIgnition
            ? "Ignition filed this for you — it's final and ready to use."
            : "This document has been verified and is ready to use in your applications."}
        </p>
      </div>
    );
  }
  if (document.status === "rejected" || document.status === "expired") {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" aria-hidden />
        <div className="text-[13px] text-navy-900">
          <p className="font-medium">
            {document.status === "expired" ? "This document has expired." : "Your counsellor asked for changes."}
          </p>
          {document.rejectionReason && <p className="mt-0.5 text-ink-soft">{document.rejectionReason}</p>}
          <p className="mt-0.5 text-ink-soft">Replace the file to send it back for review.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-xl bg-navy-50 px-4 py-3">
      <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy-900" aria-hidden />
      <p className="text-[13px] text-navy-900">Our team is checking this document. We'll let you know once it's verified.</p>
    </div>
  );
};

const DetailPanel = ({ document, onClose, onOpen, onReplace, onDelete, isBusy }) => {
  const [tab, setTab] = useState("preview");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const replaceRef = useRef(null);

  useEffect(() => {
    setTab("preview");
    setConfirmingDelete(false);
  }, [document.id]);

  const kind = fileKind(document.file?.mimeType, document.file?.name);
  const canChange = !document.isFromIgnition;
  const canDelete = canChange && document.status !== "approved";
  const category = categoryOf(document.documentType);

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-start gap-3 p-5 pb-0">
        <FileBadge kind={kind} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-navy-900">{document.file?.name || document.title}</h2>
            <StatusPill status={document.status} small />
          </div>
          <p className="mt-1 text-[13px] text-ink-muted">
            {category.label} Document · {formatFileSize(document.file?.sizeBytes)}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" className="rounded-lg p-1 text-ink-muted hover:bg-gray-100">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div role="tablist" className="mt-4 flex gap-2 border-b border-hairline px-5">
        {[
          { id: "preview", label: "Preview" },
          { id: "details", label: "Details" },
        ].map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`relative px-5 py-3 text-sm font-medium ${tab === item.id ? "text-navy-900" : "text-ink-soft hover:text-navy-900"}`}
          >
            {item.label}
            {tab === item.id && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-navy-900" />}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {tab === "preview" ? (
          <PreviewPane document={document} />
        ) : (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-ink-muted">Document type</dt>
              <dd className="text-navy-900">{DOCUMENT_TYPE_LABELS[document.documentType] ?? document.title}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Title</dt>
              <dd className="text-navy-900">{document.title}</dd>
            </div>
            {document.expiryDate && (
              <div>
                <dt className="text-ink-muted">Expires</dt>
                <dd className="text-navy-900">{shortDate(document.expiryDate)}</dd>
              </div>
            )}
            {document.verifiedAt && (
              <div>
                <dt className="text-ink-muted">Verified</dt>
                <dd className="text-navy-900">{formatDateTime(document.verifiedAt)}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink-muted">Added by</dt>
              <dd className="text-navy-900">{document.isFromIgnition ? "Ignition" : "You"}</dd>
            </div>
            {document.remarks && (
              <div>
                <dt className="text-ink-muted">Notes</dt>
                <dd className="whitespace-pre-wrap text-navy-900">{document.remarks}</dd>
              </div>
            )}
          </dl>
        )}

        <StatusBanner document={document} />

        <div>
          <h3 className="text-[15px] font-semibold text-navy-900">File information</h3>
          <dl className="mt-3 grid grid-cols-[110px_minmax(0,1fr)] gap-y-2.5 text-[13px]">
            <dt className="text-ink-muted">File name</dt>
            <dd className="truncate text-navy-900">{document.file?.name || "—"}</dd>
            <dt className="text-ink-muted">File type</dt>
            <dd className="text-navy-900">{FILE_TYPE_LABELS[kind]}</dd>
            <dt className="text-ink-muted">File size</dt>
            <dd className="text-navy-900">{formatFileSize(document.file?.sizeBytes)}</dd>
            <dt className="text-ink-muted">Uploaded</dt>
            <dd className="text-navy-900">{formatDateTime(document.file?.uploadedAt)}</dd>
          </dl>
        </div>

        <div>
          <h3 className="text-[15px] font-semibold text-navy-900">Used in</h3>
          {document.applications.length === 0 ? (
            <p className="mt-2 text-[13px] text-ink-muted">
              Not attached to an application yet — your counsellor adds it when one needs it.
            </p>
          ) : (
            <ul className="mt-2 space-y-2.5">
              {document.applications.map((application) => (
                <li key={application.id} className="flex items-center gap-3 text-[13px]">
                  <Landmark className="h-5 w-5 flex-shrink-0 text-navy-900" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-navy-900">{application.universityName}</span>
                  <span className="flex flex-shrink-0 items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Using this document
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-hairline p-5">
        <button
          type="button"
          onClick={() => onOpen(document, "attachment")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm font-medium text-navy-900 hover:border-navy-200 hover:bg-navy-50"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download
        </button>
        {canChange && (
          <>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => replaceRef.current?.click()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline px-3 py-2.5 text-sm font-medium text-navy-900 hover:border-navy-200 hover:bg-navy-50 disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
              Replace file
            </button>
            <input
              ref={replaceRef}
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) onReplace(document, file);
              }}
            />
            <button
              type="button"
              disabled={!canDelete || isBusy}
              title={canDelete ? undefined : "Approved documents can't be deleted — replace the file instead"}
              onClick={() => (confirmingDelete ? onDelete(document) : setConfirmingDelete(true))}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {confirmingDelete ? "Confirm delete" : "Delete"}
            </button>
          </>
        )}
      </div>
    </aside>
  );
};

/* ---------------------------------------------------------------- upload --- */

/** Pick a type, pick a file. Offer and CAS letters are left out on purpose:
 * Ignition files those, and a student-uploaded one is a file nobody can act on. */
const UploadModal = ({ onClose, onUpload, isUploading }) => {
  const [type, setType] = useState("");
  const [file, setFile] = useState(null);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-950/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-float">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Upload a document</h2>
            <p className="mt-1 text-sm text-ink-muted">PDF, JPG or PNG. Make sure every page is clear and legible.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-muted hover:bg-gray-100">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <label className="mt-5 block text-sm font-medium text-navy-900">
          Document type
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-1.5 h-11 w-full rounded-lg border border-hairline bg-white px-3 text-sm focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
          >
            <option value="">Choose a type…</option>
            {CATEGORIES.map((category) => (
              <optgroup key={category.id} label={category.label}>
                {category.types
                  .filter((value) => !ISSUED_DOCUMENT_TYPES.includes(value))
                  .map((value) => (
                    <option key={value} value={value}>
                      {DOCUMENT_TYPE_LABELS[value]}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy-200 bg-navy-50/40 px-4 py-6 text-center hover:bg-navy-50">
          <Upload className="h-6 w-6 text-navy-900" aria-hidden />
          <span className="text-sm font-medium text-navy-900">{file ? file.name : "Choose a file"}</span>
          {file && <span className="text-xs text-ink-muted">{formatFileSize(file.size)}</span>}
          <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={!type || !file || isUploading}
            onClick={() => onUpload(type, file)}
            className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-950 disabled:opacity-50"
          >
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

const GuidelinesModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-navy-950/40 p-4" role="dialog" aria-modal="true">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-float">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold text-navy-900">Upload guidelines</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-muted hover:bg-gray-100">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <ul className="mt-4 space-y-3">
        {[
          { tone: "info", text: "Upload PDF, JPG or PNG files — one document per file." },
          ...formOptions.documentGuidelines,
        ].map((guideline) => {
          const Icon = guideline.tone === "warning" ? AlertTriangle : Info;
          return (
            <li key={guideline.text} className="flex items-start gap-3 text-sm text-ink-soft">
              <Icon
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${guideline.tone === "warning" ? "text-amber-500" : "text-navy-900"}`}
                aria-hidden
              />
              {guideline.text}
            </li>
          );
        })}
      </ul>
    </div>
  </div>
);

/* ------------------------------------------------------------------ page --- */

const DocumentsPage = () => {
  const { documents, uploadDocument, replaceDocument, deleteDocument, reloadDocuments } = useAppData();
  // Staff requests across every application — the "Missing" rows. Shared with
  // the dashboard so both screens agree about what is outstanding.
  const { items: requestedItems, uploadingItemId, fulfil, reload: reloadRequested } = useRequestedDocuments();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("latest");
  const [selectedId, setSelectedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const requestInputRefs = useRef({});

  // Pick up anything staff verified since the documents were last fetched.
  useEffect(() => {
    reloadDocuments();
  }, [reloadDocuments]);

  // One row per uploaded document, plus one per request nothing has been sent
  // against yet. A request already answered is represented by its document.
  const rows = useMemo(() => {
    const uploaded = documents.map((doc) => ({
      key: doc.id,
      kind: "document",
      document: doc,
      name: doc.file?.name || doc.title,
      subtitle: formatFileSize(doc.file?.sizeBytes),
      category: categoryOf(doc.documentType),
      status: doc.status,
      usedIn:
        doc.applications.length === 0
          ? "—"
          : doc.applications.length === 1
          ? doc.applications[0].universityName
          : `${doc.applications.length} applications`,
      date: doc.file?.uploadedAt,
    }));
    const missing = requestedItems
      .filter((item) => item.status === "pending" && !item.documentId)
      .map((item) => ({
        key: `request-${item.id}`,
        kind: "request",
        item,
        name: item.label,
        subtitle: "Not uploaded yet",
        category: categoryOf(item.documentType),
        status: "missing",
        usedIn: item.applicationName || "—",
        date: null,
      }));
    return [...uploaded, ...missing];
  }, [documents, requestedItems]);

  const stats = useMemo(
    () => ({
      ready: rows.filter((row) => rowStatus(row.status).group === "ready").length,
      action: rows.filter((row) => rowStatus(row.status).group === "action").length,
      review: rows.filter((row) => rowStatus(row.status).group === "review").length,
      total: documents.length,
    }),
    [rows, documents.length]
  );

  const categoryCounts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((category) => [
          category.id,
          rows.filter((row) => row.category.id === category.id && row.kind === "document").length,
        ])
      ),
    [rows]
  );

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter(
      (row) =>
        (activeCategory === "all" || row.category.id === activeCategory) &&
        (statusFilter === "all" || rowStatus(row.status).group === statusFilter) &&
        (!needle || row.name.toLowerCase().includes(needle) || row.usedIn.toLowerCase().includes(needle))
    );
    const time = (row) => (row.date ? new Date(row.date).getTime() : 0);
    // Missing rows always sink below uploaded ones — they have no date, and a
    // "Latest" sort that interleaved them would read as arbitrary.
    return [...filtered].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "document" ? -1 : 1;
      if (sort === "name") return a.name.localeCompare(b.name);
      return sort === "oldest" ? time(a) - time(b) : time(b) - time(a);
    });
  }, [rows, activeCategory, statusFilter, query, sort]);

  // Open the first document's preview automatically once the list loads, so
  // the side panel isn't empty on arrival. Only fires once — closing the
  // panel afterwards (setSelectedId(null)) must stick.
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (didAutoSelect.current || documents.length === 0) return;
    const firstDocument = visibleRows.find((row) => row.kind === "document");
    if (firstDocument) {
      didAutoSelect.current = true;
      setSelectedId(firstDocument.document.id);
    }
  }, [documents, visibleRows]);

  const selectedDocument = documents.find((doc) => doc.id === selectedId) ?? null;

  const handleOpen = async (document, disposition) => {
    const result = await openDocumentFile(document.id, { disposition });
    if (result.ok) return;
    showToast("Couldn't open that file. Please try again.", "error");
  };

  const handleReplace = async (document, file) => {
    setBusyId(document.id);
    try {
      await replaceDocument(document.id, file);
      await reloadRequested();
      showToast("File replaced — it's back with our team for review.");
    } catch {
      showToast("Couldn't replace that file. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (document) => {
    setBusyId(document.id);
    try {
      await deleteDocument(document.id);
      await reloadRequested();
      setSelectedId(null);
      showToast("Document deleted.");
    } catch (error) {
      showToast(error?.message || "Couldn't delete that document.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleUploadNew = async (type, file) => {
    setIsUploading(true);
    try {
      const uploaded = await uploadDocument(type, file);
      setIsUploadOpen(false);
      setSelectedId(uploaded.id);
      showToast("Document uploaded.");
    } catch {
      showToast("Couldn't upload that document. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFulfil = async (item, file) => {
    if (!file) return;
    const result = await fulfil(item, file);
    if (result.ok) {
      await reloadDocuments();
      setSelectedId(result.document.id);
    }
    showToast(
      result.ok ? `${item.label} uploaded — your counsellor will review it.` : "Couldn't upload that document. Please try again.",
      result.ok ? "success" : "error"
    );
  };

  return (
    <div className="min-h-screen pb-16">
      <div
        className={`mx-auto grid max-w-[1500px] grid-cols-1 gap-6 px-4 pt-8 sm:px-6 ${
          selectedDocument ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""
        }`}
      >
        <main className="min-w-0 space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-navy-900">Paper Vault</h1>
              <p className="mt-1 text-[15px] text-ink-soft">
                Keep your documents organised, verified and ready for every university application.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-lift transition-colors hover:bg-navy-950"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Upload Document
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <StatCard icon={CheckCircle2} tint="bg-emerald-50 text-emerald-600" count={stats.ready} label="Ready" hint="Approved & ready to use" />
            <StatCard icon={AlertCircle} tint="bg-ignite-50 text-ignite-500" count={stats.action} label="Action needed" hint="Missing or needs changes" />
            <StatCard icon={Clock} tint="bg-navy-50 text-navy-900" count={stats.review} label="Under review" hint="Being checked by our team" />
            <StatCard icon={FileText} tint="bg-gray-100 text-ink-muted" count={stats.total} label="Total documents" hint="In your vault" />
          </div>

          {/* Tip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-white px-5 py-3.5 shadow-card">
            <p className="flex items-center gap-2.5 text-sm text-ink-soft">
              <Lightbulb className="h-5 w-5 text-amber-400" aria-hidden />
              <span className="font-semibold text-navy-900">Tip:</span>
              Ensure your documents are in the correct format before uploading.
            </p>
            <button
              type="button"
              onClick={() => setIsGuidelinesOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-navy-900 hover:underline"
            >
              View upload guidelines <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Table */}
          <section className="rounded-2xl border border-hairline bg-white shadow-card">
            <div className="flex flex-col gap-3 border-b border-hairline px-4 pt-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div role="tablist" className="-mb-px flex overflow-x-auto">
                {[{ id: "all", label: "All", count: documents.length }, ...CATEGORIES.map((category) => ({ ...category, count: categoryCounts[category.id] }))].map(
                  (tab) => {
                    const active = activeCategory === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => setActiveCategory(tab.id)}
                        className={`relative whitespace-nowrap px-4 py-3.5 text-sm font-medium ${
                          active ? "text-navy-900" : "text-ink-soft hover:text-navy-900"
                        }`}
                      >
                        {tab.label} ({tab.count})
                        {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-navy-900" />}
                      </button>
                    );
                  }
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 pb-3">
                <label className="relative">
                  <span className="sr-only">Search documents</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search documents..."
                    className="h-10 w-52 rounded-lg border border-hairline bg-[#F8F9FC] pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-100"
                  />
                </label>
                <Select label="Status" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS.map((f) => ({ ...f, label: f.value === "all" ? "Status" : f.label }))} />
                <Select
                  label="Sort"
                  value={sort}
                  onChange={setSort}
                  options={[
                    { value: "latest", label: "Latest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "name", label: "Name" },
                  ]}
                />
              </div>
            </div>

            {visibleRows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <FileText className="h-8 w-8 text-ink-faint" aria-hidden />
                <p className="text-sm font-medium text-navy-900">
                  {rows.length === 0 ? "No documents yet" : "Nothing matches"}
                </p>
                <p className="text-sm text-ink-muted">
                  {rows.length === 0
                    ? "Upload your first document, or wait for your counsellor to request one."
                    : "Try another category, status or search."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto p-2">
                <table className="w-full min-w-[820px] border-separate border-spacing-y-0 text-left text-sm">
                  <thead className="sr-only">
                    <tr>
                      <th>Document</th>
                      <th>Category</th>
                      <th>Used in</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const selected = row.kind === "document" && row.document.id === selectedId;
                      const doc = row.document;
                      return (
                        <tr
                          key={row.key}
                          onClick={() => row.kind === "document" && setSelectedId(doc.id)}
                          className={`${row.kind === "document" ? "cursor-pointer" : ""} ${
                            selected ? "bg-navy-50/70" : "hover:bg-[#F8F9FC]"
                          }`}
                        >
                          <td className={`rounded-l-xl border-b border-hairline px-3 py-4 ${selected ? "border-transparent" : ""}`}>
                            <div className="flex items-center gap-3">
                              <FileBadge kind={doc ? fileKind(doc.file?.mimeType, doc.file?.name) : "other"} missing={row.kind === "request"} />
                              <div className="min-w-0">
                                <p className="max-w-[260px] font-medium text-navy-900">{row.name}</p>
                                <p className="mt-0.5 text-[13px] text-ink-muted">{row.subtitle}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`border-b border-hairline px-3 py-4 text-ink-soft ${selected ? "border-transparent" : ""}`}>
                            {row.category.label}
                          </td>
                          <td className={`border-b border-hairline px-3 py-4 text-ink-soft ${selected ? "border-transparent" : ""}`}>
                            {row.usedIn}
                          </td>
                          <td className={`border-b border-hairline px-3 py-4 ${selected ? "border-transparent" : ""}`}>
                            <StatusPill status={row.status} />
                          </td>
                          <td className={`whitespace-nowrap border-b border-hairline px-3 py-4 text-ink-soft ${selected ? "border-transparent" : ""}`}>
                            {shortDate(row.date)}
                          </td>
                          <td className={`rounded-r-xl border-b border-hairline px-3 py-4 text-right ${selected ? "border-transparent" : ""}`}>
                            {row.kind === "request" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={uploadingItemId === row.item.id}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    requestInputRefs.current[row.item.id]?.click();
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-5 py-2 text-sm font-medium text-navy-900 hover:bg-navy-50 disabled:opacity-60"
                                >
                                  {uploadingItemId === row.item.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                                  Upload
                                </button>
                                <input
                                  ref={(element) => {
                                    requestInputRefs.current[row.item.id] = element;
                                  }}
                                  type="file"
                                  className="hidden"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    event.target.value = "";
                                    handleFulfil(row.item, file);
                                  }}
                                />
                              </>
                            ) : (
                              <div className="flex justify-end">
                                <RowMenu
                                  items={[
                                    { label: "View details", icon: Info, onClick: () => setSelectedId(doc.id) },
                                    { label: "Open file", icon: Eye, onClick: () => handleOpen(doc, "inline") },
                                    { label: "Download", icon: Download, onClick: () => handleOpen(doc, "attachment") },
                                    {
                                      label: "Replace file",
                                      icon: RefreshCw,
                                      hidden: doc.isFromIgnition,
                                      onClick: () => setSelectedId(doc.id),
                                    },
                                  ]}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        {selectedDocument && (
          <div className="fixed inset-0 z-[70] bg-navy-950/30 p-3 lg:static lg:z-auto lg:bg-transparent lg:p-0">
            <div className="ml-auto h-full max-w-[400px] lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:max-w-none">
              <DetailPanel
                document={selectedDocument}
                isBusy={busyId === selectedDocument.id}
                onClose={() => setSelectedId(null)}
                onOpen={handleOpen}
                onReplace={handleReplace}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}
      </div>

      {isUploadOpen && (
        <UploadModal onClose={() => setIsUploadOpen(false)} onUpload={handleUploadNew} isUploading={isUploading} />
      )}
      {isGuidelinesOpen && <GuidelinesModal onClose={() => setIsGuidelinesOpen(false)} />}
    </div>
  );
};

export default DocumentsPage;
