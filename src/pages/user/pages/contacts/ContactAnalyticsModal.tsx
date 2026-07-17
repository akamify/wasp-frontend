import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { BarChart3, MousePointerClick, Receipt, Sparkles, X } from "lucide-react";

type AnalyticsData = {
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    lastActivity?: string | null;
    messagesReceived?: number;
    messagesSent?: number;
    clickedCount?: number;
    purchaseHistory?: {
      purchaseCount?: number;
      totalRevenue?: number;
      lastConversionAt?: string | null;
    };
    profile?: {
      interest?: string[];
      engagementScore?: number;
      behaviour?: string[];
    };
    recentEvents?: Array<{
      eventName?: string;
      value?: number;
      currency?: string;
      source?: string;
      timestamp?: string;
      metadata?: Record<string, unknown>;
    }>;
  };
};

type Props = {
  open: boolean;
  loading: boolean;
  error: string | null;
  data: AnalyticsData | null;
  onClose: () => void;
};

const formatCurrency = (value: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export function ContactAnalyticsModal({ open, loading, error, data, onClose }: Props) {
  const customer = data?.customer;
  const purchaseHistory = customer?.purchaseHistory || {};
  const profile = customer?.profile || {};
  const recentEvents = Array.isArray(customer?.recentEvents) ? customer.recentEvents : [];

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.97 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.24em] text-brand-600">Customer Analytics</div>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                  {customer?.name || customer?.phone || "Customer"}
                </h2>
              </div>
              <button type="button" onClick={onClose} className="rounded-[5px] p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-900">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-5 md:p-6">
              {error ? <Alert tone="error">{error}</Alert> : null}
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-28 animate-pulse rounded-[5px] bg-slate-100" />
                  ))}
                </div>
              ) : customer ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard icon={BarChart3} label="Messages Sent" value={Number(customer.messagesSent || 0).toLocaleString()} tone="cyan" />
                    <MetricCard icon={Sparkles} label="Messages Received" value={Number(customer.messagesReceived || 0).toLocaleString()} tone="violet" />
                    <MetricCard icon={MousePointerClick} label="Clicked" value={Number(customer.clickedCount || 0).toLocaleString()} tone="amber" />
                    <MetricCard icon={Receipt} label="Revenue" value={formatCurrency(Number(purchaseHistory.totalRevenue || 0))} tone="emerald" />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-[5px] border border-slate-100 p-5 shadow-none">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Behavior Snapshot</div>
                          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                            {Number(profile.engagementScore || 0)}
                            <span className="ml-2 text-sm font-bold text-slate-400">/100 score</span>
                          </div>
                        </div>
                        <div className="rounded-[5px] bg-brand-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-brand-700">
                          Last active {customer.lastActivity ? new Date(customer.lastActivity).toLocaleString() : "N/A"}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Interests</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(profile.interest || []).length ? (
                              (profile.interest || []).map((item) => (
                                <Badge key={item} tone="neutral" className="border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-brand-700">
                                  {item}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm font-medium text-slate-500">No strong interests detected yet.</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-slate-500">Behaviour Signals</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(profile.behaviour || []).length ? (
                              (profile.behaviour || []).map((item) => (
                                <Badge key={item} tone="neutral" className="border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
                                  {item.replace(/_/g, " ")}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm font-medium text-slate-500">No behaviour sequence available yet.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="rounded-[5px] border border-slate-100 p-5 shadow-none">
                      <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Purchase History</div>
                      <div className="mt-4 space-y-4">
                        <Row label="Purchase Count" value={Number(purchaseHistory.purchaseCount || 0).toLocaleString()} />
                        <Row label="Attributed Revenue" value={formatCurrency(Number(purchaseHistory.totalRevenue || 0))} />
                        <Row label="Last Conversion" value={purchaseHistory.lastConversionAt ? new Date(purchaseHistory.lastConversionAt).toLocaleString() : "No conversion yet"} />
                      </div>
                    </Card>
                  </div>

                  <Card className="rounded-[5px] border border-slate-100 p-5 shadow-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Recent Events</div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">Pixel and server-side conversion activity linked to this customer.</div>
                      </div>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-[5px] border border-slate-100">
                      {recentEvents.length ? (
                        <div className="divide-y divide-slate-100">
                          {recentEvents.map((event, index) => (
                            <div key={`${event.eventName || "event"}-${event.timestamp || index}`} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                              <div className="min-w-0">
                                <div className="text-sm font-black uppercase tracking-wide text-slate-900">{event.eventName || "event"}</div>
                                <div className="mt-1 text-xs font-medium text-slate-500">
                                  {event.source || "unknown"} · {event.timestamp ? new Date(event.timestamp).toLocaleString() : "No timestamp"}
                                </div>
                              </div>
                              <div className="text-sm font-bold text-slate-700">{event.value ? formatCurrency(Number(event.value || 0), String(event.currency || "INR")) : "-"}</div>
                              <div className="text-xs font-semibold text-slate-500">{Object.keys(event.metadata || {}).length} meta fields</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-10 text-center text-sm font-medium text-slate-500">No tracked events found for this customer yet.</div>
                      )}
                    </div>
                  </Card>

                  <div className="flex justify-end">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                  </div>
                </div>
              ) : (
                <Alert tone="warn">Customer analytics are not available yet.</Alert>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function MetricCard({ icon: Icon, label, value, tone }: { icon: typeof BarChart3; label: string; value: string; tone: "cyan" | "violet" | "amber" | "emerald" }) {
  const tones = {
    cyan: "bg-cyan-50 text-cyan-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <Card className="rounded-[5px] border border-slate-100 p-4 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</div>
        </div>
        <div className={`rounded-[5px] p-3 ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[5px] bg-slate-50 px-3 py-3">
      <div className="text-xs font-black uppercase tracking-widest text-slate-500">{label}</div>
      <div className="text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}
