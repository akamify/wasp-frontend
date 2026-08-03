import { useState, type ReactNode } from "react";
import { Bot, Coins, Lock, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Alert } from "@components/ui/Alert";
import { aiAgentsApi } from "@modules/ai-agents/aiAgentsApi";
import type { AiAddonStatusResponse } from "@modules/ai-agents/types";

interface Props {
  status: AiAddonStatusResponse | null;
  onPurchased?: (status: AiAddonStatusResponse) => void;
}

function formatCurrency(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  } catch {
    return `${currency} ${amount || 0}`;
  }
}

export default function AiAgentsLockedPage({ status, onPurchased }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const catalog = status?.catalog;
  const wallet = status?.wallet;
  const featureAllowed = status?.featureAccess?.allowed !== false;
  const purchaseAllowed = Boolean(status?.purchase?.allowed);
  const blockedReason = String(status?.featureAccess?.reason || status?.purchase?.reason || "");
  const requiresUpgrade = blockedReason === "plan_upgrade_required";
  const workspaceBlocked = blockedReason === "workspace_blocked";

  async function handlePurchase() {
    if (!purchaseAllowed) return;
    setLoading(true);
    setError("");
    try {
      const response = await aiAgentsApi.purchaseAddon();
      onPurchased?.(response);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to activate AI Agent add-on.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 md:p-8">
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Agents</div>
        <h1 className="mt-1 text-3xl font-black tracking-tighter text-slate-900 md:text-4xl">
          {workspaceBlocked ? "Workspace Is Blocked" : requiresUpgrade ? "Upgrade Plan for AI Agents" : "Unlock AI Agent Add-on"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
          {workspaceBlocked
            ? "This workspace is currently blocked by platform admin. Plan access and wallet balance will not unlock AI until the workspace is restored."
            : requiresUpgrade
            ? "This workspace plan does not include AI Agents yet. Upgrade the plan first, then you can purchase the AI add-on and top up credits."
            : "This workspace does not have an active AI Agent subscription. Purchase the add-on to create agents, use Gemini runtime, and consume included AI credits."}
        </p>
      </div>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <Card className="overflow-hidden border-slate-200 p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-brand-700">
              <Sparkles size={14} />
              AI Agent Add-on
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-slate-900 text-white">
                <Bot size={24} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(catalog?.monthlyPrice || 0, catalog?.currency || "INR")}
                  <span className="ml-2 text-sm font-bold text-slate-400">/ 30 days</span>
                </div>
                <div className="text-sm font-semibold text-slate-500">
                  Includes {catalog?.includedCredits || 0} AI credits and Gemini-powered agent access
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <FeatureTile icon={<Coins size={18} />} label="Included Credits" value={String(catalog?.includedCredits || 0)} />
              <FeatureTile icon={<Sparkles size={18} />} label="Billing Cycle" value="Monthly reset" />
              <FeatureTile icon={<Lock size={18} />} label="Module Access" value={workspaceBlocked ? "Blocked" : requiresUpgrade ? "Upgrade needed" : "Ready to unlock"} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {requiresUpgrade ? (
                <Link to="/app/plan">
                  <Button>
                    <Sparkles size={16} />
                    Upgrade Plan
                  </Button>
                </Link>
              ) : workspaceBlocked ? (
                <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                  AI purchase is unavailable while the workspace is blocked.
                </div>
              ) : (
                <>
                  <Button onClick={() => void handlePurchase()} disabled={loading || !purchaseAllowed}>
                    <Bot size={16} />
                    {loading ? "Activating..." : "Buy AI Agent"}
                  </Button>
                  <Link to="/app/wallet">
                    <Button variant="outline">
                      <Wallet size={16} />
                      Add Wallet Balance
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {!requiresUpgrade && !workspaceBlocked ? (
            <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Workspace Wallet</div>
              <div className="mt-2 text-3xl font-black text-slate-900">
                {formatCurrency(wallet?.balance || 0, wallet?.currency || "INR")}
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                Purchase is charged from wallet balance. If the balance is low, recharge wallet first and then activate the add-on.
              </p>
            </div>
          ) : (
            <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Eligibility</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{workspaceBlocked ? "Workspace blocked" : "Plan upgrade required"}</div>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                {workspaceBlocked
                  ? "This workspace has been blocked by platform admin. AI module access, purchases, and add-on usage stay disabled until the workspace is restored."
                  : "AI Agents stay locked until this workspace gets a paid plan. Wallet recharge alone will not unlock the module."}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function FeatureTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">{icon}</div>
      <div className="mt-3 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{value}</div>
    </div>
  );
}
