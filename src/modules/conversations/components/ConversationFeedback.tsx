import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Props = {
  error: string | null;
  ok: string | null;
  onClear: () => void;
};

export function ConversationFeedback({ error, ok, onClear }: Props) {
  return (
    <AnimatePresence>
      {(error || ok) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-16 right-4 z-[9999] w-[calc(100vw-2rem)] md:bottom-6 md:right-6 md:w-auto md:min-w-[320px] md:max-w-md"
        >
          <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-2xl", error ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600")}>
            {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-bold leading-snug">{error || ok}</span>
            <button onClick={onClear} className="shrink-0 rounded-lg p-1 text-black/20 transition-colors hover:bg-black/5 hover:text-black"><X size={14} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

