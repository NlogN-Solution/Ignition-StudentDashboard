import { apiGet, apiPost } from "./client";

/**
 * Correspondence, from the student's side.
 *
 * The same threads the staff console reads — including anything written while
 * the student was still a lead. See the backend's `CommunicationService`.
 */

const mapAttachment = (a) => ({
  id: a.id,
  kind: a.kind,
  name: a.original_file_name,
  mimeType: a.mime_type,
  sizeBytes: a.file_size,
  durationSeconds: a.duration_seconds,
});

const mapMessage = (m) => ({
  id: m.id,
  authorId: m.author_id,
  authorName: m.author_name,
  isFromStudent: m.is_from_student,
  body: m.body,
  bodyHtml: m.body_html,
  readAt: m.read_at,
  createdAt: m.created_at,
  attachments: (m.attachments ?? []).map(mapAttachment),
});

const mapThread = (t) => ({
  id: t.id,
  subject: t.subject,
  applicationId: t.application_id,
  participantName: t.participant?.name ?? "",
  lastMessageAt: t.last_message_at,
  preview: t.last_message_preview,
  isClosed: t.is_closed,
  unreadCount: t.unread_count ?? 0,
  messageCount: t.message_count ?? 0,
  messages: (t.messages ?? []).map(mapMessage),
});

export const getMyThreads = async ({ applicationId } = {}) => {
  const query = applicationId ? `?application_id=${applicationId}` : "";
  const data = await apiGet(`/student/me/threads${query}`);
  return data.map(mapThread);
};

export const getThread = async (threadId) => mapThread(await apiGet(`/communication/threads/${threadId}`));

export const startThread = async ({ subject, body, bodyHtml, applicationId }) =>
  mapThread(
    await apiPost("/student/me/threads", {
      subject,
      body,
      body_html: bodyHtml ?? null,
      application_id: applicationId ?? null,
    })
  );

/**
 * Reply, with whatever is attached.
 *
 * Always multipart, even for a plain reply: the backend takes the body, the
 * files and a voice note in one request so a message and its attachments are a
 * single outcome. See the note where `MessageCreate` would have been.
 */
export const replyToThread = async (threadId, { body, bodyHtml, files = [], voice = null }) => {
  const form = new FormData();
  form.append("body", body);
  if (bodyHtml) form.append("body_html", bodyHtml);
  for (const file of files) form.append("files", file);
  if (voice?.blob) {
    form.append("voice", voice.blob, voice.name ?? "voice-note.webm");
    if (voice.durationSeconds) form.append("voice_duration", String(Math.round(voice.durationSeconds)));
  }
  return mapMessage(await apiPost(`/communication/threads/${threadId}/messages`, form));
};

/** A URL the browser can open for an attachment. Same reasoning as documents. */
export const getAttachmentLink = async (attachmentId, disposition = "inline") => {
  const data = await apiGet(`/communication/attachments/${attachmentId}/link?disposition=${disposition}`);
  return data.url;
};
