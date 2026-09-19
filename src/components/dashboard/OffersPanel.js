import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Download, Eye, FileText, GraduationCap } from 'lucide-react';

import StatusBadge from '../common/StatusBadge';
import { Card, CardHeader, CardLink, buttonClass } from './ui';
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
  <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-white px-3.5 py-2.5">
    <div className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-900">
        <FileText className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-navy-900">
          {DOCUMENT_TYPE_LABELS[document.documentType] ?? document.title}
        </p>
        <p className="truncate text-[12px] text-ink-faint">
          {document.file?.name}
          {document.file?.uploadedAt ? ` · added ${formatDate(document.file.uploadedAt)}` : ''}
        </p>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => onOpen(document, 'inline')}
        className={buttonClass('secondary', 'sm')}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        View
      </button>
      <button
        type="button"
        onClick={() => onOpen(document, 'attachment')}
        className={buttonClass('secondary', 'sm')}
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
    <Card className="p-5 sm:p-6">
      <CardHeader
        icon={GraduationCap}
        title="Your offers"
        action={<CardLink to="/applications?status=offer">All offers</CardLink>}
      />
      <ul className="mt-5 space-y-3">
        {offers.map((application) => {
          const documents = (documentsByApplication[application.id] ?? []).filter((document) =>
            ISSUED_DOCUMENT_TYPES.includes(document.documentType)
          );
          return (
            <li key={application.id} className="rounded-xl border border-hairline bg-canvas p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">{application.universityName}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{application.courseName}</p>
                  {application.offerReceivedDate && (
                    <p className="mt-0.5 text-[12px] text-ink-faint">
                      Offer received {formatDate(application.offerReceivedDate)}
                    </p>
                  )}
                </div>
                <StatusBadge status={application.status} />
              </div>

              {documents.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {documents.map((document) => (
                    <DocumentRow key={document.id} document={document} onOpen={handleOpen} />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-[13px] text-ink-muted">
                  <Award className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                  Your counsellor is filing the letter — it will appear here once uploaded.
                </p>
              )}

              <Link
                to={`/applications/${application.id}`}
                className="mt-3 inline-block text-[13px] font-semibold text-navy-900 hover:text-navy-600"
              >
                Open application →
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

export default OffersPanel;
