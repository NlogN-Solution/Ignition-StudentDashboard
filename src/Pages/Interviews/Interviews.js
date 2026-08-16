import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Lightbulb,
  Mic,
  RotateCcw,
  Square,
  Target,
  TrendingUp,
  Trash2,
  Video,
  X,
} from "lucide-react";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useAppData } from "../../context/AppDataContext";
import { useToast } from "../../context/ToastContext";
import { getInterviewTypesApi } from "../../api/studentPortal";
import { getFeedbackForScore } from "../../data";
import { formatDateTime } from "../../lib/simulate";

const ACCENT_STYLES = {
  blue: { chip: "bg-blue-50 text-blue-600", bar: "bg-blue-500", ring: "border-blue-200" },
  purple: { chip: "bg-purple-50 text-purple-600", bar: "bg-purple-500", ring: "border-purple-200" },
  green: { chip: "bg-green-50 text-green-600", bar: "bg-green-500", ring: "border-green-200" },
};

const TONE_STYLES = {
  green: "bg-green-50 border-green-200 text-green-700",
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  orange: "bg-orange-50 border-orange-200 text-orange-700",
  red: "bg-red-50 border-red-200 text-red-700",
};

const RECORDING_MAX_SECONDS = 180;

const revokeRecordings = (answers) => {
  Object.values(answers).forEach((answer) => {
    if (answer?.mode === "recording" && answer.url) URL.revokeObjectURL(answer.url);
  });
};

/**
 * Records a video or audio answer straight from the browser (getUserMedia +
 * MediaRecorder) and hands the resulting local Blob URL back to the parent —
 * nothing is uploaded anywhere, and no speech-to-text or model call happens.
 */
