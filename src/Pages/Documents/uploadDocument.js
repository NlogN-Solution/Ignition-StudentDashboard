import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  Info,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Lightbulb,
  Plus,
  X,
} from "lucide-react";

import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import { useAppData } from "../../context/AppDataContext";
import { useRequestedDocuments } from "../../hooks/useRequestedDocuments";
import { useToast } from "../../context/ToastContext";
import formOptions from "../../data/formOptions.json";
import { DOCUMENT_TYPE_LABELS, ISSUED_DOCUMENT_TYPES } from "../../api/studentPortal";
import { openDocumentFile } from "../../lib/documentFile";
import { formatDateTime, formatFileSize } from "../../lib/simulate";

const GUIDELINE_ICONS = { info: Info, warning: AlertTriangle };
const GUIDELINE_COLORS = { info: "text-blue-500", warning: "text-amber-500" };

// A Document is "done" once staff has approved it — every other real
// DocumentStatus (pending/uploaded/under_review/rejected/expired) still
// needs the student's attention or staff review.
const DONE_STATUSES = new Set(["approved"]);

/**
 * What we know about a file, plus the two ways to open it.
 *
 * This used to draw a grey box reading "preview is simulated in this build",
 * beside a Download button that raised a toast describing the file it would
 * have given you. Neither was true: the bytes have always been in storage and
 * reachable — what was missing was a link a browser could follow, since the
 * download route needs a bearer header a new tab does not send. `openDocumentFile`
 * fetches a signed URL over the authenticated call and opens that.
 */
