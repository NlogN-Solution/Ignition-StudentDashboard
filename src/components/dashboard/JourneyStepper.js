import React from 'react';
import { Check, Compass } from 'lucide-react';

import { Bone, Card, CardHeader } from './ui';

/**
 * Your journey — the backend's milestone ladder, drawn.
 *
 * Every step, its label, its order, whether it is done and which one is
 * current come from `/me/progress` via `useAppData().milestoneStatus`; nothing
 * here knows what the milestones are. A milestone added on the server shows up
 * here on the next load, with the server's label.
 *
 * No horizontal scroll. From `md` the steps share the card's width in equal
 * columns (`minmax(0, 1fr)`, so a long label wraps instead of widening its
 * column); below that they stack as a vertical list, which is how a phone
 * reads a sequence anyway.
 */

const stateOf = (milestone) =>
  milestone.completed ? 'done' : milestone.isCurrent ? 'current' : 'upcoming';

const STATE_LABEL = { done: 'Completed', current: 'In progress', upcoming: 'Not started' };

const Dot = ({ state, number }) => (
  <span
    aria-hidden
    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
      state === 'done'
        ? 'bg-emerald-600 text-white'
        : state === 'current'
        ? 'bg-navy-900 text-white ring-4 ring-navy-50'
        : 'border border-ring-idle bg-white text-ink-faint'
    }`}
  >
    {state === 'done' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : number}
  </span>
);

const JourneySkeleton = () => (
  <Card className="p-5 sm:p-6">
    <div className="flex items-center justify-between">
      <Bone className="h-5 w-32" />
      <Bone className="h-4 w-24" />
    </div>
    <div className="mt-6 hidden grid-cols-7 gap-2 md:grid">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center gap-2">
          <Bone className="h-7 w-7 rounded-full" />
          <Bone className="h-3 w-16" />
        </div>
      ))}
    </div>
    <div className="mt-5 space-y-3 md:hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <Bone key={index} className="h-7 w-2/3" />
      ))}
    </div>
  </Card>
);

const JourneyStepper = ({ milestoneStatus = [], overallProgress = 0, isLoading = false }) => {
  if (isLoading) return <JourneySkeleton />;
  // The ladder is empty only if the server has no active milestones at all.
  if (milestoneStatus.length === 0) return null;

  const completedCount = milestoneStatus.filter((m) => m.completed).length;
  const percent = Math.min(100, Math.max(0, overallProgress));

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        icon={Compass}
        title="Your journey"
        description="From profile to visa."
        action={
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium tabular-nums text-ink-muted">
              {completedCount} of {milestoneStatus.length}
            </span>
            <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-navy-50 sm:block">
              <span className="block h-full rounded-full bg-navy-900 transition-[width] duration-500" style={{ width: `${percent}%` }} />
            </span>
          </div>
        }
      />

      {/* md and up: equal columns across the card. */}
      <ol
        className="mt-6 hidden md:grid"
        style={{ gridTemplateColumns: `repeat(${milestoneStatus.length}, minmax(0, 1fr))` }}
      >
        {milestoneStatus.map((milestone, index) => {
          const state = stateOf(milestone);
          const last = index === milestoneStatus.length - 1;
          return (
            <li key={milestone.key} className="relative flex flex-col items-center px-1 text-center">
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-1/2 top-[13px] h-0.5 w-full ${milestone.completed ? 'bg-emerald-600' : 'bg-hairline'}`}
                />
              )}
              <Dot state={state} number={index + 1} />
              <p
                className={`mt-2 text-[13px] font-semibold leading-snug ${
                  state === 'upcoming' ? 'text-ink-muted' : 'text-navy-900'
                }`}
              >
                {milestone.label}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-faint">{STATE_LABEL[state]}</p>
            </li>
          );
        })}
      </ol>

      {/* Below md: a vertical list. */}
      <ol className="mt-5 md:hidden">
        {milestoneStatus.map((milestone, index) => {
          const state = stateOf(milestone);
          const last = index === milestoneStatus.length - 1;
          return (
            <li key={milestone.key} className="relative flex items-center gap-3 py-1.5">
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-[13px] top-[calc(50%+14px)] h-[calc(100%-16px)] w-0.5 ${
                    milestone.completed ? 'bg-emerald-600' : 'bg-hairline'
                  }`}
                />
              )}
              <Dot state={state} number={index + 1} />
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                <p className={`truncate text-[14px] font-semibold ${state === 'upcoming' ? 'text-ink-muted' : 'text-navy-900'}`}>
                  {milestone.label}
                </p>
                <p className="shrink-0 text-[12px] text-ink-faint">{STATE_LABEL[state]}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

export default JourneyStepper;
