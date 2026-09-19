import React from 'react';
import { BookOpen, Check, FileText } from 'lucide-react';

import logo from '../../assets/logo.png';

/**
 * The head of the initial-setup wizard: the mark, and where the student is.
 *
 * What it replaces was a card with a blue gradient tile, an `Application ID`
 * chip, a "Save Progress" button, and then — below all of that — two more
 * cards repeating the step names in blue/green/grey. Four separate elements
 * saying "step 1 of 2", and the largest, brightest thing on the screen was a
 * button that called nothing. (It had no handler; it has not been carried over.
 * Progress is committed when a step is completed, which is what the note under
 * the actions now says out loud.)
 *
 * The replacement states the progress once, as a rail: a filled node for a
 * finished step, a ringed node for the current one, a hairline node for what is
 * still ahead. `aria-current="step"` carries the same fact to a screen reader,
 * and the whole rail is an `<ol>`, because it is an ordered list of steps.
 */

const STEPS = [
  { id: 1, title: 'Academic history', icon: FileText },
  { id: 2, title: 'Course preferences', icon: BookOpen },
];

const ApplicationHeader = ({ currentStep, applicationId }) => {
  const total = STEPS.length;

  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <img src={logo} alt="Ignition" className="h-9 w-auto" />
        <p className="text-[13px] font-semibold text-ink-faint">
          Application ID{' '}
          <span className="font-bold text-ink-soft">{applicationId}</span>
        </p>
      </div>

      <p className="mt-9 text-[12.5px] font-bold uppercase tracking-[0.16em] text-navy-900">
        Step {currentStep} of {total}
      </p>
      <h1 className="mt-2 text-[clamp(1.9rem,3.2vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-navy-900">
        Set up your application
      </h1>
      <p className="mt-3 max-w-[60ch] text-[16.5px] font-medium leading-[1.6] text-ink-muted">
        Two short steps. What you enter here is the profile every university
        application reuses, so you only ever fill it in once.
      </p>

      {/* The rail. Two steps, so it stays horizontal at every width. */}
      <ol className="mt-8 flex items-center gap-3 sm:gap-5">
        {STEPS.map((step, index) => {
          const done = step.id < currentStep;
          const current = step.id === currentStep;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <li
                aria-current={current ? 'step' : undefined}
                className="flex min-w-0 items-center gap-3"
              >
                <span
                  aria-hidden
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    done
                      ? 'border-navy-900 bg-navy-900 text-white'
                      : current
                      ? 'border-orange bg-white text-orange'
                      : 'border-hairline bg-white text-ink-faint'
                  }`}
                >
                  {done ? (
                    <Check className="h-[18px] w-[18px]" strokeWidth={3} />
                  ) : (
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                    Step {step.id}
                  </span>
                  <span
                    className={`block truncate text-[15px] font-bold tracking-[-0.01em] ${
                      current || done ? 'text-navy-900' : 'text-ink-faint'
                    }`}
                  >
                    {step.title}
                  </span>
                </span>
              </li>

              {index < total - 1 ? (
                <li aria-hidden className="h-[2px] min-w-6 flex-1 rounded-full bg-hairline">
                  <span
                    className={`block h-full rounded-full bg-navy-900 transition-[width] duration-500 ${
                      done ? 'w-full' : 'w-0'
                    }`}
                  />
                </li>
              ) : null}
            </React.Fragment>
          );
        })}
      </ol>
    </header>
  );
};

export default ApplicationHeader;
