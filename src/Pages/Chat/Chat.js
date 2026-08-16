import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import { useAppData } from "../../context/AppDataContext";
import { getMessagesApi, markAllMessagesReadApi, sendMessageApi } from "../../api/studentPortal";
import { formatDateTime } from "../../lib/simulate";

const POLL_INTERVAL_MS = 8000;

const Chat = () => {
  const { refetchMessages } = useAppData();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const { items, unreadCount } = await getMessagesApi();
      setMessages(items);
      if (unreadCount > 0) {
        await markAllMessagesReadApi().catch(() => {});
        // The sidebar badge polls independently — clear it the moment this
        // page has actually marked the messages read, instead of waiting up
        // to 15s for the next background poll.
        refetchMessages();
      }
    } catch {
      // best-effort — keep whatever was already loaded
    }
  };

  useEffect(() => {
    let cancelled = false;
    load().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);
    setDraft("");
    try {
      const message = await sendMessageApi(body);
      setMessages((current) => [...current, message]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-9 pb-12">
      <PageHeader
        icon={MessageCircle}
        title="Messages"
        description="Message our support team directly — a counsellor will reply here."
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[65vh]">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-12">
                No messages yet — send a note below and our team will get back to you.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromStudent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] min-w-0 rounded-2xl px-4 py-2 break-words ${
                      message.isFromStudent
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}
                  >
                    {!message.isFromStudent && message.senderName && (
                      <p className="text-xs font-medium text-blue-600 mb-1">{message.senderName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        message.isFromStudent ? "text-blue-100" : "text-gray-400"
                      }`}
                    >
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-100 p-4 flex items-center gap-3">
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a message…"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Chat;
