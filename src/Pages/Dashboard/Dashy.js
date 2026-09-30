import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, Route } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import OffersPanel from '../../components/dashboard/OffersPanel';
import NextStepHero from '../../components/dashboard/NextStepHero';
import JourneyStepper from '../../components/dashboard/JourneyStepper';
import RecentActivityCard from '../../components/dashboard/RecentActivityCard';
import UpcomingAppointmentsCard from '../../components/dashboard/UpcomingAppointmentsCard';
import QuickLinksCard from '../../components/dashboard/QuickLinksCard';
import ApplicationStageCard, { ApplicationStageCardSkeleton } from '../../components/dashboard/ApplicationStageCard';
import { Bone, Card, CardHeader, CardLink } from '../../components/dashboard/ui';
import { OFFER_STATUSES, SUMMARY_STAGES, summaryStageOf } from '../../lib/applicationStatus';
import { formatDeadline } from '../../lib/simulate';
import { useRequestedDocuments } from '../../hooks/useRequestedDocuments';

/**
 * The student dashboard.
 *
 * ## Layout
 *
 * A main column and, from `xl`, a 320px rail. Below `xl` the rail's three
 * cards drop under the main column and sit two to a row on a tablet, so the
 * appointment card is never a full-width band on its own. Nothing here has a
 * fixed width wider than its column; the stage cards use
 * `repeat(auto-fit, minmax(190px, 1fr))`, which gives four across when there is
 * room, two on a laptop-width column and one on a phone, with no breakpoint
 * guessing and no horizontal scroll.
 *
 * ## Loading
 *
 * Every section is on the page from the first paint. Sections backed by the
 * provider's first load (`isReady`) or by the requested-documents fetch show a
 * skeleton the size of what replaces it, so nothing pops in and nothing moves.
 * There are no component-level fetches for the stage cards or the journey —
 * both read the provider's one parallel load.
 *
 * ## Style
 *
 * One surface (`components/dashboard/ui`), one primary colour (navy-900), one
 * heading scale. The coloured blur wash and frosted glass panels this page
 * used to have are gone.
 */

const DashboardHeader = ({ firstName }) => (
  <header>
    <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-navy-900 sm:text-[28px]">
      {firstName ? `Hi, ${firstName}` : 'Welcome back'}
    </h1>
    <p className="mt-1 text-[15px] text-ink-muted">Here's where your study abroad journey stands today.</p>
  </header>
);

