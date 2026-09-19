import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ChevronRight,
  Calendar,
  AlertCircle,
  Bell,
  Clock,
  ArrowUpRight,
  FileText,
  Building,
  Video,
} from 'lucide-react';
import CustomIcons from '../../components/icons/CustomIcons';

import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';
import ResearchCard from '../../components/dashboard/ResearchCard';
import OffersPanel from '../../components/dashboard/OffersPanel';
import NextStepHero from '../../components/dashboard/NextStepHero';
import JourneyStepper from '../../components/dashboard/JourneyStepper';
import RecentActivityCard from '../../components/dashboard/RecentActivityCard';
import UpcomingAppointmentsCard from '../../components/dashboard/UpcomingAppointmentsCard';
import QuickLinksCard from '../../components/dashboard/QuickLinksCard';
import CelebrationModal from '../../components/milestones/CelebrationModal';
import { getUnseenMilestones, markMilestoneSeen } from '../../api/access';
import { PanelBody, PanelHead } from '../../components/ui/kit';
import GlassPanel from '../../components/dashboard/GlassPanel';
import { STATUS_LABELS } from '../../components/common/StatusBadge';
import { OFFER_STATUSES } from '../../lib/applicationStatus';
import {
  formatDeadline,
  formatDateTime,
  formatRelativeTime,
} from '../../lib/simulate';
import { useRequestedDocuments } from '../../hooks/useRequestedDocuments';

/**
 * The dashboard, redrawn.
 *
 * Nothing here says anything it did not say before — the same four tiles, the
 * same counts, the same three priority tasks, the same buttons going to the
 * same places. What changed is everything about how it looks:
 *
 *   - It is on `canvas` with hairline-bordered white panels, like the rest of
 *     the portal, instead of `bg-gray-50` with `shadow-md` boxes.
 *   - The greeting is a heading on the ground rather than a card. A card is a
 *     container for things you can act on; "Hi, Kabin!" is not one of those,
 *     and giving it the same white box as the tasks below it said it was.
 *   - The accent colours are Ignition's. The tiles were material blue, green,
 *     amber and purple — four unrelated hues borrowed from a different design
 *     system, carried in hex literals passed to `CustomIcons`.
 *   - The hover choreography is quieter. Tiles lifted 5px, icons rotated a full
 *     turn, tasks slid sideways; four of those firing across one grid is noise.
 *     What is left is a border that warms and a shadow that deepens.
 */

/**
 * Each tile's accent, as tokens rather than hex.
 *
 * `CustomIcons` takes a colour prop and paints an SVG with it, so the value has
 * to be a literal here — these are the resolved Ignition palette entries
 * (tailwind.config.js), kept beside the Tailwind classes that tint the tile
 * behind them so the two cannot drift apart unnoticed.
 */
