import React from 'react';
import { Check, Compass } from 'lucide-react';

import { PanelBody, PanelHead } from '../ui/kit';
import GlassPanel from './GlassPanel';

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * The macro journey — profile through departure — as a horizontal stepper.
 *
 * `milestoneStatus` and `overallProgress` already exist on `useAppData()`
 * (backed by the seeded `progressMilestones` ladder merged with real
 * `/me/progress` completion flags); nothing here recomputes stage order or
 * completion, it only draws what the backend already decided.
 */
const JourneyStepper = ({ milestoneStatus = [], overallProgress = 0 }) => {
  if (milestoneStatus.length === 0) return null;

  const completedCount = milestoneStatus.filter((m) => m.completed).length;
  const firstIncompleteIndex = milestoneStatus.findIndex((m) => !m.completed);

  return (
    <GlassPanel>
      <PanelHead
        icon={Compass}
        title="Your journey"
        description="Track your progress from profile to visa."
        actions={
          <div className="text-right">
            <p className="text-[13px] font-bold text-ink-muted">
              {completedCount} of {milestoneStatus.length} completed
            </p>
            <div className="mt-1.5 h-1.5 w-32 overflow-hidden rounded-full bg-navy-50">
              <div
                className="h-full rounded-full bg-blue-link transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
              />
            </div>
          </div>
        }
      />
      <PanelBody>
        <div className="flex items-start overflow-x-auto pb-1">
          {milestoneStatus.map((milestone, index) => {
            const isCompleted = milestone.completed;
            const isCurrent = !isCompleted && index === firstIncompleteIndex;
            const status = isCompleted ? 'Completed' : isCurrent ? 'In progress' : 'Not started';

            return (
              <React.Fragment key={milestone.key}>
                {index > 0 && (
                  <div
                    className={`mt-[15px] h-0.5 min-w-[24px] flex-1 ${
                      index <= firstIncompleteIndex || firstIncompleteIndex === -1 ? 'bg-emerald-500' : 'bg-hairline'
                    }`}
                    aria-hidden
                  />
                )}
                <div className="flex shrink-0 flex-col items-center text-center" style={{ width: 96 }}>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-link text-white'
                        : 'bg-navy-50 text-ink-faint'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" aria-hidden /> : milestone.order}
                  </span>
                  <p className="mt-2 text-[13.5px] font-bold text-navy-900">{capitalize(milestone.key)}</p>
                  <p className="text-[12px] font-medium text-ink-muted">{status}</p>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </PanelBody>
    </GlassPanel>
  );
};

export default JourneyStepper;
