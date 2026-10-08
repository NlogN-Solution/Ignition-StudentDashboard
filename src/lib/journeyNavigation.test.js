import { findJourneyStage, milestoneApplicationHref } from "./journeyNavigation";
import { journeyChecklistTasks } from "./checklistTasks";

test("offer and CAS celebrations link to the issued stage", () => {
  expect(milestoneApplicationHref({ applicationId: "app", kind: "offer_received" })).toBe("/applications/app?tab=journey&stage=offer");
  expect(milestoneApplicationHref({ applicationId: "app", kind: "cas_received" })).toBe("/applications/app?tab=journey&stage=cas_issued");
  const steps = [{ id: "offer-id", key: "custom-offer", kind: "issued", config: { milestone_status: "offer_received" } }, { id: "prep-id", key: "interview_prep", kind: "review" }];
  expect(findJourneyStage(steps, "offer").id).toBe("offer-id");
  expect(findJourneyStage(steps, "prep-id").id).toBe("prep-id");
  expect(findJourneyStage(steps, "missing")).toBeNull();
});

test("workflow checklist tasks retain stage, completion and lock state", () => {
  const step = { id: "step", kind: "checklist", name: "Interview preparation", status: "current", config: { tasks: [{ key: "practice", label: "Practise your answers" }, { key: "research", label: "Research the university" }] }, progress: { tasks: { practice: true } } };
  const app = { id: "app", courseName: "Computing", universityName: "University" };
  const tasks = journeyChecklistTasks(app, { steps: [step] });
  expect(tasks).toHaveLength(2);
  expect(tasks[0]).toMatchObject({ completed: true, isLocked: false, stage: "Interview preparation", applicationId: "app", stepId: "step", taskKey: "practice" });
  expect(tasks[1]).toMatchObject({ completed: false, isPriority: true });
  expect(journeyChecklistTasks(app, { steps: [{ ...step, status: "pending" }] })[0].isLocked).toBe(true);
  expect(journeyChecklistTasks(app, { steps: [{ ...step, status: "skipped" }] })).toEqual([]);
  expect(journeyChecklistTasks(app, { status: "cancelled", steps: [step] })).toEqual([]);
});
