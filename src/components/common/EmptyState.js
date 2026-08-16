import React from "react";
import { Inbox } from "lucide-react";

/** Shared empty state so every list handles "nothing here yet" the same way. */
const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-12 border border-dashed border-gray-200 rounded-lg bg-gray-50">
    <div className="p-3 bg-white rounded-full shadow-sm mb-4">
      <Icon className="w-6 h-6 text-gray-400" />
    </div>
    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    {description && (
      <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
