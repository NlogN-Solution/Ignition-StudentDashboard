import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, MailOpen, PenLine, Search, X } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { SkeletonList } from "../../components/common/Skeleton";
import Composer from "../../components/communication/Composer";
import MessageTimeline from "../../components/communication/MessageTimeline";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import {
  getAttachmentLink,
  getMyThreads,
  getThread,
  replyToThread,
  startThread,
} from "../../api/communication";
import { navigateTab, openBlankTab } from "../../lib/documentFile";
import { formatRelativeTime } from "../../lib/simulate";

/**
 * The student's mailbox.
 *
 * ## What this replaces
 *
 * One implicit conversation per student, rendered as chat bubbles, with a
 * WhatsApp button beside it. Three problems with that: a single unsubjected
 * stream is unsearchable the moment it is more than a screen long, an
 * important instruction about documents looked identical to "hi", and pushing
 * students onto WhatsApp moved the record of what was agreed somewhere the
 * application cannot see.
 *
 * So: threads with subjects, laid out as correspondence. Left, the list; right,
 * the conversation; below, a composer that takes rich text, files and a voice
 * note. It reads like professional application correspondence because that is
 * what it is — and unlike a chat, it is still legible in six weeks when the
 * student is checking what the university actually asked for.
 *
 * ## Continuity
 *
 * The threads listed here include anything written while this person was still
 * a lead, resolved server-side through `leads.converted_user_id`. Nothing in
 * this component knows about that, which is the point — continuity is a
 * property of the query, not of the screen.
 *
 * `?thread=` selects one, so a notification can link straight to it.
 */

const POLL_INTERVAL_MS = 20000;

