import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, MessageSquare, Video } from 'lucide-react';

import { PanelBody, PanelHead } from '../ui/kit';
import GlassPanel from './GlassPanel';
import { STATUS_LABELS } from '../common/StatusBadge';
import { formatDateTime } from '../../lib/simulate';

/**
 * The same `upcomingAppointments`/`handleAppointmentAction` the progress-grid
 * tile already uses, given the room to show the appointment rather than one
 * truncated line of it.
 */
const UpcomingAppointmentsCard = ({ nextAppointment, onAction, actionLabel }) => {
  const navigate = useNavigate();

  return (
    <GlassPanel>
      <PanelHead
        icon={Calendar}
        title="Upcoming appointments"
        actions={
          <Link
            to="/appointments"
            className="inline-flex items-center gap-1 text-[13.5px] font-bold text-blue-link transition-colors hover:text-navy-900"
          >
            View all
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <PanelBody>
        {!nextAppointment ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 text-navy-300">
              <Calendar className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-navy-900">No meetings scheduled</p>
              <p className="mt-1 text-[13px] font-medium text-ink-muted">
                Book a meeting with your counsellor or university representative.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="mt-1 inline-flex h-[42px] items-center justify-center gap-2 rounded-xl bg-navy-900 px-5 text-[14px] font-bold text-white transition-colors hover:bg-navy-ink"
            >
              Book a meeting
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5 text-[13.5px] font-medium text-ink-muted">
              <p className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                {formatDateTime(nextAppointment.scheduledAt)}
              </p>
              <p className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                {nextAppointment.counsellorName}
              </p>
              <p className="flex items-center gap-2">
                <Video className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
                {nextAppointment.meetingType} · {STATUS_LABELS[nextAppointment.status] ?? nextAppointment.status}
              </p>
            </div>
            <button
              type="button"
              onClick={onAction}
              className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-ring-idle bg-white text-[14px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </PanelBody>
    </GlassPanel>
  );
};

export default UpcomingAppointmentsCard;
