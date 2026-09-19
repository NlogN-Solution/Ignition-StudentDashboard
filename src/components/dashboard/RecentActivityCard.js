import React from 'react';
import { AlertCircle, Building, FileText, Rss, Video } from 'lucide-react';

import { formatRelativeTime } from '../../lib/simulate';
import { Bone, Card, CardHeader, CardLink } from './ui';

const TYPE_ICON = {
  document: FileText,
  application: Building,
  appointment: Video,
  deadline: AlertCircle,
};

/** The latest few things that happened, newest first. The full feed is one click away. */
const RecentActivityCard = ({ activityFeed = [], isLoading = false }) => {
  const entries = activityFeed.slice(0, 3);

  return (
    <Card className="p-5">
      <CardHeader icon={Rss} title="Recent activity" action={<CardLink to="/notifications">All</CardLink>} />
      {isLoading ? (
        <div className="mt-4 space-y-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="space-y-1.5">
              <Bone className="h-4 w-full" />
              <Bone className="h-3 w-16" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="mt-4 text-[13px] text-ink-muted">Nothing has happened yet.</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {entries.map((entry) => {
            const Icon = TYPE_ICON[entry.type] ?? AlertCircle;
            return (
              <li key={entry.id} className="flex items-start gap-2.5">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[13px] font-medium leading-5 text-navy-900">{entry.message}</p>
                  <p className="mt-0.5 text-[12px] text-ink-faint">{formatRelativeTime(entry.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default RecentActivityCard;
