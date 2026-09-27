import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Upload, Zap } from 'lucide-react';

import { formatDeadline } from '../../lib/simulate';
import { buttonClass } from './ui';

/**
 * The one thing on this page the student has to do, full stop.
 *
 * A requested document outranks a checklist task — someone is actively waiting
 * on it, rather than it being a self-paced to-do — so it takes the card
 * whenever one is outstanding; the checklist task only surfaces here once
 * there's nothing owed.
 *
 * ## Why it always renders
 *
 * It used to return `null` until it had something to say. Its inputs arrive
 * last on the page — requested documents are read per application, so they
 * wait for the application list first — which meant the whole card appeared a
 * beat after everything else and shoved the page down when it did. Now the
 * card is always there at the same height: a skeleton while loading, then the
 * step, or "you're all caught up" when there is none. The layout never moves.
 *
 * Solid Ignition navy, not the navy→blue→violet→orange gradient it
 * had: that was four hues on one surface, and the card is important because
 * of what it says, not because it is the loudest thing on the page.
 */

const Shell = ({ children, label = 'Your next step' }) => (
  <section
    aria-label={label}
    className="relative overflow-hidden rounded-2xl bg-navy-900 p-6 text-white shadow-card sm:p-7"
  >
    {/* One soft highlight for depth — not a gradient wash. */}
    <span
      aria-hidden
      className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[0.06] blur-2xl"
    />
    <div className="relative flex min-h-[168px] flex-col">{children}</div>
  </section>
);

const Eyebrow = ({ icon: Icon = Zap, children = 'Your next step' }) => (
  <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80">
    <Icon className="h-3.5 w-3.5" aria-hidden />
    {children}
  </span>
);

const Meter = ({ value }) => (
  <div className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-white/15">
    <div
      className="h-full rounded-full bg-white transition-[width] duration-500"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

const Chip = ({ children }) => (
  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[12px] font-semibold text-white/90">{children}</span>
);

const Skeleton = () => (
  <Shell label="Loading your next step">
    <span aria-hidden className="block h-3 w-28 animate-pulse rounded bg-white/15" />
    <span aria-hidden className="mt-4 block h-7 w-2/3 max-w-[420px] animate-pulse rounded-md bg-white/15" />
    <span aria-hidden className="mt-3 block h-4 w-1/2 max-w-[360px] animate-pulse rounded bg-white/10" />
    <span aria-hidden className="mt-auto block h-10 w-36 animate-pulse rounded-xl bg-white/15" />
    <span className="sr-only">Loading your next step…</span>
  </Shell>
);

const NextStepHero = ({
  isLoading = false,
  documentItem,
  documentCount = 0,
  documentProgress = 0,
  isUploadingDocument = false,
  onUploadDocument,
  task,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  if (isLoading) return <Skeleton />;

  if (!documentItem && !task) {
    return (
      <Shell>
        <Eyebrow icon={CheckCircle2}>All caught up</Eyebrow>
        <h2 className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[24px]">
          Nothing needs you right now
        </h2>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-[1.6] text-white/75">
          No documents are outstanding and every unlocked task is done. We'll put the next step here the moment
          there is one.
        </p>
        <div className="mt-auto pt-5">
          <button type="button" onClick={() => navigate('/applications')} className={buttonClass('inverse')}>
            View applications
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </Shell>
    );
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onUploadDocument?.(file);
  };

  // Tasks have no meter: the checklist is whatever the advisor has set so far,
  // not a finite list, so "x% of tasks" would measure nothing.
  const title = documentItem ? documentItem.label : task.title;
  const body = documentItem
    ? `Requested for ${documentItem.applicationName}${documentItem.status === 'rejected' ? ' — needs replacing' : ''}${
        documentItem.notes ? ` · ${documentItem.notes}` : ''
      }`
    : task.description;
  const chip = documentItem
    ? documentCount > 1 && `+${documentCount - 1} more needed`
    : task.dueDate && formatDeadline(task.dueDate);

  return (
    <Shell>
      <Eyebrow />
      <h2 className="mt-3 line-clamp-2 text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[24px]">
        {title}
      </h2>
      {body && <p className="mt-2 line-clamp-2 max-w-[60ch] text-[14px] leading-[1.6] text-white/75">{body}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-4 pt-5">
        {documentItem ? (
          <>
            <button
              type="button"
              disabled={isUploadingDocument}
              onClick={() => fileInputRef.current?.click()}
              className={buttonClass('inverse')}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {isUploadingDocument ? 'Uploading…' : documentItem.status === 'rejected' ? 'Re-upload' : 'Upload'}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} />
          </>
        ) : (
          <button type="button" onClick={() => navigate('/tasks')} className={buttonClass('inverse')}>
            Complete task
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
        <div className="flex min-w-[180px] flex-1 items-center gap-3">
          {documentItem && <Meter value={documentProgress} />}
          {chip && <Chip>{chip}</Chip>}
        </div>
      </div>
    </Shell>
  );
};

export default NextStepHero;
