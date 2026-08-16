import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  addCompareCourseApi,
  answerInterviewQuestionApi,
  completeInterviewApi,
  getActivityFeedFor,
  getApplicationsFor,
  getAppointmentsFor,
  getCatalogApi,
  getDocumentsFor,
  getInterviewSessionsFor,
  getMessagesApi,
  getNotificationsFor,
  getPointsFor,
  getProgressFor,
  getSavedItemsApi,
  getTasksFor,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  removeCompareCourseApi,
  requestAppointmentApi,
  saveCourseApi,
  saveUniversityApi,
  setChecklistItemCompleted,
  startInterviewApi,
  unsaveCourseApi,
  unsaveUniversityApi,
  uploadDocumentFile,
} from "../api/studentPortal";
import { getFeedbackForScore, ignitionPoints, progressMilestones as localMilestoneMeta } from "../data";
import { generateId } from "../lib/simulate";
import { useAuth } from "./AuthContext";

// Every collection below now comes from the real backend
// (src/api/studentPortal.js maps each response onto the same shape the old
// src/data/*.json fixtures used, so the render logic here mostly didn't have
// to change). What's still local-only, and why, is called out at each
// mutation below — mainly: applications and appointment
// reschedule/cancel/create have no student-facing write endpoint by design
// (a counsellor opens an `Application`, the same way staff open a
// `VisaCase` — see IGNITION_PLATFORM_PLAN.md Phase 6/7), so those stay
// client-simulated, same posture as `profileImage` in AuthContext.

const AppDataContext = createContext(null);

const newestFirst = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);