const PreviewModal = ({ document, onClose, onOpen }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/50 p-4">
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{document.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{document.description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600"
          aria-label="Close preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="h-40 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col items-center justify-center gap-3 text-gray-500">
          <FileText className="w-10 h-10" />
          <button
            type="button"
            onClick={() => onOpen(document, "inline")}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-blue-600"
          >
            <Eye className="h-4 w-4" aria-hidden />
            Open this file
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-gray-500">File name</dt>
            <dd className="text-gray-900 break-all">{document.file.name}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Size</dt>
            <dd className="text-gray-900">{formatFileSize(document.file.sizeBytes)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Type</dt>
            <dd className="text-gray-900">{document.file.mimeType || "Unknown"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Uploaded</dt>
            <dd className="text-gray-900">{formatDateTime(document.file.uploadedAt)}</dd>
          </div>
        </dl>

        {document.rejectionReason && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{document.rejectionReason}</div>
        )}
      </div>

      <div className="px-6 pb-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => onOpen(document, "attachment")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

/**
 * What state this document is actually in.
 *
 * The card used to render one green tick and one of two words — "Verified" if
 * approved, "On file" otherwise — so a document a counsellor had *rejected*
 * showed a green tick reading "On file" next to the rejection reason. Each real
 * `DocumentStatus` gets its own line and its own colour, and a letter Ignition
 * filed says so rather than pretending the student put it there.
 */
const STATE_CHIPS = {
  approved: { className: "bg-green-50 text-green-600", icon: CheckCircle2, label: "Verified" },
  rejected: { className: "bg-red-50 text-red-600", icon: AlertTriangle, label: "Needs replacing" },
  expired: { className: "bg-red-50 text-red-600", icon: AlertTriangle, label: "Expired" },
  under_review: { className: "bg-amber-50 text-amber-700", icon: Clock, label: "Being reviewed" },
  pending: { className: "bg-amber-50 text-amber-700", icon: Clock, label: "Awaiting review" },
  uploaded: { className: "bg-amber-50 text-amber-700", icon: Clock, label: "Awaiting review" },
};

const StateChip = ({ document }) => {
  const chip = STATE_CHIPS[document.status] ?? STATE_CHIPS.pending;
  const Icon = chip.icon;
  // Anything Ignition filed for the student is final by the time they see it —
  // there is nobody left to review an offer letter against.
  const label = document.isFromIgnition ? "From Ignition" : chip.label;
  const className = document.isFromIgnition ? "bg-navy-50 text-navy-700" : chip.className;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${className}`}>
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
};

const StudyAbroadPortal = ({ onNext, onBack }) => {
  const { documents, uploadDocument, reloadDocuments, documentProgress } = useAppData();
  // The list of things staff have asked for, and the one correct way to answer
  // one. Shared with the dashboard so both screens agree about what is
  // outstanding — see `useRequestedDocuments`.
  const {
    items: requestedItems,
    outstanding: outstandingItems,
    inFlight: inFlightItems,
    settled: settledItems,
    isLoading: isRequestedLoading,
    uploadingItemId,
    fulfil,
    reload: reloadRequested,
  } = useRequestedDocuments();
  const { showToast } = useToast();

  const [previewId, setPreviewId] = useState(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [uploadType, setUploadType] = useState("");
  const replaceInputRefs = useRef({});
  const newUploadInputRef = useRef(null);

  const categories = useMemo(
    () => [...new Set(documents.map((doc) => doc.category))],
    [documents]
  );

  const previewDocument = documents.find((doc) => doc.id === previewId) ?? null;

  const handleFileUpload = async (docId, event) => {
    const file = event.target.files[0];
    if (!file) return;
    // Reset so re-picking the same file still fires a change event.
    event.target.value = "";
    setUploadingDocId(docId);
    try {
      await uploadDocument(docId, file);
      showToast("Document uploaded.");
    } catch {
      showToast("Couldn't upload that document. Please try again.", "error");
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleUploadForRequestedItem = async (item, event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    const result = await fulfil(item, file);
    showToast(
      result.ok
        ? `${item.label} uploaded — your counsellor will review it.`
        : "Couldn't upload that document. Please try again.",
      result.ok ? "success" : "error"
    );
  };

  const handleOpen = async (document, disposition) => {
    const result = await openDocumentFile(document.id, { disposition });
    if (!result.ok) showToast("Couldn't open that file. Please try again.", "error");
  };

  const handleRefresh = async () => {
    await Promise.all([reloadDocuments(), reloadRequested()]);
    showToast("Up to date.");
  };

  const handleNewTypeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !uploadType) return;
    event.target.value = "";
    setUploadingDocId(uploadType);
    try {
      await uploadDocument(uploadType, file);
      showToast("Document uploaded.");
      setUploadType("");
    } catch {
      showToast("Couldn't upload that document. Please try again.", "error");
    } finally {
      setUploadingDocId(null);
    }
  };

  /**
   * Re-read documents and requests from the backend.
   *
   * This button said "Save Progress" and did nothing but wait 700ms and raise
   * "Progress saved locally" — there is no local draft to save; every upload is
   * already written the moment it is picked. What the screen genuinely needed
   * was the opposite: a way to pull in what *staff* have done since it loaded,
   * which is exactly the "I was verified but it still says pending" case.
   */
  const handleSaveProgress = async () => {
    setIsSavingProgress(true);
    try {
      await handleRefresh();
    } finally {
      setIsSavingProgress(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-9">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 mt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Left Section */}
          <div className="flex items-start gap-4">
            {/* Optional Back Button */}
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-sm font-medium transition-all duration-300"
              >
                Back
              </button>
            )}

            {/* Title and Subtitle */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                Documents
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Upload what your counsellor asks for, and open anything Ignition has filed for you.
              </p>
            </div>
          </div>

          {/* Right Section */}
          <div>
            <button
              onClick={handleSaveProgress}
              disabled={isSavingProgress}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-blue-600 transition-all duration-300 disabled:opacity-60"
            >
              <RefreshCw className={`w-5 h-5 ${isSavingProgress ? "animate-spin" : ""}`} />
              {isSavingProgress ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Decorative Separator */}
        <div className="mt-6 h-[1px] bg-gray-200"></div>

        {/* Additional Info */}
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-700 text-sm">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="font-medium">Tip:</span> Ensure your documents are
            in the correct format before uploading.
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            Need Help?{" "}
            <Link
              to="/appointments"
              className="text-blue-500 hover:underline hover:text-blue-600"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Document Progress
              </h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Approved documents</span>
                  <span className="text-blue-600 font-medium">{documentProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${documentProgress}%` }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {categories.map((category) => (
                  <div
                    key={category}
                    className="p-4 border border-gray-200 rounded-md hover:bg-gray-50 hover:shadow-sm transition-all duration-300"
                  >
                    <h4 className="text-sm font-medium text-gray-800 mb-3">
                      {DOCUMENT_TYPE_LABELS[category] ?? category}
                    </h4>
                    <ul className="space-y-2">
                      {documents
                        .filter((doc) => doc.category === category)
                        .map((doc) => (
                          <li
                            key={doc.id}
                            className="flex items-center justify-between gap-2 text-sm text-gray-600"
                          >
                            <span
                              className={`${
                                DONE_STATUSES.has(doc.status)
                                  ? "text-gray-800 font-medium"
                                  : "text-gray-600"
                              } hover:text-blue-600 transition-colors`}
                            >
                              {doc.title}
                            </span>
                            <StatusBadge status={doc.status} />
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div className="mt-6 bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Guidelines
              </h3>
              <ul className="space-y-3">
                {formOptions.documentGuidelines.map((guideline) => {
                  const Icon = GUIDELINE_ICONS[guideline.tone] ?? Info;
                  return (
                    <li
                      key={guideline.text}
                      className="flex items-start gap-3 text-sm text-gray-600 hover:bg-gray-50 p-2 rounded-md transition-all duration-300"
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          GUIDELINE_COLORS[guideline.tone] ?? "text-blue-500"
                        }`}
                      />
                      <span>{guideline.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {/* Requested documents — staff-initiated, across every application.

                Three groups, not one list. The old version filtered the list
                down to `pending`/`rejected` on arrival, so an item disappeared
                the instant it was uploaded: the student got no confirmation
                that what they sent had landed, and no sign of it being verified
                afterwards. Every requested item stays on screen and moves
                between groups as its status changes. */}
            {!isRequestedLoading && requestedItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900">Requested Documents</h2>
                  <p className="text-gray-600 mt-1">
                    {outstandingItems.length > 0
                      ? `${outstandingItems.length} still needed — upload them here.`
                      : "Nothing outstanding. Here is where each request got to."}
                  </p>
                </div>

                {outstandingItems.length > 0 && (
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {outstandingItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border border-orange-200 bg-orange-50 rounded-lg flex flex-col"
                      >
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <h3 className="font-medium text-gray-900">{item.label}</h3>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-xs text-gray-500 mb-3">For {item.applicationName}</p>
                        {item.notes && <p className="text-xs text-gray-600 mb-3">{item.notes}</p>}
                        <label htmlFor={`req-${item.id}`} className="relative cursor-pointer mt-auto">
                          <input
                            type="file"
                            id={`req-${item.id}`}
                            className="hidden"
                            onChange={(event) => handleUploadForRequestedItem(item, event)}
                          />
                          <div className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">
                              {uploadingItemId === item.id
                                ? "Uploading…"
                                : item.status === "rejected"
                                ? "Re-upload"
                                : "Choose File"}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}

                {(inFlightItems.length > 0 || settledItems.length > 0) && (
                  <div className="border-t border-gray-100 p-6 space-y-2">
                    {[...inFlightItems, ...settledItems].map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <CheckCircle2
                            className={`h-4 w-4 flex-shrink-0 ${
                              item.status === "verified" ? "text-green-500" : "text-gray-300"
                            }`}
                            aria-hidden
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">{item.label}</p>
                            <p className="truncate text-xs text-gray-500">
                              For {item.applicationName}
                              {item.status === "submitted" && " · with your counsellor"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {item.documentId && (
                            <button
                              type="button"
                              onClick={() => handleOpen({ id: item.documentId }, "inline")}
                              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-700 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden />
                              View
                            </button>
                          )}
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Document Upload Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    My Documents
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Everything you've uploaded, plus anything else you'd like to add
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={uploadType}
                    onChange={(event) => setUploadType(event.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Add a document…</option>
                    {/* `ISSUED_DOCUMENT_TYPES` are left out on purpose: an offer
                        letter and a CAS letter come from the university to
                        Ignition, and Ignition files them. Offering a student
                        the chance to upload their own invites a file nobody
                        can act on into the one place staff go to verify. */}
                    {Object.entries(DOCUMENT_TYPE_LABELS)
                      .filter(([value]) => !ISSUED_DOCUMENT_TYPES.includes(value))
                      .map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!uploadType || uploadingDocId === uploadType}
                    onClick={() => newUploadInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-60"
                  >
                    <Plus className="w-4 h-4" />
                    Upload
                  </button>
                  <input type="file" ref={newUploadInputRef} className="hidden" onChange={handleNewTypeUpload} />
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={FileText}
                    title="No documents yet"
                    description="Upload a document above, or wait for your counsellor to request one."
                  />
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:bg-gray-50 transition-all duration-300 flex flex-col"
                    >
                      <div className="mb-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{doc.title}</h3>
                          <StatusBadge status={doc.status} />
                        </div>
                        {doc.rejectionReason && doc.status === "rejected" && (
                          <p className="text-xs text-red-600 mb-1">{doc.rejectionReason}</p>
                        )}
                        {doc.file?.name && (
                          <p className="text-xs text-gray-500 mt-2 break-all">
                            {doc.file.name} · {formatFileSize(doc.file.sizeBytes)}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto">
                        {uploadingDocId === doc.documentType ? (
                          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg">
                            <Clock className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Uploading...</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* No delete.

                                There used to be an X here wired to
                                `removeDocument`, which has no endpoint behind
                                it — it set the row's status to `null` in local
                                state and the document came straight back on the
                                next page load, still on file, still visible to
                                staff. A control that appears to withdraw a
                                document from a review and does not is worse
                                than no control. Replace is the real action, and
                                it is right below. */}
                            <StateChip document={doc} />

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewId(doc.id)}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300"
                              >
                                <Eye className="w-4 h-4" />
                                Preview
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpen(doc, "attachment")}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                              {!doc.isFromIgnition && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => replaceInputRefs.current[doc.id]?.click()}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all duration-300"
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    Replace
                                  </button>
                                  <input
                                    type="file"
                                    className="hidden"
                                    ref={(element) => {
                                      replaceInputRefs.current[doc.id] = element;
                                    }}
                                    onChange={(event) => handleFileUpload(doc.documentType, event)}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <Link
                to="/applications"
                onClick={onNext}
                className="px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-blue-500 hover:bg-green-500 text-white transition-all duration-300"
              >
                Go to Applications
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {previewDocument?.file && (
        <PreviewModal document={previewDocument} onClose={() => setPreviewId(null)} onOpen={handleOpen} />
      )}
    </div>
  );
};

export default StudyAbroadPortal;