const PriorityTasks = ({ tasks, isLoading }) => (
  <Card className="p-5 sm:p-6">
    <CardHeader icon={ListTodo} title="Priority tasks" action={<CardLink to="/tasks">All tasks</CardLink>} />
    {isLoading ? (
      <div className="mt-4 space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <Bone className="h-4 w-1/2" />
            <Bone className="h-3.5 w-4/5" />
          </div>
        ))}
      </div>
    ) : tasks.length === 0 ? (
      <p className="mt-4 text-[13px] text-ink-muted">Every unlocked checklist task is complete. Nice work.</p>
    ) : (
      <ul className="mt-2 divide-y divide-hairline">
        {tasks.map((task, index) => (
          <li key={task.id} className="flex items-start justify-between gap-4 py-3.5 last:pb-0">
            <div className="min-w-0">
              {task.isPriority && (
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ignite-600">
                  From your counsellor
                </p>
              )}
              <p className="text-[14px] font-semibold text-navy-900">{task.title}</p>
              {task.description && (
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-ink-muted">{task.description}</p>
              )}
            </div>
            {task.dueDate && (
              // The list is sorted by due date, so the first is the most
              // urgent — the one that gets the amber "needs you" tone.
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                  index === 0 ? 'bg-amber-50 text-amber-800' : 'bg-canvas text-ink-muted ring-1 ring-hairline'
                }`}
              >
                {formatDeadline(task.dueDate)}
              </span>
            )}
          </li>
        ))}
      </ul>
    )}
  </Card>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    applications,
    upcomingAppointments,
    activityFeed,
    tasks,
    isTaskUnlocked,
    milestoneStatus,
    overallProgress,
    documentProgress,
    isReady,
  } = useAppData();
  const {
    outstanding: outstandingDocuments,
    isLoading: isDocumentsLoading,
    uploadingItemId,
    fulfil: fulfilDocument,
  } = useRequestedDocuments();

  // Offer / CAS / visa celebrations are shown app-wide by `CelebrationHost`
  // (mounted in AppLayout), not here — a student returning to any page should
  // see them, not only one who lands on the dashboard.

  const offers = applications.filter((app) => OFFER_STATUSES.includes(app.status));
  const nextAppointment = upcomingAppointments[0] ?? null;

  // Applications grouped by the summary stage they are at now — the same
  // grouping the Applications list's chips use, so each card's count is the
  // list it opens.
  const byStage = useMemo(
    () => SUMMARY_STAGES.map((_, index) => applications.filter((app) => summaryStageOf(app.status) === index)),
    [applications]
  );

  // Priority tasks: what the student's counsellor set first (soonest
  // due first), then the next unlocked checklist tasks to fill the remaining
  // slots. The counsellor's list is the point of the panel; the checklist is
  // what it falls back to when there is nothing set.
  const byDueDate = (a, b) =>
    (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);
  const openTasks = tasks.filter((task) => !task.completed && isTaskUnlocked(task));
  const priorityTasks = [
    ...openTasks.filter((task) => task.isPriority).sort(byDueDate),
    ...openTasks.filter((task) => !task.isPriority).sort(byDueDate),
  ].slice(0, 3);

  // A requested document outranks a checklist task in the hero: someone is
  // actively waiting on it, rather than it being a self-paced to-do.
  const nextDocument = outstandingDocuments[0] ?? null;

  const handleHeroDocumentUpload = async (file) => {
    if (!nextDocument) return;
    const result = await fulfilDocument(nextDocument, file);
    showToast(
      result.ok
        ? `${nextDocument.label} uploaded — your counsellor will review it.`
        : "Couldn't upload that document. Please try again.",
      result.ok ? 'success' : 'error'
    );
  };

  const isVideoCall = nextAppointment?.mode === 'Video call';

  const handleAppointmentAction = () => {
    if (isVideoCall && nextAppointment.meetingLink) {
      window.open(nextAppointment.meetingLink, '_blank', 'noopener,noreferrer');
      return;
    }
    if (isVideoCall) {
      showToast('Your meeting link will be shared 15 minutes before the call.', 'info');
      return;
    }
    navigate('/appointments');
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <DashboardHeader firstName={user?.fullName?.split(' ')[0]} />

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* ------------------------------------------------------ main --- */}
          <div className="min-w-0 space-y-6">
            <NextStepHero
              isLoading={!isReady || isDocumentsLoading}
              documentItem={nextDocument}
              documentCount={outstandingDocuments.length}
              documentProgress={documentProgress}
              isUploadingDocument={Boolean(nextDocument) && uploadingItemId === nextDocument.id}
              onUploadDocument={handleHeroDocumentUpload}
              task={priorityTasks[0] ?? null}
            />

            {/* The offers themselves, with the letters behind them. */}
            {offers.length > 0 && (
              <OffersPanel offers={offers} onError={(message) => showToast(message, 'error')} />
            )}

            {/* --------------------------------------- application progress --- */}
            <Card className="p-5 sm:p-6" data-tour="dashboard-overview">
              <CardHeader
                icon={Route}
                title="Application progress"
                description="Where each of your applications is right now."
                action={<CardLink to="/applications">All applications</CardLink>}
              />
              <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
                {SUMMARY_STAGES.map((stage, index) =>
                  isReady ? (
                    <ApplicationStageCard
                      key={stage.key}
                      stage={stage}
                      applications={byStage[index]}
                      to={`/applications?status=${stage.key}`}
                    />
                  ) : (
                    <ApplicationStageCardSkeleton key={stage.key} />
                  )
                )}
              </div>
            </Card>

            <JourneyStepper
              isLoading={!isReady}
              milestoneStatus={milestoneStatus}
              overallProgress={overallProgress}
            />

            <div data-tour="dashboard-priority-tasks">
              <PriorityTasks tasks={priorityTasks} isLoading={!isReady} />
            </div>
          </div>

          {/* ------------------------------------------------------ rail --- */}
          <aside className="grid grid-cols-1 content-start gap-6 md:grid-cols-2 xl:grid-cols-1">
            <UpcomingAppointmentsCard
              isLoading={!isReady}
              nextAppointment={nextAppointment}
              onAction={handleAppointmentAction}
              actionLabel={isVideoCall ? 'Join meeting' : 'View details'}
            />
            <RecentActivityCard isLoading={!isReady} activityFeed={activityFeed} />
            <div className="md:col-span-2 xl:col-span-1">
              <QuickLinksCard />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
