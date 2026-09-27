import React from "react";
import { motion } from "framer-motion";
import { CircleCheck, Circle, ListChecks } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { formatDate, formatDeadline } from "../../lib/simulate";

/**
 * The tasks the student's advisor has set, and nothing else.
 *
 * This used to be a fixed nine-step milestone chain (passport → departure),
 * locked in order, with a "2/10 complete" counter. What a student owes depends
 * on their route and workflow, so a fixed ladder promised a journey nobody had
 * planned. Tasks now arrive only when staff add them from the console, and
 * there is no total to count against because the list is not finite.
 */
const Tasks = () => {
  const { tasks, toggleTask } = useAppData();
  const { showToast } = useToast();

  // Open tasks first, soonest due first; undated ones after dated ones.
  const ordered = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
    if (a.dueDate || b.dueDate) return a.dueDate ? -1 : 1;
    return 0;
  });

  const handleToggle = (task) => {
    toggleTask(task.id);
    showToast(
      task.completed ? `${task.title} marked as not done.` : `${task.title} completed.`,
      task.completed ? "info" : "success"
    );
  };

  return (
    <div className="min-h-screen mt-9 pb-12">
      <PageHeader
        icon={ListChecks}
        title="My Checklist"
        description="Tasks your Ignition advisor has asked you to complete."
      />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {ordered.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No tasks yet"
            description="When your advisor needs something from you, the task will appear here."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <ul className="p-6 space-y-3">
              {ordered.map((task, index) => (
                <motion.li
                  key={task.id}
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    className="flex-shrink-0 mt-3"
                    aria-label={task.completed ? `Mark ${task.title} as not done` : `Complete ${task.title}`}
                  >
                    {task.completed ? (
                      <CircleCheck className="w-7 h-7 text-green-500" />
                    ) : (
                      <Circle className="w-7 h-7 text-gray-300 hover:text-navy-400 transition-colors" />
                    )}
                  </button>

                  <div
                    className={`flex-1 p-4 border rounded-lg transition-all duration-300 ${
                      task.completed ? "border-green-200 bg-green-50" : "border-gray-200 hover:shadow-md hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <h3 className={`font-medium ${task.completed ? "text-gray-500 line-through" : "text-gray-900"}`}>
                        {task.title}
                      </h3>
                      {task.completed || task.dueDate ? (
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            task.completed
                              ? "bg-green-100 text-green-600"
                              : formatDeadline(task.dueDate).startsWith("Overdue")
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {task.completed ? `Done ${formatDate(task.completedAt)}` : formatDeadline(task.dueDate)}
                        </span>
                      ) : null}
                    </div>
                    {task.description ? <p className="text-sm text-gray-600">{task.description}</p> : null}
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;