const Chat = () => {
  const { refetchMessages } = useAppData();
  const { showToast } = useToast();
  const [params, setParams] = useSearchParams();

  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [query, setQuery] = useState("");

  const selectedId = params.get("thread");

  const loadThreads = useCallback(async () => {
    try {
      const next = await getMyThreads();
      setThreads(next);
      return next;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadThreads().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    // Polling, not sockets. The brief says to use what is already here rather
    // than adding a realtime dependency, and 20s on a mailbox is the right
    // trade — a reply is not a keystroke.
    const interval = setInterval(loadThreads, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loadThreads]);

  // Opening a thread marks the other side's messages read, so the sidebar
  // badge is refreshed straight after rather than waiting for its own poll.
  useEffect(() => {
    let cancelled = false;
    if (!selectedId) {
      setActive(null);
      return undefined;
    }
    getThread(selectedId)
      .then((thread) => {
        if (cancelled) return;
        setActive(thread);
        refetchMessages();
        loadThreads();
      })
      .catch(() => {
        if (!cancelled) setActive(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, refetchMessages, loadThreads]);

  // Land on the newest conversation rather than an empty right-hand pane.
  useEffect(() => {
    if (!selectedId && !isComposing && threads.length > 0) {
      setParams({ thread: threads[0].id }, { replace: true });
    }
  }, [selectedId, isComposing, threads, setParams]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return threads;
    return threads.filter(
      (thread) =>
        thread.subject.toLowerCase().includes(needle) ||
        (thread.preview ?? "").toLowerCase().includes(needle)
    );
  }, [threads, query]);

  const openAttachment = async (attachment, disposition) => {
    // Opened synchronously then navigated, so the browser attributes the popup
    // to the click. Same reasoning as `lib/documentFile`.
    const target = openBlankTab();
    try {
      const url = await getAttachmentLink(attachment.id, disposition);
      navigateTab(target, url);
    } catch {
      target?.close();
      showToast("Couldn't open that attachment.", "error");
    }
  };

  const handleSend = async ({ body, bodyHtml, files, voice }) => {
    setIsSending(true);
    try {
      if (isComposing) {
        if (!subject.trim()) {
          showToast("Give your message a subject so your counsellor can find it.", "error");
          return;
        }
        const thread = await startThread({ subject: subject.trim(), body, bodyHtml });
        setIsComposing(false);
        setSubject("");
        await loadThreads();
        setParams({ thread: thread.id });
        showToast("Message sent.");
        return;
      }
      await replyToThread(active.id, { body, bodyHtml, files, voice });
      setActive(await getThread(active.id));
      await loadThreads();
      showToast("Reply sent.");
    } catch {
      showToast("Couldn't send that. Please try again.", "error");
    } finally {
      setIsSending(false);
    }
  };

  const startComposing = () => {
    setIsComposing(true);
    setActive(null);
    setParams({}, { replace: true });
  };

  return (
    <div className="min-h-screen pb-12 pt-9">
      <div className="mx-auto max-w-7xl px-4">
        <PageHeader
          icon={Mail}
          title="Messages"
          description="Your correspondence with Ignition — everything asked, answered and agreed, in one place."
          actions={
            <button
              type="button"
              onClick={startComposing}
              className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              <PenLine className="h-4 w-4" aria-hidden />
              New message
            </button>
          }
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          {/* ------------------------------------------------ thread list --- */}
          <aside className="rounded-xl border border-hairline bg-white">
            <div className="border-b border-hairline p-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your messages"
                  aria-label="Search your messages"
                  className="w-full rounded-lg border border-hairline bg-canvas py-2 pl-9 pr-3 text-[14px] font-medium text-ink outline-none transition-colors focus:border-ring-focus focus:bg-white"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-3">
                <SkeletonList count={4} />
              </div>
            ) : visible.length === 0 ? (
              <p className="p-6 text-center text-[13.5px] font-medium text-ink-muted">
                {threads.length === 0
                  ? "No messages yet. Start one and your counsellor will pick it up."
                  : "Nothing matches that search."}
              </p>
            ) : (
              <ul className="max-h-[560px] divide-y divide-hairline overflow-y-auto">
                {visible.map((thread) => {
                  const isActive = thread.id === selectedId;
                  return (
                    <li key={thread.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsComposing(false);
                          setParams({ thread: thread.id });
                        }}
                        aria-current={isActive ? "true" : undefined}
                        className={`flex w-full flex-col gap-1 px-4 py-3.5 text-left transition-colors ${
                          isActive ? "bg-navy-50" : "hover:bg-canvas"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={`min-w-0 truncate text-[14px] ${
                              thread.unreadCount > 0
                                ? "font-extrabold text-navy-900"
                                : "font-semibold text-ink-soft"
                            }`}
                          >
                            {thread.subject}
                          </span>
                          {thread.unreadCount > 0 ? (
                            <span
                              aria-label={`${thread.unreadCount} unread`}
                              className="shrink-0 rounded-full bg-ignite-600 px-1.5 py-0.5 text-[10.5px] font-bold text-white"
                            >
                              {thread.unreadCount}
                            </span>
                          ) : null}
                        </span>
                        {thread.preview ? (
                          <span className="line-clamp-2 text-[12.5px] font-medium leading-[1.45] text-ink-muted">
                            {thread.preview}
                          </span>
                        ) : null}
                        <span className="text-[11.5px] font-semibold text-ink-faint">
                          {formatRelativeTime(thread.lastMessageAt)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* ---------------------------------------------- conversation --- */}
          <section className="rounded-xl border border-hairline bg-white p-5 sm:p-6">
            {isComposing ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-navy-900">
                    New message
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    aria-label="Cancel"
                    className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-canvas hover:text-navy-900"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                <label htmlFor="thread-subject" className="mt-4 block text-[13px] font-bold text-ink-soft">
                  Subject
                </label>
                <input
                  id="thread-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="What is this about?"
                  className="mt-1.5 w-full rounded-lg border border-hairline bg-canvas px-3.5 py-2.5 text-[14.5px] font-medium text-ink outline-none transition-colors focus:border-ring-focus focus:bg-white"
                />
                <div className="mt-4">
                  <Composer
                    onSend={handleSend}
                    isSending={isSending}
                    placeholder="Write your message…"
                    autoFocus
                  />
                </div>
              </>
            ) : active ? (
              <>
                <h2 className="text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-navy-900">
                  {active.subject}
                </h2>
                <p className="mt-1 text-[13px] font-semibold text-ink-faint">
                  {active.messageCount} {active.messageCount === 1 ? "message" : "messages"}
                </p>

                <div className="mt-5 max-h-[520px] overflow-y-auto pr-1">
                  <MessageTimeline
                    messages={active.messages}
                    onOpenAttachment={openAttachment}
                    viewerIsStudent
                  />
                </div>

                <div className="mt-5">
                  <Composer onSend={handleSend} isSending={isSending} />
                </div>
              </>
            ) : isLoading ? (
              <SkeletonList count={3} />
            ) : (
              <EmptyState
                icon={MailOpen}
                title="Nothing selected"
                description="Pick a conversation on the left, or start a new one."
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Chat;
