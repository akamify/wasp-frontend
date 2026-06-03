import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { Button } from "@components/ui/Button";
import { X } from "lucide-react";
import { buildErrorViewModel, fmtDate } from "./apiReports.utils";

type Props = {
  open: boolean;
  detailBusy: boolean;
  detail: any;
  onClose: () => void;
};

export function ApiReportDetailModal({ open, detailBusy, detail, onClose }: Props) {
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] overflow-y-auto bg-slate-900/40 backdrop-blur-sm p-4 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="mx-auto my-16 w-full max-w-3xl overflow-hidden rounded-[5px] bg-white shadow-2xl ring-1 ring-black/10"
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Message Details</div>
                <div className="mt-1 text-lg font-black text-slate-900">{detail?.phone || "—"}</div>
              </div>
              <Button variant="ghost" onClick={onClose}>
                <X size={18} />
              </Button>
            </div>

            <div className="px-6 py-6 space-y-4">
              {detailBusy ? (
                <div className="h-32 rounded bg-slate-50" />
              ) : detail ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[5px] bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campaign</div>
                      <div className="mt-1 font-bold text-slate-900" title={detail?.campaign?.name || ""}>
                        {detail?.campaign?.name || "—"}
                      </div>
                      <div className="mt-1 text-xs font-bold text-slate-900">{fmtDate(detail.createdAt)}</div>
                      <div className="mt-1 text-md font-black text-slate-900">{String(detail.status || "—").toUpperCase()}</div>
                    </div>
                    <div className="rounded-[5px] bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template</div>
                      <div className="mt-1 font-bold text-slate-900" title={detail?.template?.name || ""}>
                        {detail?.template?.name || "—"}
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-600">{detail?.template?.category || "—"}</div>
                    </div>
                  </div>

                  {detail.error ? (
                    (() => {
                      const errorView = buildErrorViewModel(detail.error);
                      return (
                        <div className="rounded-[5px] bg-rose-50 p-4 ring-1 ring-rose-200 space-y-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-rose-700">Delivery Error</div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-rose-600">What happened</div>
                            <div className="mt-1 text-sm font-semibold text-rose-900">{errorView.message}</div>
                          </div>
                          {errorView.code ? (
                            <div>
                              <div className="text-xs font-black uppercase tracking-widest text-rose-600">Provider Code</div>
                              <div className="mt-1 text-sm font-semibold text-rose-900">{errorView.code}</div>
                            </div>
                          ) : null}
                          {errorView.traceId ? (
                            <div>
                              <div className="text-xs font-black uppercase tracking-widest text-rose-600">Trace ID</div>
                              <div className="mt-1 text-sm font-mono text-rose-900 break-all">{errorView.traceId}</div>
                            </div>
                          ) : null}
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-rose-600">What to check</div>
                            <div className="mt-1 text-sm font-semibold text-rose-900">{errorView.guidance}</div>
                          </div>
                        </div>
                      );
                    })()
                  ) : null}
                </>
              ) : (
                <div className="text-sm font-semibold text-slate-600">No details available.</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
