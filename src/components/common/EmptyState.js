import React from "react";
import { Inbox } from "lucide-react";

/** Shared empty state so every list handles "nothing here yet" the same way. */
const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-12 border border-dashed border-navy-200 rounded-xl bg-navy-50/40">
    <div className="p-3 bg-white rounded-full shadow-sm mb-4">
      <Icon className="w-6 h-6 text-navy-400" />
    </div>
    <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
    {description && (
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
