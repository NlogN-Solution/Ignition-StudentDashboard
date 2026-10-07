import { apiGet, apiPost } from "./client";

/**
 * Milestone celebrations. The portal-access unlock that used to live here was
 * removed from the UI; its backend routes (`/student/me/access*`) still exist.
 */

/* ------------------------------------------------------------ milestones --- */

const mapMilestone = (m) => ({
  id: m.id,
  applicationId: m.application_id,
  kind: m.kind,
  occurredAt: m.occurred_at,
  programName: m.program_name,
  universityName: m.university_name,
});

export const getUnseenMilestones = async () => {
  try {
    const data = await apiGet("/student/me/milestones/unseen");
    return data.map(mapMilestone);
  } catch {
    // A missing celebration is never worth an error state.
    return [];
  }
};

export const markMilestoneSeen = (milestoneId) =>
  apiPost(`/student/me/milestones/${milestoneId}/seen`).catch(() => null);
