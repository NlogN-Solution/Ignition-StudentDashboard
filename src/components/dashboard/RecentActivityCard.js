import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Building, ChevronRight, FileText, Rss, Video } from 'lucide-react';

import { PanelBody, PanelHead } from '../ui/kit';
import GlassPanel from './GlassPanel';
import { formatRelativeTime } from '../../lib/simulate';

const TYPE_ICON = {
  document: FileText,
  application: Building,
  appointment: Video,
  deadline: AlertCircle,
};

/**
 * `activityFeed` full-fat, rather than the three-line blurb the "Recent
 * updates" tile in the progress grid truncates it to.
 */
const RecentActivityCard = ({ activityFeed = [] }) => {
  const entries = activityFeed.slice(0, 4);

  return (
    <GlassPanel>
      <PanelHead
        icon={Rss}
        title="Recent activity"
        actions={
          <Link
            to="/notifications"
            className="inline-flex items-center gap-1 text-[13.5px] font-bold text-blue-link transition-colors hover:text-navy-900"
          >
            View all
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />
      <PanelBody>
        {entries.length === 0 ? (
          <p className="text-[14px] font-medium text-ink-muted">Nothing has happened yet.</p>
        ) : (
          <ul className="space-y-4">
            {entries.map((entry) => {
              const Icon = TYPE_ICON[entry.type] ?? AlertCircle;
              return (
                <li key={entry.id} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold leading-[1.4] text-navy-900">{entry.message}</p>
                    <p className="mt-0.5 text-[12.5px] font-medium text-ink-faint">
                      {formatRelativeTime(entry.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>
    </GlassPanel>
  );
};

export default RecentActivityCard;
