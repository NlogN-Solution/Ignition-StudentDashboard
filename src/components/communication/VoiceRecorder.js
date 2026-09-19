import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";

/**
 * A voice note, recorded in the browser.
 *
 * `MediaRecorder` with no library. The only real complexity is that the
 * container format is not the same everywhere — Chromium and Firefox produce
 * `audio/webm`, Safari produces `audio/mp4` — so the type is asked for rather
 * than assumed, and both are on the backend's allowlist. Picking one would
 * have meant voice notes silently failing for half the users.
 *
 * Renders nothing at all where the API is missing. A disabled microphone
 * button that can never work is worse than no button: it reads as broken
 * rather than unavailable.
 */

const CANDIDATE_TYPES = ["audio/webm", "audio/mp4", "audio/ogg"];

const supportedType = () => {
  if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") return null;
  return CANDIDATE_TYPES.find((type) => window.MediaRecorder.isTypeSupported?.(type)) ?? "";
};

const formatDuration = (seconds) => {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

const VoiceRecorder = ({ value, onChange, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const recorder = useRef(null);
  const chunks = useRef([]);
  const startedAt = useRef(0);
  const ticker = useRef(null);

  // Stop the microphone if the composer unmounts mid-recording. Leaving a
  // track live keeps the browser's recording indicator on, which is alarming
  // and entirely our fault.
  useEffect(
    () => () => {
      if (ticker.current) clearInterval(ticker.current);
      recorder.current?.stream?.getTracks?.().forEach((track) => track.stop());
    },
    []
  );

  const mimeType = supportedType();
  if (mimeType === null) return null;

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const instance = new window.MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunks.current = [];
      instance.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      instance.onstop = () => {
        const type = instance.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        onChange({
          blob,
          name: `voice-note.${extension}`,
          durationSeconds: (Date.now() - startedAt.current) / 1000,
          url: URL.createObjectURL(blob),
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      instance.start();
      recorder.current = instance;
      startedAt.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      ticker.current = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 250);
    } catch {
      // Denied, or no microphone. Say so plainly rather than failing silently.
      setError("We could not reach your microphone.");
    }
  };

  const stop = () => {
    if (ticker.current) clearInterval(ticker.current);
    recorder.current?.stop();
    setIsRecording(false);
  };

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- a voice note
            recorded by the sender has no transcript to caption it with. */}
        <audio src={value.url} controls className="h-8 max-w-[220px]" />
        <span className="text-[12.5px] font-semibold tabular-nums text-ink-muted">
          {formatDuration(value.durationSeconds)}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Discard voice note"
          className="ml-auto rounded-md p-1.5 text-ink-faint transition-colors hover:bg-white hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={isRecording ? stop : start}
        disabled={disabled}
        aria-label={isRecording ? "Stop recording" : "Record a voice note"}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
          isRecording
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-ring-idle bg-white text-ink-soft hover:border-nav/40 hover:bg-navy-50 hover:text-navy-900"
        }`}
      >
        {isRecording ? (
          <>
            <Square className="h-3.5 w-3.5" aria-hidden />
            <span className="tabular-nums">{formatDuration(elapsed)}</span>
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" aria-hidden />
            Voice note
          </>
        )}
      </button>
      {error ? <p className="mt-1 text-[12.5px] font-medium text-red-600">{error}</p> : null}
    </div>
  );
};

export default VoiceRecorder;
