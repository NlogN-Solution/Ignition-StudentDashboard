import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronRight, ListChecks, Send, Stamp } from 'lucide-react';

import { applicationPill } from '../../lib/applicationStatus';
import { Bone } from './ui';

/**
 * One stage of the four-stage summary: how many applications are at it right
 * now, the first few of them, and a way into the list.
 *
 * Deliberately compact. It shows at most `MAX_ROWS` applications — a name and
 * one status word each, truncated to a line — and a "+N more" that goes to the
 * filtered list, so a student with nine applications gets the same card height
 * as one with a single application. The detail lives on the list and the
 * application page, not here.
 */

const MAX_ROWS = 3;

const ICONS = { shortlisted: ListChecks, submitted: Send, offer: Award, cas: Stamp };

const EMPTY_COPY = {
  shortlisted: 'Nothing being prepared.',
  submitted: 'Nothing with a university yet.',
  offer: 'No offers yet.',
  cas: 'No CAS issued yet.',
};

export const ApplicationStageCardSkeleton = () => (
  <div className="flex h-full flex-col rounded-xl border border-hairline bg-white p-4">
    <div className="flex items-center justify-between">
      <Bone className="h-8 w-8 rounded-lg" />
      <Bone className="h-6 w-6" />
    </div>
    <Bone className="mt-3 h-4 w-32" />
    <Bone className="mt-3 h-3.5 w-full" />
    <Bone className="mt-2 h-3.5 w-4/5" />
    <span className="mt-auto pt-3"><Bone className="h-3.5 w-16" /></span>
  </div>
);

const ApplicationStageCard = ({ stage, applications, to }) => {
  const Icon = ICONS[stage.key] ?? ListChecks;
  const shown = applications.slice(0, MAX_ROWS);
  const hidden = applications.length - shown.length;
  const active = applications.length > 0;

  return (
    <Link
      to={to}
      className="group flex h-full min-h-[172px] flex-col rounded-xl border border-hairline bg-white p-4 transition-[border-color,box-shadow] duration-150 hover:border-ring-idle hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/30"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          aria-hidden
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            active ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-900'
          }`}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span
          className={`text-[24px] font-semibold leading-none tabular-nums tracking-[-0.02em] ${
            active ? 'text-navy-900' : 'text-ink-faint'
          }`}
        >
          {applications.length}
        </span>
      </div>

      <p className="mt-3 text-[14px] font-semibold text-navy-900">{stage.label}</p>

      {active ? (
        <ul className="mt-2 space-y-1">
          {shown.map((application) => (
            <li key={application.id} className="flex min-w-0 items-baseline justify-between gap-2 text-[12.5px]">
              <span className="truncate text-ink-soft">{application.universityName}</span>
              <span className="shrink-0 text-ink-faint">{applicationPill(application.status).label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12.5px] text-ink-faint">{EMPTY_COPY[stage.key]}</p>
      )}

      <span className="mt-auto inline-flex items-center gap-0.5 pt-3 text-[12.5px] font-semibold text-navy-900 group-hover:text-navy-600">
        {hidden > 0 ? `+${hidden} more` : 'View'}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  );
};

export default ApplicationStageCard;
