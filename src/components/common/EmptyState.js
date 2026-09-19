import React from "react";
import { Inbox } from "lucide-react";

/** Shared empty state so every list handles "nothing here yet" the same way. */
const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ring-idle bg-canvas px-6 py-12 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-card">
      <Icon className="h-[22px] w-[22px] text-ink-faint" aria-hidden />
    </div>
    <h3 className="text-[16px] font-bold tracking-[-0.01em] text-navy-900">{title}</h3>
    {description && (
      <p className="mt-1.5 max-w-sm text-[14.5px] font-medium leading-[1.55] text-ink-muted">
        {description}
      </p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
