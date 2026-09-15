import React from "react";
import { motion } from "framer-motion";
import { CircleCheck, Circle, ListChecks, Lock } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { formatDate, formatDeadline } from "../../lib/simulate";

/**
 * The milestone chain — Passport → IELTS → SOP → LOR → Apply → Interview →
 * Offer → Visa → Departure. Order, due dates and dependencies all come from
 * tasksChecklist.json; completion is toggled in local state only.
 */
const Tasks = () => {
  const { tasks, toggleTask, isTaskUnlocked, taskProgress } = useAppData();
  const { showToast } = useToast();

  const ordered = [...tasks].sort((a, b) => a.order - b.order);
  const completedCount = ordered.filter((task) => task.completed).length;

  const handleToggle = (task) => {
    if (!isTaskUnlocked(task)) {
      showToast("Finish the previous milestone before starting this one.", "info");
      return;
    }
    toggleTask(task.id);
    showToast(
      task.completed ? `${task.title} marked as not done.` : `${task.title} completed.`,
      task.completed ? "info" : "success"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-9 pb-12">
      <PageHeader
        icon={ListChecks}
        title="My Checklist"
        description="Your study abroad milestones, in the order they need to happen."
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Milestones complete</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {completedCount}
            <span className="text-lg text-gray-400">/{ordered.length}</span>
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${taskProgress}%` }}
            />
          </div>
        </div>

        {ordered.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No checklist yet"
            description="Your counsellor will assign milestones once your profile is reviewed."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Milestone chain</h2>
              <p className="text-gray-600 mt-1">
                Each step unlocks once the previous one is marked complete.
              </p>
            </div>

            <ol className="p-6 space-y-4">
              {ordered.map((task, index) => {
                const unlocked = isTaskUnlocked(task);
                const isLast = index === ordered.length - 1;

                return (
                  <motion.li
                    key={task.id}
                    className="relative flex gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Connector line down the chain */}
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[13px] top-8 bottom-[-1rem] w-0.5 ${
                          task.completed ? "bg-green-300" : "bg-gray-200"
                        }`}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className="relative z-10 flex-shrink-0 mt-1"
                      aria-label={
                        task.completed ? `Mark ${task.title} as not done` : `Complete ${task.title}`
                      }
                    >
                      {task.completed ? (
                        <CircleCheck className="w-7 h-7 text-green-500" />
                      ) : unlocked ? (
                        <Circle className="w-7 h-7 text-gray-300 hover:text-blue-400 transition-colors" />
                      ) : (
                        <Lock className="w-7 h-7 text-gray-300 p-1" />
                      )}
                    </button>

                    <div
                      className={`flex-1 p-4 border rounded-lg transition-all duration-300 ${
                        task.completed
                          ? "border-green-200 bg-green-50"
                          : unlocked
                          ? "border-gray-200 hover:shadow-md hover:bg-gray-50"
                          : "border-gray-100 bg-gray-50 opacity-70"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                            {task.stage}
                          </span>
                          <h3
                            className={`font-medium ${
                              task.completed ? "text-gray-500 line-through" : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </h3>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            task.completed
                              ? "bg-green-100 text-green-600"
                              : formatDeadline(task.dueDate).startsWith("Overdue")
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {task.completed
                            ? `Done ${formatDate(task.completedAt)}`
                            : formatDeadline(task.dueDate)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      {!unlocked && !task.completed && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Locked until the previous milestone is complete
                        </p>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;
