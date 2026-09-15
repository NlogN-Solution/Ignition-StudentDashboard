import React, { useEffect, useRef, useState } from "react";
import { Check, FlaskConical, Loader2, Lock, X } from "lucide-react";

import { checkoutAccess } from "../../api/access";

/**
 * The paywall, at the moment it is relevant.
 *
 * It appears when a student presses "View offer letter" and has not unlocked —
 * not on arrival, not as a banner, not before there is anything to buy. That
 * placement is the whole design: the fee is easy to explain when there is an
 * offer sitting behind it and impossible to explain before.
 *
 * ## What it is honest about
 *
 * - The price comes from the server (`portal_access_fees`), never a constant
 *   here, which is also why a caller cannot name their own amount.
 * - It says **one-time**, because it is. A second offer, and the CAS, are
 *   covered — and that is the first question anyone asks.
 * - Features that do not exist yet are listed as "Coming soon" rather than
 *   sold. Taking money for a promise and a placeholder screen is the one
 *   thing this must not do.
 * - While no gateway is configured it says so, plainly, on the button. A
 *   student in a demo should never wonder whether they were charged.
 *
 * Dismissing changes nothing. The offer stays visible and locked; nothing is
 * taken away for saying "not now".
 */

const INCLUDED = [
  { label: "Your offer letter — open and download", available: true },
  { label: "Your CAS letter, when it arrives", available: true },
  { label: "Every future offer, at no extra cost", available: true },
  { label: "Interview preparation", available: false },
  { label: "Visa document tracking", available: false },
];

const METHOD_LABELS = {
  esewa: "eSewa",
  khalti: "Khalti",
  credit_card: "Card",
  debit_card: "Card",
};

const formatFee = (fee) => {
  if (!fee) return null;
  // `NPR 5,000`, not a currency symbol: NPR has no widely-recognised glyph and
  // `Rs` is ambiguous across several currencies.
  return `${fee.currency} ${Number(fee.amount).toLocaleString()}`;
};

const UnlockModal = ({ access, onClose, onUnlocked }) => {
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeButton.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
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
  }, [onClose]);

  const fee = formatFee(access?.fee);
  const method = access?.methods?.[0] ?? "esewa";

  const pay = async () => {
    setIsPaying(true);
    setError(null);
    try {
      await checkoutAccess(method);
      onUnlocked();
    } catch (caught) {
      setError(
        caught?.data?.detail ??
          "We could not complete that. Please try again, or contact Ignition."
      );
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-navy-900/55 p-4 backdrop-blur-[2px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-title"
        className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-hairline bg-white shadow-float"
      >
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-lg p-2 text-ink-faint transition-colors hover:bg-canvas hover:text-navy-900"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="px-7 pb-7 pt-9">
          <span
            aria-hidden
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-700"
          >
            <Lock className="h-6 w-6" />
          </span>

          <h2
            id="unlock-title"
            className="mt-4 text-[23px] font-extrabold leading-[1.2] tracking-[-0.02em] text-navy-900"
          >
            Your offer is ready
          </h2>
          <p className="mt-2 text-[15px] font-medium leading-[1.6] text-ink-muted">
            Unlock your Ignition application package to open it. One payment, for your whole
            journey — every offer, your CAS, and the tools that go with them.
          </p>

          <ul className="mt-5 space-y-2.5">
            {INCLUDED.map((item) => (
              <li key={item.label} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className={`mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    item.available ? "bg-green-100 text-green-700" : "bg-navy-50 text-ink-faint"
                  }`}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
                <span className="text-[14.5px] font-medium leading-[1.5] text-ink-soft">
                  {item.label}
                  {!item.available && (
                    <span className="ml-1.5 rounded-full bg-navy-50 px-2 py-0.5 text-[11.5px] font-bold text-ink-faint">
                      Coming soon
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {fee ? (
            <div className="mt-6 rounded-xl border border-hairline bg-canvas px-4 py-3.5">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-faint">
                One-time fee
              </p>
              <p className="mt-0.5 text-[24px] font-extrabold tabular-nums tracking-[-0.02em] text-navy-900">
                {fee}
              </p>
              {access.fee.isDefault ? (
                <p className="mt-1 text-[12.5px] font-medium text-ink-muted">
                  Standard rate. Your counsellor can confirm the price for your country.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-ignite-200 bg-ignite-50 px-4 py-3 text-[13.5px] font-medium text-ignite-700">
              We could not work out the fee for your country. Contact Ignition and they will sort it
              out with you.
            </p>
          )}

          {access?.simulated ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-blue-bright/20 bg-blue-bright/[0.06] px-4 py-3 text-[13px] font-medium leading-[1.5] text-ink-soft">
              <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-bright" aria-hidden />
              {/* Said out loud. A student in a demo must never wonder whether
                  they were actually charged. */}
              Test mode — no payment gateway is connected yet, so no money will move and nothing
              will be charged to you.
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-[13.5px] font-medium text-red-700">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={pay}
              disabled={isPaying || !fee}
              className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-navy-900 text-[15px] font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
            >
              {isPaying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {access?.simulated
                ? `Complete test payment${fee ? ` · ${fee}` : ""}`
                : `Unlock for ${fee ?? "—"}${METHOD_LABELS[method] ? ` with ${METHOD_LABELS[method]}` : ""}`}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-[42px] w-full items-center justify-center rounded-xl text-[14.5px] font-semibold text-ink-muted transition-colors hover:bg-canvas hover:text-navy-900"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockModal;
