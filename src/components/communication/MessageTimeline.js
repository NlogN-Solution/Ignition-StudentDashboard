import React from "react";
import { Download, FileText, Mic, Paperclip } from "lucide-react";

import { formatDateTime, formatFileSize } from "../../lib/simulate";

/**
 * A thread, as correspondence rather than a chat.
 *
 * Deliberately **not** chat bubbles. This is application correspondence — "the
 * documents we need for Manchester", read weeks later to check what was
 * agreed — and a wall of alternating rounded bubbles is the wrong form for
 * something you re-read. So: full-width entries, an author line, a timestamp
 * you can actually scan down, and a rule between them. Sender is signalled by
 * a left border and a tinted ground, not by which side of the screen it is on.
 *
 * `bodyHtml` is rendered where present. It is sanitised server-side on write
 * (`core/sanitize`) — an allowlist of the four things the composer can
 * produce, rebuilt from scratch rather than filtered — which is what makes
 * `dangerouslySetInnerHTML` defensible here. The plain-text `body` is the
 * fallback and is what everything else (previews, notifications, search)
 * reads.
 */

const Attachment = ({ attachment, onOpen }) => {
  const isVoice = attachment.kind === "voice";
  const Icon = isVoice ? Mic : attachment.kind === "image" ? Paperclip : FileText;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-white px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden />
        <span className="min-w-0 truncate text-[13px] font-semibold text-ink-soft">
          {isVoice ? "Voice note" : attachment.name}
        </span>
        <span className="shrink-0 text-[12px] font-medium text-ink-faint">
          {isVoice && attachment.durationSeconds
            ? `${Math.round(attachment.durationSeconds)}s`
            : formatFileSize(attachment.sizeBytes)}
        </span>
      </span>
      <button
        type="button"
        onClick={() => onOpen(attachment, isVoice ? "inline" : "attachment")}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-ring-idle bg-white px-2.5 py-1 text-[12.5px] font-semibold text-ink-soft transition-colors hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
      >
        <Download className="h-3 w-3" aria-hidden />
        {isVoice ? "Play" : "Open"}
      </button>
    </li>
  );
};

const MessageTimeline = ({ messages, onOpenAttachment, viewerIsStudent = true }) => (
  <ol className="divide-y divide-hairline">
    {messages.map((message) => {
      const fromViewer = message.isFromStudent === viewerIsStudent;
      return (
        <li key={message.id} className="py-5 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[14px] font-bold text-navy-900">
              {fromViewer ? "You" : message.authorName || (message.isFromStudent ? "Student" : "Ignition")}
            </p>
            <time
              dateTime={message.createdAt}
              className="text-[12.5px] font-medium tabular-nums text-ink-faint"
            >
              {formatDateTime(message.createdAt)}
            </time>
          </div>

          <div
            className={`mt-2 rounded-lg border-l-[3px] py-1 pl-3.5 ${
              fromViewer ? "border-l-navy-200 bg-navy-50/40" : "border-l-ignite-300 bg-ignite-50/30"
            }`}
          >
            {message.bodyHtml ? (
              <div
                className="py-2 pr-3 text-[14.5px] font-medium leading-[1.65] text-ink [&_a]:text-navy-900 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
                // Safe because the server sanitises on write, not on read.
                // See the note at the top of this file.
                dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
              />
            ) : (
              <p className="whitespace-pre-wrap py-2 pr-3 text-[14.5px] font-medium leading-[1.65] text-ink">
                {message.body}
              </p>
            )}
          </div>

          {message.attachments.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {message.attachments.map((attachment) => (
                <Attachment key={attachment.id} attachment={attachment} onOpen={onOpenAttachment} />
              ))}
            </ul>
          ) : null}
        </li>
      );
    })}
  </ol>
);

export default MessageTimeline;
