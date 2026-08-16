import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

// Success / error feedback shown after a simulated local update completes.
// Purely presentational — it holds a short-lived list in state and nothing else.

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const TONE_ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, tone = "success") => {
      toastId += 1;
      const id = toastId;
      setToasts((current) => [...current, { id, message, tone }]);
      setTimeout(() => dismissToast(id), 3500);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = TONE_ICONS[toast.tone] ?? Info;
          return (
            <div
              key={toast.id}
              role="status"
              className={`flex items-start gap-3 min-w-[18rem] max-w-sm px-4 py-3 rounded-lg border shadow-lg
                ${TONE_STYLES[toast.tone] ?? TONE_STYLES.info}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-current/60 hover:text-current"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a ToastProvider");
  }
  return context;
};

export default ToastContext;
