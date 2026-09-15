import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Building, ChevronRight, Upload } from 'lucide-react';

import { Panel, PanelBody, PanelHead } from '../ui/kit';
import { useRequestedDocuments } from '../../hooks/useRequestedDocuments';

/**
 * What Ignition is waiting on, on the dashboard.
 *
 * A counsellor requesting a document raised a notification and nothing else:
 * the dashboard's Priority Tasks reads the *journey* checklist
 * (`/student/me/checklist` — get a passport, sit the IELTS), which is a
 * different table from the per-application document checklist a request lands
 * in. So the one thing a student was actively being asked for was the one thing
 * the screen they open first never mentioned, and they found out only by
 * opening Documents or scrolling their notifications.
 *
 * Uploading happens here rather than only linking through to Documents, because
 * "you owe us a transcript" and "here is my transcript" is one action and
 * putting a screen between them loses most of them.
 *
 * Renders nothing when nothing is outstanding.
 */
const RequestedDocumentsCard = ({ onResult }) => {
  const { outstanding, uploadingItemId, fulfil } = useRequestedDocuments();
  const inputRefs = useRef({});

  const handleFile = async (item, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = await fulfil(item, file);
    onResult?.(
      result.ok
        ? `${item.label} uploaded — your counsellor will review it.`
        : "Couldn't upload that document. Please try again.",
      result.ok ? 'success' : 'error'
    );
  };

  if (outstanding.length === 0) return null;

  return (
    <Panel>
      <PanelHead
        title={outstanding.length === 1 ? '1 document needed' : `${outstanding.length} documents needed`}
        description="Your counsellor asked for these. Upload one and it goes straight to them."
        actions={
          <Link
            to="/documents"
            className="inline-flex items-center gap-1 text-[14.5px] font-bold text-blue-link transition-colors hover:text-navy-900"
          >
            All documents
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <PanelBody>
        <ul className="space-y-3">
          {outstanding.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ignite-200 bg-ignite-50/60 p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-ignite-600"
                >
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold tracking-[-0.01em] text-navy-900">{item.label}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] font-medium text-ink-muted">
                    <Building className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                    {item.applicationName}
                    {item.status === 'rejected' && ' · needs replacing'}
                  </p>
                  {item.notes && <p className="mt-1 text-[13px] font-medium text-ink-muted">{item.notes}</p>}
                </div>
              </div>

              <button
                type="button"
                disabled={uploadingItemId === item.id}
                onClick={() => inputRefs.current[item.id]?.click()}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-ring-idle bg-white px-4 py-2 text-[14px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900 disabled:opacity-60"
              >
                <Upload className="h-4 w-4" aria-hidden />
                {uploadingItemId === item.id
                  ? 'Uploading…'
                  : item.status === 'rejected'
                  ? 'Re-upload'
                  : 'Upload'}
              </button>
              <input
                type="file"
                className="hidden"
                ref={(element) => {
                  inputRefs.current[item.id] = element;
                }}
                onChange={(event) => handleFile(item, event)}
              />
            </li>
          ))}
        </ul>
      </PanelBody>
    </Panel>
  );
};

export default RequestedDocumentsCard;