export const AppDataProvider = ({ children }) => {
  const { studentId } = useAuth();

  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [activityFeed, setActivityFeed] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [pointsLedger, setPointsLedger] = useState([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [progress, setProgress] = useState({ completionPercentage: 0, milestones: [] });
  const [saved, setSaved] = useState({
    courseIds: [],
    universityIds: [],
    compareCourseIds: [],
  });
  const [maxCompare, setMaxCompare] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // Re-fetch whenever the signed-in student changes.
  useEffect(() => {
    let cancelled = false;

    if (!studentId) {
      setCourses([]);
      setUniversities([]);
      setApplications([]);
      setDocuments([]);
      setAppointments([]);
      setNotifications([]);
      setUnreadMessageCount(0);
      setActivityFeed([]);
      setTasks([]);
      setInterviewSessions([]);
      setPointsLedger([]);
      setPointsBalance(0);
      setProgress({ completionPercentage: 0, milestones: [] });
      setSaved({ courseIds: [], universityIds: [], compareCourseIds: [] });
      return undefined;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const [
          nextCatalog,
          nextApplications,
          nextDocuments,
          nextAppointments,
          nextNotifications,
          nextMessages,
          nextActivity,
          nextTasks,
          nextInterviews,
          nextPoints,
          nextProgress,
          nextSaved,
        ] = await Promise.all([
          getCatalogApi().catch(() => ({ courses: [], universities: [] })),
          getApplicationsFor().catch(() => []),
          getDocumentsFor().catch(() => []),
          getAppointmentsFor().catch(() => []),
          getNotificationsFor().catch(() => []),
          getMessagesApi().catch(() => ({ items: [], unreadCount: 0 })),
          getActivityFeedFor().catch(() => []),
          getTasksFor().catch(() => []),
          getInterviewSessionsFor().catch(() => []),
          getPointsFor().catch(() => ({ balance: 0, ledger: [] })),
          getProgressFor().catch(() => ({ completionPercentage: 0, milestones: [] })),
          getSavedItemsApi().catch(() => ({ courseIds: [], universityIds: [], compareCourseIds: [], maxCompare: 3 })),
        ]);
        if (cancelled) return;

        setCourses(nextCatalog.courses);
        setUniversities(nextCatalog.universities);
        setApplications(nextApplications);
        setDocuments(nextDocuments);
        setAppointments(nextAppointments);
        setNotifications(nextNotifications);
        setUnreadMessageCount(nextMessages.unreadCount);
        setActivityFeed(nextActivity);
        setTasks(nextTasks);
        setInterviewSessions(nextInterviews);
        setPointsBalance(nextPoints.balance);
        setPointsLedger(nextPoints.ledger);
        setProgress(nextProgress);
        setSaved({
          courseIds: nextSaved.courseIds,
          universityIds: nextSaved.universityIds,
          compareCourseIds: nextSaved.compareCourseIds,
        });
        setMaxCompare(nextSaved.maxCompare ?? 3);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  // The unread badge on the sidebar's Messages icon needs to move even while
  // the student is sitting on an unrelated page — nothing else in this
  // context polls, but a chat inbox is the one thing where "check back next
  // time you load a page" would feel broken.
  useEffect(() => {
    if (!studentId) return undefined;
    const interval = setInterval(() => {
      getMessagesApi()
        .then((next) => setUnreadMessageCount(next.unreadCount))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [studentId]);

  const refetchMessages = useCallback(async () => {
    try {
      const next = await getMessagesApi();
      setUnreadMessageCount(next.unreadCount);
    } catch {
      // Badge simply stays stale until the next successful refetch.
    }
  }, []);

  const refetchPoints = useCallback(async () => {
    try {
      const next = await getPointsFor();
      setPointsBalance(next.balance);
      setPointsLedger(next.ledger);
    } catch {
      // Balance simply stays stale until the next successful refetch.
    }
  }, []);

  const refetchProgress = useCallback(async () => {
    try {
      setProgress(await getProgressFor());
    } catch {
      // Same as refetchPoints — best effort.
    }
  }, []);

  /* ---------------------------------------------------------------- feed --- */

  /** Client-side-only ticker entry. There is no "add an arbitrary activity
   * line" endpoint — the real feed (`getActivityFeedFor`) is a projection
   * over what the backend actually observed (document/application events),
   * so a page narrating its own action locally, alongside that, is additive
   * rather than a lie: it never overwrites the real feed, just prepends to
   * the in-memory copy of it until the next refetch. */
  const pushActivity = useCallback((message, type = "update") => {
    setActivityFeed((current) => [
      { id: generateId("act"), studentId, message, type, createdAt: new Date().toISOString() },
      ...current,
    ]);
  }, [studentId]);

  const pushNotification = useCallback((title, description, type = "update") => {
    setNotifications((current) => [
      {
        id: generateId("ntf"),
        studentId,
        title,
        description,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
  }, [studentId]);

  /** No student-callable "award points" endpoint exists, by design (Phase 6:
   * points move only through event subscribers, never a client call) — this
   * cannot write the real ledger. It stays local-only for pages that still
   * call it for immediate feedback; `pointsBalance`/`pointsLedger` themselves
   * are the real, fetched values and are not affected by this. Call
   * `refetchPoints` after an action that plausibly earned real points
   * (checklist completion, interview completion) instead of relying on this
   * for the displayed total. */
  const awardPoints = useCallback(() => {}, []);

  /* -------------------------------------------------------- notifications --- */

  const markNotificationRead = useCallback(async (notificationId) => {
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item))
    );
    try {
      await markNotificationReadApi(notificationId);
    } catch {
      // Optimistic update stands; a background sync failure isn't surfaced.
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    try {
      await markAllNotificationsReadApi();
    } catch {
      // Same as above.
    }
  }, []);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  /* ------------------------------------------------------------ documents --- */

  /** Real upload — `documentId` here is a `DocumentType` enum value
   * ("passport", "academic_transcript", ...), not a fixture slot id, since
   * the backend has no notion of a document "slot" — only actual uploads. */
  const uploadDocument = useCallback(
    async (documentType, file) => {
      const uploaded = await uploadDocumentFile(documentType, file);
      setDocuments((current) => {
        const withoutPrevious = current.filter((doc) => doc.documentType !== documentType);
        return [uploaded, ...withoutPrevious];
      });
      pushActivity(`${uploaded.title} uploaded to your document vault`, "document");
      return { ok: true, document: uploaded };
    },
    [pushActivity]
  );

  /** No student-facing delete endpoint (staff-only, ADMIN role) — a document
   * once uploaded is evidence in a review workflow the student cannot
   * silently retract. Local-only, matching the documented-gap pattern. */
  const removeDocument = useCallback(
    (documentId) => {
      const removed = documents.find((doc) => doc.id === documentId);
      setDocuments((current) => current.map((doc) => (doc.id === documentId ? { ...doc, status: null } : doc)));
      if (removed) pushActivity(`${removed.title} removed from your document vault`, "document");
    },
    [documents, pushActivity]
  );

  /* ---------------------------------------------------------- appointments --- */

  /** The one appointment write with a real endpoint. The backend sets
   * time/location/counsellor when it confirms the request — `draft.mode`,
   * `draft.counsellorId`, `draft.durationMinutes` have nothing to bind to
   * and are dropped rather than sent. */
  const requestAppointment = useCallback(
    async (draft) => {
      const appointment = await requestAppointmentApi({
        meetingType: draft.meetingType,
        agenda: draft.agenda,
        preferredDate: draft.scheduledAt ? draft.scheduledAt.slice(0, 10) : draft.preferredDate,
      });
      setAppointments((current) => [appointment, ...current]);
      pushActivity(`${appointment.meetingType} requested`, "appointment");
      return { ok: true, appointment };
    },
    [pushActivity]
  );

  // KNOWN GAP: no student-facing reschedule/cancel endpoint (the generic
  // PATCH is staff-only) — local-only.
  const rescheduleAppointment = useCallback(async (appointmentId, scheduledAt) => {
    setAppointments((current) =>
      current.map((apt) =>
        apt.id === appointmentId
          ? { ...apt, scheduledAt, status: "pending", notes: "Reschedule requested — awaiting counsellor confirmation." }
          : apt
      )
    );
    return { ok: true };
  }, []);

  const cancelAppointment = useCallback(async (appointmentId) => {
    setAppointments((current) =>
      current.map((apt) => (apt.id === appointmentId ? { ...apt, status: "cancelled", notes: "Cancelled by student." } : apt))
    );
    return { ok: true };
  }, []);

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter(
          (apt) =>
            apt.status !== "cancelled" &&
            apt.status !== "completed" &&
            apt.scheduledAt &&
            new Date(apt.scheduledAt).getTime() >= Date.now()
        )
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
    [appointments]
  );

  /* ----------------------------------------------------------------- tasks --- */

  // "My Checklist" — the Phase 6 journey checklist (/student/me/checklist).
  // Locking is server-computed (`isLocked`) rather than derived here, since
  // it depends on the whole list and the server already did that work.

  const isTaskUnlocked = useCallback((task) => !task.isLocked, []);

  const toggleTask = useCallback(
    async (taskId) => {
      const target = tasks.find((task) => task.id === taskId);
      if (!target) return;
      const completed = !target.completed;

      const previous = tasks;
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, completed, completedAt: completed ? new Date().toISOString() : null } : task
        )
      );

      try {
        const updated = await setChecklistItemCompleted(taskId, completed);
        setTasks((current) => current.map((task) => (task.id === taskId ? updated : task)));
        if (completed) {
          pushActivity(`Checklist task completed — ${target.title}`, "task");
          refetchPoints();
          refetchProgress();
        }
      } catch (error) {
        setTasks(previous);
        throw error;
      }
    },
    [pushActivity, refetchPoints, refetchProgress, tasks]
  );

  /* ------------------------------------------------------------ interviews --- */

  const startInterview = useCallback(async (typeId) => {
    const session = await startInterviewApi(typeId);
    const summary = {
      id: session.id,
      typeId: session.type?.id ?? typeId,
      typeName: session.type?.name ?? "Interview",
      status: "in-progress",
      startedAt: session.started_at,
      completedAt: null,
      score: null,
      feedbackId: null,
      answers: [],
      questions: session.type?.questions ?? [],
    };
    setInterviewSessions((current) => [summary, ...current]);
    return summary;
  }, []);

  /** Scoring itself is the backend's `WordCountScorer` (Phase 6) now, not the
   * local word-count estimate this used to run — `completeInterview` submits
   * every answer, then asks the backend to total and band them. */
  const completeInterview = useCallback(
    async (sessionId, answers) => {
      for (const answer of answers) {
        if (!answer.questionId) continue;
        // eslint-disable-next-line no-await-in-loop -- answers must land before /complete totals them
        await answerInterviewQuestionApi(sessionId, answer.questionId, answer.response ?? "");
      }
      const completed = await completeInterviewApi(sessionId);
      const score = completed.score ?? 0;
      const feedback = completed.feedback || getFeedbackForScore(score);

      setInterviewSessions((current) =>
        current.map((session) =>
          session.id === sessionId
            ? { ...session, status: "completed", completedAt: completed.completed_at, score, feedbackId: feedback?.key ?? feedback?.id }
            : session
        )
      );

      pushActivity(`${completed.type?.name ?? "Interview"} scored ${score}%`, "interview");
      refetchPoints();
      refetchProgress();
      return { ok: true, score, feedback };
    },
    [pushActivity, refetchPoints, refetchProgress]
  );

  /** No delete endpoint for a session — it stays on the server incomplete.
   * This only removes it from the local list. */
  const abandonInterview = useCallback((sessionId) => {
    setInterviewSessions((current) => current.filter((session) => session.id !== sessionId));
  }, []);

  /* ------------------------------------------------------- saved / compare --- */

  const toggleSavedCourse = useCallback(
    async (courseId) => {
      const isSaved = saved.courseIds.includes(courseId);
      setSaved((current) => ({
        ...current,
        courseIds: isSaved ? current.courseIds.filter((id) => id !== courseId) : [...current.courseIds, courseId],
      }));
      try {
        if (isSaved) await unsaveCourseApi(courseId);
        else await saveCourseApi(courseId);
      } catch {
        setSaved((current) => ({
          ...current,
          courseIds: isSaved ? [...current.courseIds, courseId] : current.courseIds.filter((id) => id !== courseId),
        }));
      }
    },
    [saved.courseIds]
  );

  const toggleSavedUniversity = useCallback(
    async (universityId) => {
      const isSaved = saved.universityIds.includes(universityId);
      setSaved((current) => ({
        ...current,
        universityIds: isSaved
          ? current.universityIds.filter((id) => id !== universityId)
          : [...current.universityIds, universityId],
      }));
      try {
        if (isSaved) await unsaveUniversityApi(universityId);
        else await saveUniversityApi(universityId);
      } catch {
        setSaved((current) => ({
          ...current,
          universityIds: isSaved
            ? [...current.universityIds, universityId]
            : current.universityIds.filter((id) => id !== universityId),
        }));
      }
    },
    [saved.universityIds]
  );

  const toggleCompareCourse = useCallback(
    async (courseId) => {
      const isComparing = saved.compareCourseIds.includes(courseId);
      if (!isComparing && saved.compareCourseIds.length >= maxCompare) return;

      setSaved((current) => ({
        ...current,
        compareCourseIds: isComparing
          ? current.compareCourseIds.filter((id) => id !== courseId)
          : [...current.compareCourseIds, courseId],
      }));
      try {
        if (isComparing) await removeCompareCourseApi(courseId);
        else await addCompareCourseApi(courseId);
      } catch {
        setSaved((current) => ({
          ...current,
          compareCourseIds: isComparing
            ? [...current.compareCourseIds, courseId]
            : current.compareCourseIds.filter((id) => id !== courseId),
        }));
      }
    },
    [maxCompare, saved.compareCourseIds]
  );

  const clearCompare = useCallback(async () => {
    const ids = saved.compareCourseIds;
    setSaved((current) => ({ ...current, compareCourseIds: [] }));
    await Promise.all(ids.map((id) => removeCompareCourseApi(id).catch(() => {})));
  }, [saved.compareCourseIds]);

  /* ------------------------------------------------------ derived metrics --- */

  const totalPoints = pointsBalance;

  const currentLevel = useMemo(() => {
    const sorted = [...ignitionPoints.levels].sort((a, b) => b.minPoints - a.minPoints);
    return sorted.find((level) => totalPoints >= level.minPoints) || ignitionPoints.levels[0];
  }, [totalPoints]);

  const nextLevel = useMemo(() => {
    const ascending = [...ignitionPoints.levels].sort((a, b) => a.minPoints - b.minPoints);
    return ascending.find((level) => level.minPoints > totalPoints) || null;
  }, [totalPoints]);

  const requiredDocuments = useMemo(() => documents, [documents]);

  /** The real ladder (`progress.milestones`, from `/me/progress`) drives
   * `completed`; `localMilestoneMeta`'s icon/description dressing — nothing
   * server-side carries that — is merged in by `key` since the seeded
   * milestone keys match this fixture's on purpose (see scripts/seed.py). */
  const milestoneStatus = useMemo(() => {
    const byKey = new Map(progress.milestones.map((m) => [m.key, m]));
    return [...localMilestoneMeta]
      .sort((a, b) => a.order - b.order)
      .map((milestone) => ({ ...milestone, completed: Boolean(byKey.get(milestone.key)?.completed) }));
  }, [progress.milestones]);

  const overallProgress = progress.completionPercentage ?? 0;

  const documentProgress = useMemo(() => {
    if (requiredDocuments.length === 0) return 0;
    const done = requiredDocuments.filter((doc) => doc.status === "approved" || doc.status === "verified").length;
    return Math.round((done / requiredDocuments.length) * 100);
  }, [requiredDocuments]);

  const taskProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100);
  }, [tasks]);

  const sortedActivityFeed = useMemo(() => [...activityFeed].sort(newestFirst), [activityFeed]);
  const sortedNotifications = useMemo(() => [...notifications].sort(newestFirst), [notifications]);

  const value = useMemo(
    () => ({
      // catalog
      courses,
      universities,

      // collections
      applications,
      documents,
      appointments,
      upcomingAppointments,
      notifications: sortedNotifications,
      activityFeed: sortedActivityFeed,
      tasks,
      interviewSessions,
      pointsLedger,
      saved,
      isLoading,

      // notifications
      unreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,

      // messages
      unreadMessageCount,
      refetchMessages,

      // documents
      uploadDocument,
      removeDocument,

      // appointments
      requestAppointment,
      rescheduleAppointment,
      cancelAppointment,

      // tasks
      toggleTask,
      isTaskUnlocked,

      // interviews
      startInterview,
      completeInterview,
      abandonInterview,

      // saved / compare
      toggleSavedCourse,
      toggleSavedUniversity,
      toggleCompareCourse,
      clearCompare,
      maxCompare,

      // derived
      totalPoints,
      currentLevel,
      nextLevel,
      milestoneStatus,
      overallProgress,
      documentProgress,
      taskProgress,
      requiredDocuments,
      pushActivity,
      awardPoints,
      refetchPoints,
      refetchProgress,
    }),
    [
      courses,
      universities,
      applications,
      documents,
      appointments,
      upcomingAppointments,
      sortedNotifications,
      sortedActivityFeed,
      tasks,
      interviewSessions,
      pointsLedger,
      saved,
      isLoading,
      unreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,
      unreadMessageCount,
      refetchMessages,
      uploadDocument,
      removeDocument,
      requestAppointment,
      rescheduleAppointment,
      cancelAppointment,
      toggleTask,
      isTaskUnlocked,
      startInterview,
      completeInterview,
      abandonInterview,
      toggleSavedCourse,
      toggleSavedUniversity,
      toggleCompareCourse,
      clearCompare,
      maxCompare,
      totalPoints,
      currentLevel,
      nextLevel,
      milestoneStatus,
      overallProgress,
      documentProgress,
      taskProgress,
      requiredDocuments,
      pushActivity,
      awardPoints,
      refetchPoints,
      refetchProgress,
    ]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside an AppDataProvider");
  }
  return context;
};

export default AppDataContext;