const ACCENTS = {
  navy: { hex: '#0B1345', tile: 'bg-navy-50', mark: 'text-navy-700' },
  blue: { hex: '#1071f6', tile: 'bg-blue-bright/10', mark: 'text-blue-bright' },
  orange: { hex: '#fc5a07', tile: 'bg-ignite-50', mark: 'text-ignite-600' },
  link: { hex: '#2450dc', tile: 'bg-blue-link/10', mark: 'text-blue-link' },
};

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
    taskProgress,
    documentProgress,
  } = useAppData();
  const { outstanding: outstandingDocuments, uploadingItemId, fulfil: fulfilDocument } = useRequestedDocuments();

  /**
   * Good news the student has not been shown yet.
   *
   * One at a time, oldest first: a student returning after a fortnight should
   * see the offer, acknowledge it, and *then* see the CAS that followed — which
   * is the order it happened in. Stacking two modals, or merging them into one
   * "2 updates" card, would flatten the best moment in the product into a
   * notification.
   */
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getUnseenMilestones().then((next) => {
      if (!cancelled) setMilestones(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const celebrate = milestones[0] ?? null;

  const acknowledge = async () => {
    if (!celebrate) return;
    // Optimistic: the modal closes on the click, not on the round trip. A
    // celebration that hangs for 300ms after "Later" feels broken.
    setMilestones((current) => current.slice(1));
    await markMilestoneSeen(celebrate.id);
  };

  // `requested` alongside `draft`: neither has been handed to anyone. An
  // application the student opened from a course page and that no counsellor
  // has accepted is not a submission, and counting it as one told them they
  // had done something they had not.
  const submittedApplications = applications.filter(
    (app) => app.status !== 'draft' && app.status !== 'requested'
  );

  /**
   * Applications that have an offer.
   *
   * This read `app.status === 'offer'`, and `offer` is not an
   * `ApplicationStatus` — it was a value from the JSON fixtures the portal used
   * before it had a backend. So the tile counted zero however many offers a
   * student actually held, and a counsellor recording one on the staff console
   * changed nothing the student could see. The real values come from
   * `lib/applicationStatus`, which is also what the Applications list filters
   * on — so this count and the list the tile opens are the same set.
   */
  const offers = applications.filter((app) => OFFER_STATUSES.includes(app.status));
  const nextAppointment = upcomingAppointments[0] ?? null;
  const latestUpdate = activityFeed[0] ?? null;

  // Priority tasks are the next unlocked, incomplete milestones by due date.
  const priorityTasks = tasks
    .filter((task) => !task.completed && isTaskUnlocked(task))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 3);

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

  const handleAppointmentAction = () => {
    if (!nextAppointment) {
      navigate('/appointments');
      return;
    }
    if (nextAppointment.mode === 'Video call') {
      // No real meeting link exists in this static build.
      showToast(
        `Meeting link for ${nextAppointment.meetingType} will be shared 15 minutes before the call.`,
        'info'
      );
      return;
    }
    navigate('/appointments');
  };

  const applicationStages = [
    {
      key: 'applications',
      label: 'Applications submitted',
      count: submittedApplications.length,
      lines: submittedApplications.slice(0, 2).map((app) => ({
        icon: <Building className="h-3.5 w-3.5" />,
        text: app.universityName,
      })),
      accent: ACCENTS.blue,
      iconType: 'application',
      secondaryIcon: <Building className="h-4 w-4" />,
      actionIcon: <FileText className="h-4 w-4" />,
      buttonText: 'View Applications',
      onAction: () => navigate('/applications'),
      stats: `Target: ${applications.length} universities`,
    },
    {
      key: 'offers',
      label: 'Offers received',
      count: offers.length,
      lines: offers.slice(0, 2).map((app) => ({
        icon: <Building className="h-3.5 w-3.5" />,
        text: app.universityName,
      })),
      accent: ACCENTS.navy,
      iconType: 'offerReceived',
      secondaryIcon: <ArrowUpRight className="h-4 w-4" />,
      actionIcon: <MessageSquare className="h-4 w-4" />,
      buttonText: 'View Offers',
      onAction: () => navigate('/applications?status=offer'),
      stats: submittedApplications.length
        ? `Acceptance rate: ${Math.round((offers.length / submittedApplications.length) * 100)}%`
        : 'No applications submitted yet',
    },
    {
      // Replaces the former "Pending documents" card. Documents already have
      // their own screen, their own nav entry and a priority task when one is
      // outstanding, so this tile was the fourth place the same number
      // appeared. What the grid had nowhere for was the answer to "has
      // anything happened since I last looked", which is the question a
      // student actually opens the dashboard with.
      key: 'updates',
      label: 'Recent updates',
      count: activityFeed.length,
      lines: activityFeed.slice(0, 3).map((entry) => ({
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        text: entry.message,
      })),
      accent: ACCENTS.orange,
      iconType: 'application',
      secondaryIcon: <Clock className="h-4 w-4" />,
      actionIcon: <Bell className="h-4 w-4" />,
      buttonText: 'View Notifications',
      onAction: () => navigate('/notifications'),
      stats: latestUpdate
        ? `Last activity ${formatRelativeTime(latestUpdate.createdAt)}`
        : 'Nothing has happened yet',
    },
    {
      // Replaces the former "Visa applications" card.
      key: 'appointments',
      label: 'Upcoming appointments',
      count: upcomingAppointments.length,
      lines: nextAppointment
        ? [
            { icon: <Calendar className="h-3.5 w-3.5" />, text: formatDateTime(nextAppointment.scheduledAt) },
            { icon: <MessageSquare className="h-3.5 w-3.5" />, text: nextAppointment.counsellorName },
            { icon: <Video className="h-3.5 w-3.5" />, text: nextAppointment.meetingType },
          ]
        : [],
      accent: ACCENTS.link,
      iconType: 'application',
      secondaryIcon: <Calendar className="h-4 w-4" />,
      actionIcon: <Video className="h-4 w-4" />,
      buttonText: nextAppointment?.mode === 'Video call' ? 'Join Meeting' : 'View Details',
      onAction: handleAppointmentAction,
      stats: nextAppointment
        ? `Status: ${STATUS_LABELS[nextAppointment.status] ?? nextAppointment.status}`
        : 'No meetings scheduled',
    },
  ];

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' },
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Glassmorphism only reads as glass with colour behind it to blur —
          this wash exists purely so the panels below have something to show
          through. Dashboard-only experiment, not a site-wide background. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-blue-bright/25 blur-[110px]" />
        <div className="absolute top-40 right-[-140px] h-[460px] w-[460px] rounded-full bg-ignite-400/20 blur-[120px]" />
        <div className="absolute bottom-[-160px] left-1/3 h-[420px] w-[420px] rounded-full bg-purple-400/20 blur-[120px]" />
      </div>

      <motion.div
        className="relative mx-auto max-w-[1400px] px-5 py-8 sm:px-8 sm:py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
      {celebrate ? (
        <CelebrationModal
          milestone={celebrate}
          studentName={user?.fullName?.split(' ')[0]}
          onDismiss={acknowledge}
        />
      ) : null}

      {/* ------------------------------------------------------- greeting --- */}
      <motion.header {...fadeIn}>
        <h1 className="text-[clamp(1.9rem,3.2vw,2.5rem)] font-extrabold leading-[1.1] tracking-[-0.025em] text-navy-900">
          Hi, {user?.fullName}!
        </h1>
        <p className="mt-2.5 text-[17px] font-medium leading-[1.55] text-ink-muted">
          Welcome back, Ignite your Study Abroad Journey !!
        </p>
      </motion.header>

      <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {/* The one thing the student has to do, ahead of everything else on
            the page — a requested document if anything's outstanding,
            otherwise the next checklist task. Renders nothing when there's
            neither. */}
        <motion.div {...fadeIn}>
          <NextStepHero
            documentItem={nextDocument}
            documentCount={outstandingDocuments.length}
            documentProgress={documentProgress}
            isUploadingDocument={Boolean(nextDocument) && uploadingItemId === nextDocument.id}
            onUploadDocument={handleHeroDocumentUpload}
            task={priorityTasks[0] ?? null}
            taskProgress={taskProgress}
          />
        </motion.div>

        {/* Everything the student explored on the public Ignition site, before
            they had an account. Renders nothing when there is none. */}
        <ResearchCard research={user?.preferences?.research} />

        {/* The offers themselves, with the letters behind them.

            Above the progress grid, not below it: an offer is the single most
            important thing that can have happened since the student last
            looked, and the tile that counts them is a count. This is the
            answer to the question pressing that tile asks. Renders nothing
            when there are no offers. */}
        {offers.length > 0 && (
          <motion.div {...fadeIn}>
            <OffersPanel offers={offers} onError={(message) => showToast(message, 'error')} />
          </motion.div>
        )}

        {/* ------------------------------------------- application progress --- */}
        <motion.div {...fadeIn}>
          <GlassPanel>
            <PanelHead
              title="Application progress"
              actions={
                <Link
                  to="/applications"
                  className="inline-flex items-center gap-1 text-[14.5px] font-bold text-blue-link transition-colors hover:text-navy-900"
                >
                  View details
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              }
            />
            <PanelBody data-tour="dashboard-overview">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {applicationStages.map((stage, index) => (
                  <motion.div
                    key={stage.key}
                    className="flex flex-col justify-between rounded-xl border border-hairline bg-white p-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-ring-idle hover:shadow-lift"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span
                          aria-hidden
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stage.accent.tile}`}
                        >
                          <CustomIcons
                            iconType={stage.iconType}
                            size={24}
                            color={stage.accent.hex}
                          />
                        </span>
                        <span className="text-[32px] font-extrabold leading-none tabular-nums tracking-[-0.03em] text-navy-900">
                          {stage.count}
                        </span>
                      </div>

                      <p className="mt-4 flex items-center gap-2 text-[15px] font-bold tracking-[-0.01em] text-navy-900">
                        <span aria-hidden className={stage.accent.mark}>
                          {stage.secondaryIcon}
                        </span>
                        {stage.label}
                      </p>

                      {stage.lines.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {stage.lines.map((line, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-[13.5px] font-medium leading-[1.45] text-ink-muted"
                            >
                              <span aria-hidden className="mt-[2px] shrink-0 text-ink-faint">
                                {line.icon}
                              </span>
                              <span className="min-w-0">{line.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-3 text-[13px] font-semibold text-ink-faint">{stage.stats}</p>
                    </div>

                    <button
                      onClick={stage.onAction}
                      className="mt-5 inline-flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-ring-idle bg-white text-[14.5px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
                    >
                      <span aria-hidden>{stage.actionIcon}</span>
                      {stage.buttonText}
                    </button>
                  </motion.div>
                ))}
              </div>
            </PanelBody>
          </GlassPanel>
        </motion.div>

        {/* The macro journey — profile through departure — using the backend
            milestone ladder the progress grid's counts are already drawn
            from, just laid out as a stage tracker instead of a number. */}
        <motion.div {...fadeIn}>
          <JourneyStepper milestoneStatus={milestoneStatus} overallProgress={overallProgress} />
        </motion.div>

        {/* Priority Tasks. The condensed "Recent updates" tile above and the
            full activity feed in the sidebar both still exist; this is the
            action list, not the report. */}
        <motion.div {...fadeIn}>
          <GlassPanel>
            <PanelHead title="Priority tasks" />
            <PanelBody data-tour="dashboard-priority-tasks">
              {priorityTasks.length === 0 ? (
                <EmptyState
                  title="Nothing outstanding"
                  description="Every unlocked checklist task is complete. Nice work."
                />
              ) : (
                <ul className="space-y-3">
                  {priorityTasks.map((task, index) => (
                    <motion.li
                      key={task.id}
                      className="rounded-xl border border-hairline bg-canvas p-5 transition-colors hover:border-ring-idle"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06, duration: 0.3, ease: 'easeOut' }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="text-[16.5px] font-bold tracking-[-0.01em] text-navy-900">
                          {task.title}
                        </h3>
                        {/* The first task is the most urgent — the list is sorted
                            by due date — so it is the one that gets the warm
                            badge. The rest are simply "next". */}
                        <span
                          className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${
                            index === 0
                              ? 'bg-ignite-50 text-ignite-700'
                              : 'bg-navy-50 text-navy-700'
                          }`}
                        >
                          {formatDeadline(task.dueDate)}
                        </span>
                      </div>
                      <p className="mt-2 max-w-[80ch] text-[15px] font-medium leading-[1.6] text-ink-muted">
                        {task.description}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </GlassPanel>
        </motion.div>
      </div>

      <div className="space-y-6">
        <motion.div {...fadeIn}>
          <RecentActivityCard activityFeed={activityFeed} />
        </motion.div>
        <motion.div {...fadeIn}>
          <UpcomingAppointmentsCard
            nextAppointment={nextAppointment}
            onAction={handleAppointmentAction}
            actionLabel={nextAppointment?.mode === 'Video call' ? 'Join Meeting' : 'View Details'}
          />
        </motion.div>
        <motion.div {...fadeIn}>
          <QuickLinksCard />
        </motion.div>
      </div>
      </div>
      </motion.div>
    </div>
  );
};

export default StudentDashboard;
