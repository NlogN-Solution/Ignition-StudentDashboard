/** Workflow tasks are views of the journey's existing progress, never copies. */
export const journeyChecklistTasks = (application, journey) => {
  if (!journey || journey.status === "cancelled") return [];
  return journey.steps.filter((step) => step.kind === "checklist" && step.status !== "skipped").flatMap((step) =>
    (step.config.tasks ?? []).map((task) => ({
      id: `journey:${application.id}:${step.id}:${task.key}`,
      applicationId: application.id, stepId: step.id, taskKey: task.key,
      title: task.label,
      description: [application.courseName, application.universityName].filter(Boolean).join(" · "),
      stage: step.name, dueDate: null,
      completed: Boolean(step.progress?.tasks?.[task.key]) || step.status === "completed",
      completedAt: step.completedAt,
      isLocked: step.status !== "current", isPriority: true, isJourneyTask: true,
    }))
  );
};
