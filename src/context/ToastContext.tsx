import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "../utils/cn";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-16 md:bottom-6 right-4 md:right-2 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              layout
              className={cn(
                "pointer-events-auto flex w-[calc(100vw-2rem)] min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl sm:w-auto sm:min-w-[320px] sm:max-w-md",
                t.type === "success" && "bg-emerald-50 border-emerald-100 text-emerald-900",
                t.type === "error" && "bg-rose-50 border-rose-100 text-rose-900",
                t.type === "warning" && "bg-amber-50 border-amber-100 text-amber-900",
                t.type === "info" && "bg-slate-900 border-slate-800 text-white shadow-slate-900/20"
              )}
            >
              <div className="shrink-0">
                {t.type === "success" && <CheckCircle2 size={18} className="text-emerald-500" />}
                {t.type === "error" && <AlertCircle size={18} className="text-rose-500" />}
                {t.type === "warning" && <AlertTriangle size={18} className="text-amber-500" />}
                {t.type === "info" && <Info size={18} className="text-brand-400" />}
              </div>
              
              <p className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-bold leading-snug">{t.message}</p>
              
              <button
                onClick={() => removeToast(t.id)}
                className={cn(
                  "shrink-0 p-1 rounded-lg transition-colors",
                  t.type === "info" ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-black/5 text-black/20 hover:text-black"
                )}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