const AnswerRecorder = ({ answer, onCaptured, onDelete }) => {
  const [kind, setKind] = useState(answer?.kind ?? "video");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef(null);

  const supported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined";

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // Release the camera/mic if the question changes (or the panel unmounts)
  // while a recording is still in progress.
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      stopStream();
    };
  }, []);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "video" ? { video: true, audio: true } : { audio: true }
      );
      streamRef.current = stream;
      if (kind === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        stopStream();
        onCaptured({ mode: "recording", kind, url, sizeBytes: blob.size, durationSec });
      };

      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec((current) => {
          const next = current + 1;
          if (next >= RECORDING_MAX_SECONDS) recorderRef.current?.stop();
          return next;
        });
      }, 1000);
    } catch (err) {
      setError("Camera/microphone access was denied or isn't available.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
    clearInterval(timerRef.current);
  };

  if (!supported) {
    return (
      <p className="text-sm text-gray-500 p-4 border border-dashed border-gray-200 rounded-lg">
        Recording isn't supported in this browser. Use "Type answer" instead.
      </p>
    );
  }

  if (answer?.url && !isRecording) {
    return (
      <div className="space-y-3">
        {answer.kind === "video" ? (
          <video src={answer.url} controls className="w-full rounded-lg bg-black max-h-80" />
        ) : (
          <audio src={answer.url} controls className="w-full" />
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{answer.durationSec}s recorded</span>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Re-record
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isRecording}
          onClick={() => setKind("video")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50 ${
            kind === "video"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Video
        </button>
        <button
          type="button"
          disabled={isRecording}
          onClick={() => setKind("audio")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-50 ${
            kind === "audio"
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "text-gray-600 border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          Audio only
        </button>
      </div>

      {kind === "video" && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full rounded-lg bg-gray-900 max-h-80 [transform:scaleX(-1)]"
        />
      )}

      <div className="flex items-center gap-3">
        {isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-all duration-300"
          >
            <Square className="w-4 h-4" />
            Stop ({elapsedSec}s)
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
          >
            {kind === "video" ? <Camera className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            Start recording
          </button>
        )}
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording…
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

/**
 * Practice sets come from the real interview-type catalog and the questions
 * a session returns; scoring is the backend's `WordCountScorer` (Phase 6).
 */
const Interviews = () => {
  const { interviewSessions, startInterview, completeInterview, abandonInterview } = useAppData();
  const { showToast } = useToast();

  const [interviewTypes, setInterviewTypes] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getInterviewTypesApi()
      .then((types) => {
        if (!cancelled) setInterviewTypes(types);
      })
      .catch(() => {
        if (!cancelled) showToast("Couldn't load interview practice sets.", "error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [active, setActive] = useState(null); // { session, type, questions }
  const [questionIndex, setQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({}); // questionId -> { mode: "text", text } | { mode: "recording", ... }
  const [viewMode, setViewMode] = useState("text"); // which answer method is showing for the current question
  const [isScoring, setIsScoring] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Revoke any recorded-answer blob URLs still around if the page is left mid-interview.
  const responsesRef = useRef(responses);
  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);
  useEffect(() => () => revokeRecordings(responsesRef.current), []);

  const history = useMemo(
    () =>
      interviewSessions
        .filter((session) => session.status === "completed")
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)),
    [interviewSessions]
  );

  const handleStart = async (type) => {
    if (!type.questions || type.questions.length === 0) {
      showToast("No question set is available for this interview type yet.", "info");
      return;
    }
    revokeRecordings(responses);
    try {
      const session = await startInterview(type.id);
      const questions = session.questions?.length ? session.questions : type.questions;
      setActive({ session, type, questions });
      setQuestionIndex(0);
      setResponses({});
      setViewMode("text");
      setResult(null);
      setError("");
    } catch (err) {
      showToast("Couldn't start the interview. Please try again.", "error");
    }
  };

  const handleExit = () => {
    if (active && !result) {
      abandonInterview(active.session.id);
    }
    revokeRecordings(responses);
    setActive(null);
    setResult(null);
    setQuestionIndex(0);
    setResponses({});
    setError("");
  };

  const currentQuestion = active?.questions[questionIndex];
  const currentAnswer = currentQuestion ? responses[currentQuestion.id] : null;
  const currentText = currentAnswer?.mode === "text" ? currentAnswer.text : "";

  // Show whichever method already has an answer for this question; default to typing.
  useEffect(() => {
    if (!currentQuestion) return;
    setViewMode(currentAnswer?.mode ?? "text");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionIndex]);

  const isAnswered = (question) => {
    const answer = responses[question.id];
    if (!answer) return false;
    if (answer.mode === "text") return answer.text.trim().length >= 20;
    if (answer.mode === "recording") return Boolean(answer.url) && answer.durationSec >= 3;
    return false;
  };

  const unansweredMessage =
    viewMode === "recording"
      ? "Record at least a few seconds before continuing."
      : "Write at least a couple of sentences before continuing.";

  const handleNext = () => {
    if (!isAnswered(currentQuestion)) {
      setError(unansweredMessage);
      return;
    }
    setError("");
    setQuestionIndex((index) => index + 1);
  };

  const handleComplete = async () => {
    if (!isAnswered(currentQuestion)) {
      setError(unansweredMessage.replace("continuing", "finishing"));
      return;
    }
    setError("");
    setIsScoring(true);

    const answers = active.questions.map((question) => {
      const answer = responses[question.id];
      if (answer?.mode === "recording") {
        return {
          questionId: question.id,
          prompt: question.prompt,
          maxScore: question.maxScore,
          mode: "recording",
          response: `[${answer.kind === "video" ? "Video" : "Audio"} answer — ${answer.durationSec}s]`,
          durationSec: answer.durationSec,
        };
      }
      return {
        questionId: question.id,
        prompt: question.prompt,
        maxScore: question.maxScore,
        mode: "text",
        response: answer?.text ?? "",
      };
    });

    const outcome = await completeInterview(active.session.id, answers);
    setIsScoring(false);
    setResult(outcome);
    showToast(`${active.type.name} complete — you scored ${outcome.score}%.`);
  };

  /* ------------------------------------------------------------- results --- */

  if (active && result) {
    const passed = result.score >= active.type.passingScore;
    return (
      <div className="min-h-screen bg-gray-50 mt-9 pb-12">
        <PageHeader
          icon={Bot}
          title={`${active.type.name} — results`}
          description="Scoring and feedback are generated locally from your answers."
          actions={
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md hover:bg-blue-600 transition-all duration-300"
            >
              Back to interviews
              <ChevronRight className="w-5 h-5" />
            </button>
          }
        />

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-8 border-gray-100 mb-4">
              <span className="text-3xl font-bold text-gray-900">{result.score}%</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{result.feedback.band}</p>
            <p className="text-gray-600 mt-2 max-w-xl mx-auto">{result.feedback.summary}</p>
            <div
              className={`inline-flex items-center gap-2 mt-4 px-3 py-1 rounded-full text-sm font-medium ${
                passed ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
              }`}
            >
              <Target className="w-4 h-4" />
              Passing score for this set: {active.type.passingScore}%
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                What went well
              </h3>
              <ul className="space-y-2">
                {result.feedback.strengths.map((item) => (
                  <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                What to work on
              </h3>
              <ul className="space-y-2">
                {result.feedback.improvements.map((item) => (
                  <li key={item} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handleStart(active.type)}
              className="px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4" />
              Try this set again
            </button>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------- in progress --- */

  if (active) {
    const accent = ACCENT_STYLES[active.type.accent] ?? ACCENT_STYLES.blue;
    const isLast = questionIndex === active.questions.length - 1;
    const progress = Math.round((questionIndex / active.questions.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 mt-9 pb-12">
        <PageHeader
          icon={Bot}
          title={active.type.name}
          description={`Question ${questionIndex + 1} of ${active.questions.length}`}
          actions={
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              Exit
            </button>
          }
        />

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${accent.bar}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <motion.div
            key={currentQuestion.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-6 border-b border-gray-100">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${accent.chip}`}>
                Worth {currentQuestion.maxScore} points
              </span>
              <h2 className="text-xl font-semibold text-gray-900 mt-3">
                {currentQuestion.prompt}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("text")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    viewMode === "text"
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-500 border border-transparent hover:bg-gray-50"
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  Type answer
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("recording")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    viewMode === "recording"
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-500 border border-transparent hover:bg-gray-50"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Record answer
                </button>
              </div>

              {viewMode === "text" ? (
                <>
                  <textarea
                    rows="7"
                    value={currentText}
                    onChange={(event) => {
                      setResponses((current) => ({
                        ...current,
                        [currentQuestion.id]: { mode: "text", text: event.target.value },
                      }));
                      setError("");
                    }}
                    placeholder="Type your answer as you would say it out loud…"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      {currentQuestion.hint}
                    </span>
                    <span>{currentText.trim().split(/\s+/).filter(Boolean).length} words</span>
                  </div>
                </>
              ) : (
                <>
                  <AnswerRecorder
                    key={currentQuestion.id}
                    answer={currentAnswer?.mode === "recording" ? currentAnswer : null}
                    onCaptured={(answerObj) => {
                      setResponses((current) => ({ ...current, [currentQuestion.id]: answerObj }));
                      setError("");
                    }}
                    onDelete={() => {
                      if (currentAnswer?.url) URL.revokeObjectURL(currentAnswer.url);
                      setResponses((current) => {
                        const next = { ...current };
                        delete next[currentQuestion.id];
                        return next;
                      });
                    }}
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    {currentQuestion.hint}
                  </p>
                </>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>

            <div className="px-6 pb-6 flex items-center justify-between">
              <button
                type="button"
                disabled={questionIndex === 0}
                onClick={() => setQuestionIndex((index) => index - 1)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-all duration-300 disabled:opacity-40 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isScoring}
                  className="px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white transition-all duration-300 disabled:opacity-60"
                >
                  {isScoring ? "Scoring…" : "Finish & see score"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ------------------------------------------------------------- landing --- */

  return (
    <div className="min-h-screen bg-gray-50 mt-9 pb-12">
      <PageHeader
        icon={Bot}
        title="AI Interview Practice"
        description="Rehearse admission and visa interviews, then review your score and feedback."
      />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose a practice set</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {interviewTypes.map((type, index) => {
              const accent = ACCENT_STYLES[type.accent] ?? ACCENT_STYLES.blue;
              return (
                <motion.div
                  key={type.id}
                  className={`p-6 bg-white rounded-xl shadow-sm border ${accent.ring} hover:shadow-lg transition-all duration-300 flex flex-col`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <span className={`self-start px-2 py-1 rounded-full text-xs font-medium ${accent.chip}`}>
                    {type.questionCount} questions · {type.durationMinutes} min
                  </span>
                  <h3 className="text-lg font-semibold text-gray-900 mt-3">{type.name}</h3>
                  <p className="text-sm text-gray-600 mt-2 flex-1">{type.description}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Passing score: {type.passingScore}%
                  </p>
                  <button
                    type="button"
                    onClick={() => handleStart(type)}
                    className="mt-4 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300"
                  >
                    Start interview
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past attempts</h2>
          {history.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="No practice attempts yet"
              description="Finish a set and your score and feedback will be archived here."
            />
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {history.map((session) => {
                const feedback = getFeedbackForScore(session.score);
                return (
                  <div
                    key={session.id}
                    className="p-5 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{session.typeName}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(session.completedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium border ${
                          TONE_STYLES[feedback.tone] ?? TONE_STYLES.blue
                        }`}
                      >
                        {feedback.band}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">{session.score}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Interviews;
