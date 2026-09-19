import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, UserRound, Video } from 'lucide-react';

import { STATUS_LABELS } from '../common/StatusBadge';
import { Bone, Card, CardHeader, CardLink, buttonClass } from './ui';

/**
 * The next appointment, and only what it takes to turn up to it: who, when,
 * what kind, and one action. It sits in the dashboard's side rail, so it is
 * the rail's width on desktop and shares a row with Recent activity on a
 * tablet — never a full-width band of its own.
 */

// `appointment_type` arrives as the enum value ("visa_guidance").
const typeLabel = (value) =>
  value ? value.replace(/_/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase()) : 'Appointment';

const dayOf = (value) =>
  new Date(value).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const timeOf = (value) => new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** The date as a calendar leaf: the one thing you glance at. */
const DateLeaf = ({ value }) => {
  const when = value ? new Date(value) : null;
  return (
    <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-hairline bg-canvas">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        {when ? when.toLocaleDateString('en-GB', { month: 'short' }) : 'TBC'}
      </span>
      <span className="text-[17px] font-semibold leading-none text-navy-900">{when ? when.getDate() : '–'}</span>
    </span>
  );
};

const Row = ({ icon: Icon, children }) => (
  <p className="flex min-w-0 items-center gap-2.5 text-[13px] text-ink-soft">
    <Icon className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
    <span className="truncate">{children}</span>
  </p>
);

const UpcomingAppointmentsCard = ({ nextAppointment, onAction, actionLabel, isLoading = false }) => {
  const navigate = useNavigate();

  return (
    <Card className="p-5">
      <CardHeader icon={Calendar} title="Next appointment" action={<CardLink to="/appointments">All</CardLink>} />

      {isLoading ? (
        <div className="mt-4 space-y-2.5">
          <Bone className="h-4 w-3/4" />
          <Bone className="h-4 w-1/2" />
          <Bone className="h-4 w-2/3" />
          <Bone className="mt-4 h-9 w-full rounded-xl" />
        </div>
      ) : !nextAppointment ? (
        <div className="mt-4">
          <p className="text-[13px] leading-5 text-ink-muted">Nothing booked. Talk to your counsellor whenever you need to.</p>
          <button type="button" onClick={() => navigate('/appointments')} className={`mt-4 w-full ${buttonClass('secondary', 'sm')}`}>
            Book a meeting
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <DateLeaf value={nextAppointment.scheduledAt} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-navy-900">
                {typeLabel(nextAppointment.meetingType)}
              </p>
              <p className="text-[12px] text-ink-muted">
                {STATUS_LABELS[nextAppointment.status] ?? nextAppointment.status}
              </p>
            </div>
          </div>
          <div className="mt-3.5 space-y-2">
            {nextAppointment.counsellorName && <Row icon={UserRound}>{nextAppointment.counsellorName}</Row>}
            <Row icon={Clock}>
              {nextAppointment.scheduledAt
                ? `${dayOf(nextAppointment.scheduledAt)} · ${timeOf(nextAppointment.scheduledAt)}`
                : 'Time to be confirmed'}
            </Row>
            {nextAppointment.mode && <Row icon={Video}>{nextAppointment.mode}</Row>}
          </div>
          <button type="button" onClick={onAction} className={`mt-4 w-full ${buttonClass('primary', 'sm')}`}>
            {actionLabel}
          </button>
        </div>
      )}
    </Card>
  );
};

export default UpcomingAppointmentsCard;
