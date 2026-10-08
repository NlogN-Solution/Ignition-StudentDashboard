export const milestoneApplicationHref = (milestone) => {
  const base = `/applications/${milestone.applicationId}`;
  const stage = { offer_received: "offer", cas_received: "cas_issued" }[milestone.kind];
  return stage ? `${base}?tab=journey&stage=${stage}` : base;
};

export const findJourneyStage = (steps, stage) => {
  if (!stage) return null;
  const milestone = { offer: "offer_received", cas_issued: "cas_received" }[stage];
  return steps.find((step) => step.key === stage || step.id === stage || (milestone && step.kind === "issued" && step.config?.milestone_status === milestone)) ?? null;
};
