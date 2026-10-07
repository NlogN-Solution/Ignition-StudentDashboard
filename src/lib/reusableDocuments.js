/**
 * Documents in the Paper Vault that can answer a request on another application.
 *
 * Documents belong to the student, not to one application. A transcript, MOI or
 * LOR uploaded for one course is the same file the next course asks for, so a
 * checklist item of the same `documentType` links to it rather than asking
 * for a second copy. The backend enforces the same type match on the link, and
 * keeps "verified" when the linked file is already approved.
 *
 * Rejected and expired files are never offered: reusing one would send back
 * something a counsellor has already turned down.
 */
const REUSABLE_STATUSES = ["approved", "pending"];

const uploadedAt = (document) => {
  const time = new Date(document.file?.uploadedAt ?? 0).getTime();
  return Number.isNaN(time) ? 0 : time;
};

/** Every reusable vault file of this type: approved first, then newest first. */
export const vaultMatches = (documents, documentType) => {
  if (!documentType) return [];
  return (documents ?? [])
    .filter((document) => document.documentType === documentType && REUSABLE_STATUSES.includes(document.status))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "approved" ? -1 : 1;
      return uploadedAt(b) - uploadedAt(a);
    });
};

/** The file to reuse for this type, or null. */
export const bestVaultMatch = (documents, documentType) => vaultMatches(documents, documentType)[0] ?? null;
