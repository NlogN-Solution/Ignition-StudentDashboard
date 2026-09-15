import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Building, ChevronRight, Download, Eye, FileText } from 'lucide-react';

import StatusBadge from '../common/StatusBadge';
import { Panel, PanelBody, PanelHead } from '../ui/kit';
import { getApplicationDocumentsApi, DOCUMENT_TYPE_LABELS, ISSUED_DOCUMENT_TYPES } from '../../api/studentPortal';
import { openDocumentFile } from '../../lib/documentFile';
import { formatDate } from '../../lib/simulate';

/**
 * The offers a student holds, and the letters behind them.
 *
 * The dashboard used to answer "have I had an offer?" with a number on a tile
 * and nothing else — and the number was wrong (see `OFFER_STATUSES`). Even once
 * it counted correctly, pressing the tile landed on the full applications list,
 * where the offer letter itself appeared nowhere at all: a counsellor uploading
 * one filed it against the student, and no student-facing screen read it back.
 *
 * This is where it is read back. One row per application with an offer, each
 * carrying the letters filed against it, each letter openable.
 *
 * It renders nothing when there are no offers. A dashboard that keeps an empty
 * "Offers" panel on screen is telling the student about an absence they already
 * know about.
 */

const DocumentRow = ({ document, onOpen }) => (
  <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-white px-4 py-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
        <FileText className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[14.5px] font-semibold text-navy-900">
          {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.title}
        </p>
        <p className="truncate text-[13px] font-medium text-ink-faint">
          {document.file?.name}
          {document.file?.uploadedAt ? ` · added ${formatDate(document.file.uploadedAt)}` : ''}
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(document, 'inline')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ring-idle bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        View
      </button>
      <button
        type="button"
        onClick={() => onOpen(document, 'attachment')}
        className="inline-flex items-center gap-1.5 rounded-lg border border-ring-idle bg-white px-3 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Download
      </button>
    </div>
  </li>
);

const OffersPanel = ({ offers, onError }) => {
  const [documentsByApplication, setDocumentsByApplication] = useState({});

  useEffect(() => {
    let cancelled = false;
    if (offers.length === 0) {
      setDocumentsByApplication({});
      return undefined;
    }
    Promise.all(
      offers.map((application) =>
        getApplicationDocumentsApi(application.id)
          .then((documents) => [application.id, documents])
          .catch(() => [application.id, []])
      )
    ).then((entries) => {
      if (!cancelled) setDocumentsByApplication(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
    // `offers` is derived fresh each render; the ids are what actually change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offers.map((application) => application.id).join(',')]);

  const handleOpen = async (document, disposition) => {
    const result = await openDocumentFile(document.id, { disposition });
    if (!result.ok) onError?.("Couldn't open that file. Please try again.");
  };

  if (offers.length === 0) return null;

  return (
    <Panel>
      <PanelHead
        title="Your offers"
        actions={
          <Link
            to="/applications?status=offer"
            className="inline-flex items-center gap-1 text-[14.5px] font-bold text-blue-link transition-colors hover:text-navy-900"
          >
            All offers
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <PanelBody>
        <ul className="space-y-4">
          {offers.map((application) => {
            const documents = (documentsByApplication[application.id] ?? []).filter((document) =>
              ISSUED_DOCUMENT_TYPES.includes(document.documentType)
            );
            return (
              <li key={application.id} className="rounded-xl border border-hairline bg-canvas p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[16.5px] font-bold tracking-[-0.01em] text-navy-900">
                      <Building className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                      {application.universityName}
                    </p>
                    <p className="mt-1 text-[14.5px] font-medium text-ink-muted">{application.courseName}</p>
                    {application.offerReceivedDate && (
                      <p className="mt-1 text-[13px] font-semibold text-ink-faint">
                        Offer received {formatDate(application.offerReceivedDate)}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={application.status} />
                </div>

                {documents.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {documents.map((document) => (
                      <DocumentRow key={document.id} document={document} onOpen={handleOpen} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 flex items-center gap-2 rounded-xl border border-hairline bg-white px-4 py-3 text-[13.5px] font-medium text-ink-muted">
                    <Award className="h-4 w-4 shrink-0 text-ignite-600" aria-hidden />
                    Your counsellor is filing the letter — it will appear here as soon as it is uploaded.
                  </p>
                )}

                <Link
                  to={`/applications/${application.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-[14px] font-bold text-blue-link transition-colors hover:text-navy-900"
                >
                  Open application
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </PanelBody>
    </Panel>
  );
};

export default OffersPanel;
