import { apiGet, apiPatch } from "./client";

// The student-scoped path (no user id needed) — Ignition also exposes the
// same StudentProfileRead/Upsert shape at /users/{id}/student-profile for
// staff, but the portal always acts as "me".
export const fetchMyProfile = () => apiGet("/student/me/profile");

export const updateMyProfile = (patch) => apiPatch("/student/me/profile", patch);

// The shortlist a student carried over from the public site, resolved against
// the real catalogue. The handoff carries slugs and no names on purpose — the
// names live in the catalogue, and a label copied into a URL is the one copy
// nothing can keep up to date.
export const fetchMyResearch = () => apiGet("/student/me/research");
