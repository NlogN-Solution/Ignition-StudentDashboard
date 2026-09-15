import React, { useRef, useState } from "react";
import { Bold, Italic, Link2, List, Loader2, Paperclip, Send, X } from "lucide-react";

import VoiceRecorder from "./VoiceRecorder";
import { formatFileSize } from "../../lib/simulate";

/**
 * The reply box: rich text, files, a voice note, send.
 *
 * ## Why `contentEditable` and not an editor dependency
 *
 * What is actually needed is bold, italic, a list and a link — four things —
 * and `document.execCommand` still does all four in every browser that matters.
 * A 200KB editor bundle to get them would be the tail wagging the dog, and the
 * brief says not to overcomplicate it.
 *
 * Two values are kept, deliberately: `body` (the plain text) and `bodyHtml`.
 * The plain text is what search, previews and notification bodies read, and
 * what renders if the HTML is ever untrusted or unavailable. Neither is derived
 * from the other at read time.
 *
 * **The HTML is not trusted on the way back in.** It is sanitised server-side
 * before anything renders it; this component is a producer, not a guarantee.
 */

const MAX_ATTACHMENTS = 10;

const ToolbarButton = ({ icon: Icon, label, onClick }) => (
  <button
    type="button"
    onMouseDown={(event) => {
      // `onMouseDown` + preventDefault, not onClick: clicking a button blurs
      // the editable region first, and execCommand with no selection does
      // nothing. This keeps the caret where the student left it.
      event.preventDefault();
      onClick();
    }}
    aria-label={label}
    title={label}
    className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-navy-50 hover:text-navy-900"
  >
    <Icon className="h-3.5 w-3.5" aria-hidden />
  </button>
);

const Composer = ({ onSend, isSending, placeholder = "Write a reply…", autoFocus = false }) => {
  const editor = useRef(null);
  const fileInput = useRef(null);
  const [files, setFiles] = useState([]);
  const [voice, setVoice] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const exec = (command, value) => {
    document.execCommand(command, false, value);
    editor.current?.focus();
    setIsEmpty(!editor.current?.textContent?.trim());
  };

  const addFiles = (incoming) => {
    const room = MAX_ATTACHMENTS - files.length - (voice ? 1 : 0);
    setFiles((current) => [...current, ...Array.from(incoming).slice(0, Math.max(0, room))]);
  };

  const send = async () => {
    const node = editor.current;
    const body = (node?.textContent ?? "").trim();
    // A voice note on its own is a real message; the body then stands in for
    // it so previews, search and notifications have something to show.
    if (!body && !voice && files.length === 0) return;

    await onSend({
      body: body || (voice ? "Voice note" : "Attachment"),
      bodyHtml: body ? node.innerHTML : null,
      files,
      voice,
    });

    if (node) node.innerHTML = "";
    setFiles([]);
    setVoice(null);
    setIsEmpty(true);
  };

  const canSend = !isSending && (!isEmpty || voice || files.length > 0);

  return (
    <div className="rounded-xl border border-hairline bg-white">
      <div className="flex items-center gap-0.5 border-b border-hairline px-2 py-1.5">
        <ToolbarButton icon={Bold} label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => exec("italic")} />
        <ToolbarButton icon={List} label="Bulleted list" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton
          icon={Link2}
          label="Insert link"
          onClick={() => {
            // eslint-disable-next-line no-alert -- the browser's own prompt is
            // the whole feature here; a custom modal for one URL field would be
            // more code and worse keyboard behaviour.
            const href = window.prompt("Link to:");
            if (href) exec("createLink", href);
          }}
        />
        <span className="mx-1 h-4 w-px bg-hairline" aria-hidden />
        <ToolbarButton icon={Paperclip} label="Attach a file" onClick={() => fileInput.current?.click()} />
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {/* `relative` + an absolutely positioned placeholder: a contentEditable
          has no placeholder attribute, and `:empty::before` breaks the moment
          the browser leaves a stray <br> behind. */}
      <div className="relative">
        {isEmpty ? (
          <p className="pointer-events-none absolute left-3.5 top-3 text-[14.5px] font-medium text-ink-faint">
            {placeholder}
          </p>
        ) : null}
        <div
          ref={editor}
          role="textbox"
          aria-multiline="true"
          aria-label="Message"
          contentEditable
          suppressContentEditableWarning
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          autoFocus={autoFocus}
          onInput={(event) => setIsEmpty(!event.currentTarget.textContent.trim())}
          onPaste={(event) => {
            // Paste as plain text. Pasting from Word otherwise carries a
            // stylesheet in with it and the thread stops looking like one
            // conversation.
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              if (canSend) send();
            }
          }}
          onDrop={(event) => {
            if (!event.dataTransfer?.files?.length) return;
            event.preventDefault();
            addFiles(event.dataTransfer.files);
          }}
          className="min-h-[86px] max-h-[280px] overflow-y-auto px-3.5 py-3 text-[14.5px] font-medium leading-[1.6] text-ink outline-none [&_a]:text-blue-link [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-2 border-t border-hairline px-3 py-2.5">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas py-1 pl-2.5 pr-1 text-[12.5px] font-semibold text-ink-soft"
            >
              <span className="max-w-[180px] truncate">{file.name}</span>
              <span className="text-ink-faint">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="rounded p-1 text-ink-faint transition-colors hover:bg-white hover:text-red-600"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-3 py-2.5">
        <VoiceRecorder value={voice} onChange={setVoice} disabled={isSending} />

        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-navy-900 px-4 text-[13.5px] font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden />
          )}
          Send
        </button>
      </div>
    </div>
  );
};

export default Composer;
