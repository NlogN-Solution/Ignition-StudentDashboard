import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Compass, FolderOpen, ListChecks, Plane } from 'lucide-react';

import { Card, CardHeader } from './ui';

// Application-agnostic, unlike the Quick Links bar on the Application Detail
// page (which links into a single university's profile/curriculum/etc).
const LINKS = [
  { label: 'Explore universities', icon: Compass, to: '/explore' },
  { label: 'My checklist', icon: ListChecks, to: '/tasks' },
  { label: 'Documents', icon: FolderOpen, to: '/documents' },
  { label: 'Visa & departure', icon: Plane, to: '/visa' },
];

const QuickLinksCard = () => (
  <Card className="p-5">
    <CardHeader title="Quick links" />
    <ul className="-mx-2 mt-2">
      {LINKS.map(({ label, icon: Icon, to }) => (
        <li key={label}>
          <Link
            to={to}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-canvas hover:text-navy-900"
          >
            <Icon className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  </Card>
);

export default QuickLinksCard;
