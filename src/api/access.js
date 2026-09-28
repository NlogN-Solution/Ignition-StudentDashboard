import { apiGet, apiPost } from "./client";

/**
 * Th one-time platform unlock, and the milestones it gates.
 *
 * The entitlement is a completed `PORTAL_ACCESS` payment on the server — there
 * is deliberately no `isPaid` anywhere in this client. Every gated read is
 * enforced by the backend on the document routes themselves, so a student who
 * cleared their localStorage, or called the API directly, gets the same answer.
 */

export const getAccessState = async () => {
  const data = await apiGet("/student/me/access");
  return {
    hasAccess: data.has_access,
    fee: data.fee
      ? {
          amount: data.fee.amount,
          currency: data.fee.currency,
          countryName: data.fee.country_name,
          isDefault: data.fee.is_default,
        }
      : null,
    paidAt: data.paid_at,
    methods: data.methods ?? [],
    // True while no real gateway is wired up. Surfaced rather than hidden: a
    // student should never be misled about whether money moved.
    simulated: data.simulated,
  };
};

/**
 * Complete the unlock.
 *
 * Refused by the backend unless `SIMULATED_PAYMENTS` is set, which is the
 * honest posture — the alternative is recording a payment that never happened
 * while calling it real. Replacing the simulation with a gateway is a change
 * behind this one call.
 */
export const checkoutAccess = async (paymentMethod) => {
  const data = await apiPost("/student/me/access/checkout", { payment_method: paymentMethod });
  return { hasAccess: data.has_access, paidAt: data.paid_at };
};

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
