import React, { useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Bot,
  CalendarClock,
  CheckCheck,
  FileText,
  Flame,
  FileCheck,
  Clock,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { formatDateTime, formatRelativeTime } from "../../lib/simulate";

const TYPE_ICONS = {
  deadline: Clock,
  document: FileText,
  application: FileCheck,
  appointment: CalendarClock,
  interview: Bot,
  points: Flame,
  update: BellRing,
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
];

const Notifications = () => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppData();
  const { showToast } = useToast();

  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => {
    if (filter === "unread") return notifications.filter((item) => !item.isRead);
    if (filter === "read") return notifications.filter((item) => item.isRead);
    return notifications;
  }, [filter, notifications]);

  const handleMarkAll = () => {
    markAllNotificationsRead();
    showToast("All notifications marked as read.");
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-9 pb-12">
      <PageHeader
        icon={Bell}
        title="Notifications"
        description={
          unreadNotificationCount > 0
            ? `${unreadNotificationCount} unread update${unreadNotificationCount === 1 ? "" : "s"}`
            : "You are all caught up."
        }
        actions={
          unreadNotificationCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-blue-600 transition-all duration-300"
            >
              <CheckCheck className="w-5 h-5" />
              Mark all as read
            </button>
          ) : null
        }
      />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === option.value
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === "unread" ? "Nothing unread" : "No notifications"}
            description="Deadlines, document checks and counsellor updates land here."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {visible.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] ?? BellRing;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markNotificationRead(notification.id)}
                  className={`w-full text-left p-5 flex items-start gap-4 hover:bg-gray-50 transition-colors ${
                    notification.isRead ? "bg-white" : "bg-blue-50"
                  }`}
                >
                  <div className="p-2 bg-white rounded-lg border border-gray-200 flex-shrink-0">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium text-gray-900">{notification.title}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                    <span className="text-xs text-gray-400 mt-2 block">
                      {formatDateTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Notifications;
