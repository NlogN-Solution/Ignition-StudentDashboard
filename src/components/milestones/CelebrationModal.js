import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Award, PartyPopper, Stamp, X } from "lucide-react";

/**
 * The moment the offer arrives.
 *
 * This is the emotional high point of the product and it deserves more than a
 * toast. It is also the easiest thing in the brief to get wrong in two
 * opposite directions, so:
 *
 * - **It fires once.** Acknowledgement is a server-side `seen_at` on the
 *   milestone, not a localStorage flag — so it does not reappear on another
 *   device and cannot be lost by clearing site data. The notification behind
 *   it survives, so a student who dismisses this can still find the offer.
 * - **It fills the screen, briefly.** Confetti falls across the whole
 *   viewport for a few seconds — the offer is the moment of the journey and a
 *   burst inside a small card undersold it — while the card itself stays calm:
 *   no sound, no bouncing type. A CAS gets the same card with the confetti
 *   off, because it is good news of a quieter kind.
 *
 * ## Portal
 *
 * Rendered into `document.body`, not where it is mounted. The app shell's
 * content column is its own stacking context (it sits above the background
 * wash), so a `fixed` overlay rendered inside it would sit *under* the header
 * and sidebar however high its z-index.
 *
 * ## Reduced motion
 *
 * `prefers-reduced-motion` suppresses the confetti entirely rather than
 * shortening it. Someone who asked for less motion asked for less motion; the
 * card, the words and the action are the content and they all remain.
 *
 * ## Canvas, not DOM
 *
 * Ninety particles as absolutely-positioned divs is ninety layers for the
 * compositor and a visible stutter on a mid-range phone. One canvas is one
 * layer, and it is discarded the instant it finishes.
 */

const KINDS = {
  offer_received: {
    icon: PartyPopper,
    eyebrow: "Offer received",
    confetti: true,
    title: (name) => `Congratulations${name ? `, ${name}` : ""}!`,
    body: ({ universityName, programName }) =>
      `${universityName ?? "The university"} has made you an offer${
        programName ? ` for ${programName}` : ""
      }.`,
    action: "View your offer",
  },
  cas_received: {
    icon: Stamp,
    eyebrow: "CAS received",
    confetti: false,
    title: () => "Your CAS has arrived",
    body: ({ universityName, programName }) =>
      `${universityName ?? "The university"} has issued your CAS${
        programName ? ` for ${programName}` : ""
      }. You need it to apply for your visa.`,
    action: "View your CAS",
  },
  visa_approved: {
    icon: Award,
    eyebrow: "Visa approved",
    confetti: true,
    title: () => "Your visa is approved",
    body: ({ universityName }) =>
      `You are cleared to travel${universityName ? ` and study at ${universityName}` : ""}.`,
    action: "See what is next",
  },
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const Confetti = ({ active }) => {
  const canvas = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    const node = canvas.current;
    if (!node) return undefined;

    const context = node.getContext("2d");
    const { width, height } = node.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    node.width = width * ratio;
    node.height = height * ratio;
    context.scale(ratio, ratio);

    // Ignition's own palette. Rainbow confetti belongs to a different product.
    const colours = ["#FF5A1F", "#01166f", "#01166f", "#FFC5A3", "#01166f"];
    // Scaled to the screen, so a phone is not buried and a monitor is not bare.
    const count = Math.round(Math.min(260, Math.max(120, (width * height) / 9000)));
    const pieces = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.9,
      size: 5 + Math.random() * 6,
      speed: 2 + Math.random() * 3.2,
      drift: (Math.random() - 0.5) * 1.1,
      spin: (Math.random() - 0.5) * 0.22,
      angle: Math.random() * Math.PI,
      colour: colours[Math.floor(Math.random() * colours.length)],
    }));

    let frame;
    const started = performance.now();
    const DURATION = 4200;

    const draw = (now) => {
      const elapsed = now - started;
      context.clearRect(0, 0, width, height);
      // Fade over the last third rather than vanishing mid-air.
      context.globalAlpha = Math.max(0, Math.min(1, (DURATION - elapsed) / (DURATION / 3)));

      for (const piece of pieces) {
        piece.y += piece.speed;
        piece.x += piece.drift;
        piece.angle += piece.spin;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.colour;
        context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
        context.restore();
      }

      if (elapsed < DURATION) frame = requestAnimationFrame(draw);
      else context.clearRect(0, 0, width, height);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  if (!active) return null;
  // The whole viewport, above the dimmed page and the card alike.
  return <canvas ref={canvas} aria-hidden className="pointer-events-none fixed inset-0 z-[130] h-full w-full" />;
};

const CelebrationModal = ({ milestone, studentName, onDismiss }) => {
  const navigate = useNavigate();
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const [reduceMotion] = useState(prefersReducedMotion);

  const kind = KINDS[milestone?.kind];

  // Focus on open, restore on close, trap Tab inside. A modal that leaves
  // focus behind it is unusable with a keyboard.
  useEffect(() => {
    if (!kind) return undefined;
    const previous = document.activeElement;
    closeButton.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialog.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [kind, onDismiss]);

  const copy = useMemo(() => {
    if (!kind) return null;
    return { title: kind.title(studentName), body: kind.body(milestone) };
  }, [kind, milestone, studentName]);

  if (!kind || !copy) return null;
  const Icon = kind.icon;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-navy-900/55 p-4 backdrop-blur-[3px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebration-title"
        className="relative w-full max-w-[460px] overflow-hidden rounded-2xl border border-hairline bg-white shadow-float"
      >
        <button
          ref={closeButton}
          type="button"
          onClick={onDismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-ink-faint transition-colors hover:bg-canvas hover:text-navy-900"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="relative px-7 pb-7 pt-9 text-center">
          <span
            aria-hidden
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ignite-50 text-ignite-600"
          >
            <Icon className="h-7 w-7" />
          </span>

          {/* The state is words, not only a colour — a coloured badge alone
              says nothing to a screen reader or to anyone who cannot see it. */}
          <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.1em] text-ignite-700">
            {kind.eyebrow}
          </p>
          <h2
            id="celebration-title"
            className="mt-2 text-[26px] font-extrabold leading-[1.15] tracking-[-0.025em] text-navy-900"
          >
            {copy.title}
          </h2>
          <p className="mx-auto mt-3 max-w-[38ch] text-[15px] font-medium leading-[1.6] text-ink-muted">
            {copy.body}
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                onDismiss();
                navigate(`/applications/${milestone.applicationId}`);
              }}
              className="inline-flex h-[46px] w-full items-center justify-center rounded-xl bg-navy-900 text-[15px] font-semibold text-white transition-colors hover:bg-navy-800"
            >
              {kind.action}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex h-[42px] w-full items-center justify-center rounded-xl text-[14.5px] font-semibold text-ink-muted transition-colors hover:bg-canvas hover:text-navy-900"
            >
              Later
            </button>
          </div>
        </div>
      </div>
      <Confetti active={kind.confetti && !reduceMotion} />
    </div>,
    document.body
  );
};

export default CelebrationModal;
