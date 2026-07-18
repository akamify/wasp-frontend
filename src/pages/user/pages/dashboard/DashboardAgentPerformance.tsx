import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { formatCurrencySafe } from "@shared/config/currency";

const formatCurrency = (value: number) => formatCurrencySafe(Number(value || 0), "INR");

export function DashboardAgentPerformance({ agents }: { agents: any[] }) {
  const rows = Array.isArray(agents) ? agents.slice(0, 5) : [];

  return (
    <Card className="rounded-[5px] border-ink-900/5 p-6 shadow-xl shadow-ink-900/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Agent Analytics</div>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Conversion Leaderboard</h3>
        </div>
        <Badge tone="neutral" className="border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
          Top performers
        </Badge>
      </div>

      <div className="mt-5 overflow-hidden rounded-[5px] border border-slate-100">
        {rows.length ? (
          <div className="divide-y divide-slate-100">
            {rows.map((agent) => (
              <div key={String(agent?.id || agent?.name)} className="grid gap-3 px-4 py-3 md:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))] md:items-center">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-slate-900">{agent?.name || "Agent"}</div>
                </div>
                <MetaStat label="Assigned" value={Number(agent?.assignedConversations || 0).toLocaleString()} />
                <MetaStat label="Handled" value={Number(agent?.handledChats || 0).toLocaleString()} />
                <MetaStat label="Converted" value={Number(agent?.conversionCount || 0).toLocaleString()} />
                <MetaStat label="Revenue" value={formatCurrency(Number(agent?.generatedRevenue || 0))} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-10 text-center text-sm font-medium text-slate-500">No agent analytics available yet.</div>
        )}
      </div>
    </Card>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}
