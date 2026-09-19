import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Upload, Zap } from 'lucide-react';

import { formatDeadline } from '../../lib/simulate';

/**
 * The one thing on this page the student has to do, full stop.
 *
 * This used to be two cards: "N documents needed" (whatever a counsellor is
 * waiting on) sitting above a separate "Your next step" checklist hero. Both
 * were framed as *the* most urgent thing on the dashboard, which is a
 * contradiction a student has to resolve themselves. A requested document
 * outranks a checklist task — it's something a person is actively waiting on,
 * not a self-paced to-do — so it takes the hero whenever one is outstanding;
 * the checklist task only surfaces here once there's nothing owed.
 *
 * The sideways gradient behind the copy is a one-off experiment (asked for by
 * name, not a new design-system colour) — an actual photo like the reference
 * mockup's would need a licensed asset this project doesn't have, so this is
 * a CSS mesh gradient standing in for "image" instead.
 */
const NextStepHero = ({
  documentItem,
  documentCount = 0,
  documentProgress = 0,
  isUploadingDocument = false,
  onUploadDocument,
  task,
  taskProgress = 0,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  if (!documentItem && !task) return null;

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onUploadDocument?.(file);
  };

  const progress = documentItem ? documentProgress : taskProgress;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-card sm:p-8"
      style={{
        backgroundImage:
          'linear-gradient(100deg, #0B1345 0%, #1071f6 42%, #7c3aed 68%, #FF5A1F 100%)',
      }}
    >
      {/* Frosted glass scrim so copy stays legible over the vibrant gradient,
          without flattening it to a solid colour. */}
      <div className="pointer-events-none absolute inset-0 bg-navy-950/25 backdrop-blur-[2px]" />

      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[12.5px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-md">
          <Zap className="h-3.5 w-3.5" aria-hidden />
          Your next step
        </span>

        {documentItem ? (
          <>
            <h2 className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[30px]">
              {documentItem.label}
            </h2>
            <p className="mt-2 max-w-[60ch] text-[15px] font-medium leading-[1.6] text-white/80">
              Requested for {documentItem.applicationName}
              {documentItem.status === 'rejected' ? ' — needs replacing' : ''}
              {documentItem.notes ? ` · ${documentItem.notes}` : ''}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-4 text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[30px]">
              {task.title}
            </h2>
            {task.description && (
              <p className="mt-2 max-w-[60ch] text-[15px] font-medium leading-[1.6] text-white/80">
                {task.description}
              </p>
            )}
          </>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="h-1.5 w-full max-w-[280px] overflow-hidden rounded-full border border-white/20 bg-white/15 backdrop-blur-md">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          {documentItem ? (
            documentCount > 1 && (
              <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[12.5px] font-bold text-white backdrop-blur-md">
                +{documentCount - 1} more needed
              </span>
            )
          ) : (
            task.dueDate && (
              <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[12.5px] font-bold text-white backdrop-blur-md">
                {formatDeadline(task.dueDate)}
              </span>
            )
          )}
        </div>

        {documentItem ? (
          <>
            <button
              type="button"
              disabled={isUploadingDocument}
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-white px-6 text-[14.5px] font-bold text-navy-900 transition-colors hover:bg-navy-50 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" aria-hidden />
              {isUploadingDocument ? 'Uploading…' : documentItem.status === 'rejected' ? 'Re-upload' : 'Upload'}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} />
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="mt-6 inline-flex h-[46px] items-center justify-center gap-2 rounded-xl bg-white px-6 text-[14.5px] font-bold text-navy-900 transition-colors hover:bg-navy-50"
          >
            Complete task
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
};

export default NextStepHero;
