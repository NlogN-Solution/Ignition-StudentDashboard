import { useCallback, useEffect, useMemo, useState } from "react";
import { getJourney, tickTask } from "../api/journey";
import { useAppData } from "../context/AppDataContext";
import { journeyChecklistTasks } from "../lib/checklistTasks";
import { STOPPED_STATUSES } from "../lib/applicationStatus";

/** Personal assignments and application checklists share the student views. */
export const useStudentChecklist = () => {
  const { applications, tasks: assignments, toggleTask: toggleAssignment, isReady } = useAppData();
  const [journeys, setJourneys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const ids = applications.filter((app) => !STOPPED_STATUSES.includes(app.status)).map((app) => app.id).join(",");
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const open = applications.filter((app) => ids.split(",").includes(app.id));
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      const results = await Promise.allSettled(open.map(async (application) => ({ application, journey: await getJourney(application.id) })));
      if (!cancelled) {
        setJourneys((previous) => results.flatMap((result, index) => result.status === "fulfilled" ? [result.value] : previous.filter((entry) => entry.application.id === open[index].id)));
        setIsLoading(false);
      }
      inFlight = false;
    };
    setIsLoading(true);
    load();
    const refresh = () => { if (document.visibilityState === "visible") load(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
    // Application ids determine which journeys must be read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  const tasks = useMemo(() => [...assignments, ...journeys.flatMap(({ application, journey }) => journeyChecklistTasks(application, journey))], [assignments, journeys]);
  const toggleTask = useCallback(async (id) => {
    const task = tasks.find((item) => item.id === id);
    if (!task || task.isLocked) return;
    if (!task.isJourneyTask) return toggleAssignment(id);
    const journey = await tickTask(task.applicationId, task.stepId, task.taskKey, !task.completed);
    setJourneys((current) => current.map((entry) => entry.application.id === task.applicationId ? { ...entry, journey } : entry));
  }, [tasks, toggleAssignment]);
  return { tasks, toggleTask, isLoading: !isReady || isLoading };
};
