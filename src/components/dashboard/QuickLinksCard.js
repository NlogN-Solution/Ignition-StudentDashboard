import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Compass, FolderOpen, ListChecks, Plane } from 'lucide-react';

import { PanelBody, PanelHead } from '../ui/kit';
import GlassPanel from './GlassPanel';

// Application-agnostic, unlike `QuickLinksCard` on the Application Detail
// page (which links into a single university's profile/curriculum/etc).
const LINKS = [
  { label: 'Explore Universities', icon: Compass, to: '/explore' },
  { label: 'My Checklist', icon: ListChecks, to: '/tasks' },
  { label: 'Documents', icon: FolderOpen, to: '/documents' },
  { label: 'Visa & Departure', icon: Plane, to: '/visa' },
];

const QuickLinksCard = () => (
  <GlassPanel>
    <PanelHead title="Quick links" />
    <PanelBody>
      <ul>
        {LINKS.map(({ label, icon: Icon, to }) => (
          <li key={label}>
            <Link
              to={to}
              className="flex items-center gap-3 rounded-lg px-1 py-2.5 text-[14px] font-semibold text-ink-soft transition-colors hover:text-navy-900"
            >
              <Icon className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </PanelBody>
  </GlassPanel>
);

export default QuickLinksCard;
