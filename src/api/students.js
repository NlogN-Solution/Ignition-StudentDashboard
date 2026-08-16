import { apiGet, apiPatch } from "./client";

// The student-scoped path (no user id needed) — Ignition also exposes the
// same StudentProfileRead/Upsert shape at /users/{id}/student-profile for
// staff, but the portal always acts as "me".
export const fetchMyProfile = () => apiGet("/student/me/profile");

export const updateMyProfile = (patch) => apiPatch("/student/me/profile", patch);
