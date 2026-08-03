import { useEffect, useMemo, useState } from "react";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { API } from "@api/api";

type TabKey = "plans" | "packs" | "assignments" | "financials";

type PlanRow = {
  id: string;
  planKey: string;
  name: string;
  description: string;
  status: string;
  currency: string;
  monthlyPrice: number;
  includedCredits: number;
  tokensPerCredit: number;
  durationDays: number;
  limits: { maxAgents: number; maxKbStorageMb: number; maxInputTokens: number; maxTokensPerReply: number };
  renewalPolicy: { mode: "auto_renew" | "manual"; expireUnusedCredits: boolean };
  sortOrder: number;
  featured: boolean;
  isDefault: boolean;
};

type ProviderConfig = {
  provider: "gemini";
  defaultModel: string;
  models: Array<{ key: string; label: string; deprecated?: boolean; sortOrder?: number }>;
  manualModeEnabled?: boolean;
};

type PackRow = {
  id: string;
  packId: string;
  label: string;
  description: string;
  status: string;
  currency: string;
  credits: number;
  price: number;
  sortOrder: number;
  featured: boolean;
};

const EMPTY_PLAN: Omit<PlanRow, "id"> = {
  planKey: "",
  name: "",
  description: "",
  status: "draft",
  currency: "INR",
  monthlyPrice: 2500,
  includedCredits: 500,
  tokensPerCredit: 1000,
  durationDays: 30,
  limits: { maxAgents: 1, maxKbStorageMb: 500, maxInputTokens: 4096, maxTokensPerReply: 1024 },
  renewalPolicy: { mode: "auto_renew", expireUnusedCredits: true },
  sortOrder: 0,
  featured: false,
  isDefault: false,
};

const EMPTY_PACK: Omit<PackRow, "id"> = {
  packId: "",
  label: "",
  description: "",
  status: "draft",
  currency: "INR",
  credits: 100,
  price: 299,
  sortOrder: 0,
  featured: false,
};

export default function SuperAdminAiAddonsPage() {
  const [tab, setTab] = useState<TabKey>("plans");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [packs, setPacks] = useState<PackRow[]>([]);
  const [providerConfig, setProviderConfig] = useState<ProviderConfig | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [financialDashboard, setFinancialDashboard] = useState<any>(null);
  const [ledgerRows, setLedgerRows] = useState<any[]>([]);
  const [workspaceStatements, setWorkspaceStatements] = useState<any[]>([]);
  const [workspaceResults, setWorkspaceResults] = useState<any[]>([]);
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [planDraft, setPlanDraft] = useState<Omit<PlanRow, "id">>(EMPTY_PLAN);
  const [packDraft, setPackDraft] = useState<Omit<PackRow, "id">>(EMPTY_PACK);
  const [editingPlanId, setEditingPlanId] = useState("");
  const [editingPackId, setEditingPackId] = useState("");
  const [saving, setSaving] = useState(false);
  const [financialAction, setFinancialAction] = useState({ type: "adjustment", credits: "0", reason: "", reference: "" });

  const selectedWorkspace = workspaceResults.find((item) => item.id === selectedWorkspaceId) || null;
  const selectedPlan = plans.find((item) => item.id === selectedPlanId) || null;

  const filteredSubscriptions = useMemo(() => subscriptions.slice(0, 12), [subscriptions]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [planRes, packRes, subscriptionRes, financialRes, ledgerRes] = await Promise.all([
        API.superAdmin.aiAddonPlans(),
        API.superAdmin.aiAddonTopupPacks(),
        API.superAdmin.aiAddonSubscriptions({ page: 1, limit: 20, activeOnly: "true" }),
        API.superAdmin.aiAddonFinancialDashboard({ preset: "last_30_days" }),
        API.superAdmin.aiAddonLedger({ limit: 20 }),
      ]);
      setPlans(planRes?.items || []);
      setPacks(packRes?.items || []);
      setSubscriptions(subscriptionRes?.items || []);
      setFinancialDashboard(financialRes || null);
      setLedgerRows(ledgerRes?.items || []);
      const providerRes = await API.superAdmin.aiAddonProviderConfig();
      setProviderConfig(providerRes?.item || null);
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Unable to load AI add-on admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function lookupWorkspaces(query = workspaceQuery) {
    try {
      const res = await API.superAdmin.aiAddonWorkspaceLookup({ q: query });
      setWorkspaceResults(res?.items || []);
    } catch {
      setWorkspaceResults([]);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void lookupWorkspaces(), 250);
    return () => window.clearTimeout(timer);
  }, [workspaceQuery]);

  useEffect(() => {
    if (!selectedWorkspaceId || tab !== "financials") return;
    (async () => {
      try {
        const res = await API.superAdmin.aiAddonStatements({ workspaceId: selectedWorkspaceId, limit: 4 });
        setWorkspaceStatements(res?.items || []);
      } catch {
        setWorkspaceStatements([]);
      }
    })();
  }, [selectedWorkspaceId, tab]);

  async function savePlan() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingPlanId) {
        await API.superAdmin.aiAddonPlanUpdate(editingPlanId, planDraft);
        setNotice("AI plan updated.");
      } else {
        await API.superAdmin.aiAddonPlanCreate(planDraft);
        setNotice("AI plan created.");
      }
      setPlanDraft(EMPTY_PLAN);
      setEditingPlanId("");
      await loadAll();
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Unable to save AI plan.");
    } finally {
      setSaving(false);
    }
  }

  async function savePack() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingPackId) {
        await API.superAdmin.aiAddonTopupPackUpdate(editingPackId, packDraft);
        setNotice("Top-up pack updated.");
      } else {
        await API.superAdmin.aiAddonTopupPackCreate(packDraft);
        setNotice("Top-up pack created.");
      }
      setPackDraft(EMPTY_PACK);
      setEditingPackId("");
      await loadAll();
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Unable to save top-up pack.");
    } finally {
      setSaving(false);
    }
  }

  async function triggerPlanAction(id: string, action: "publish" | "disable" | "archive" | "delete") {
    try {
      if (action === "publish") await API.superAdmin.aiAddonPlanPublish(id);
      if (action === "disable") await API.superAdmin.aiAddonPlanDisable(id);
      if (action === "archive") await API.superAdmin.aiAddonPlanArchive(id);
      if (action === "delete") await API.superAdmin.aiAddonPlanDelete(id);
      await loadAll();
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || `Unable to ${action} AI plan.`);
    }
  }

  async function triggerPackAction(id: string, action: "publish" | "disable" | "archive" | "delete") {
    try {
      if (action === "publish") await API.superAdmin.aiAddonTopupPackPublish(id);
      if (action === "disable") await API.superAdmin.aiAddonTopupPackDisable(id);
      if (action === "archive") await API.superAdmin.aiAddonTopupPackArchive(id);
      if (action === "delete") await API.superAdmin.aiAddonTopupPackDelete(id);
      await loadAll();
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || `Unable to ${action} top-up pack.`);
    }
  }

  async function assignPlan() {
    if (!selectedWorkspaceId || !selectedPlanId) {
      setError("Workspace and AI plan both required.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await API.superAdmin.aiAddonAssignWorkspacePlan(selectedWorkspaceId, { planId: selectedPlanId, preserveTopups: true });
      setNotice("Workspace AI plan assigned.");
      await loadAll();
      await lookupWorkspaces();
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Unable to assign workspace AI plan.");
    } finally {
      setSaving(false);
    }
  }

  async function saveProviderConfig() {
    if (!providerConfig) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await API.superAdmin.aiAddonProviderConfigUpdate(providerConfig);
      setNotice("Gemini model configuration updated.");
      await loadAll();
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Unable to update Gemini model configuration.");
    } finally {
      setSaving(false);
    }
  }

  async function runFinancialAction() {
    if (!selectedWorkspaceId) {
      setError("Select workspace first.");
      return;
    }
    if (!financialAction.reason.trim()) {
      setError("Reason is required.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await API.superAdmin.aiAddonWorkspaceFinancialAction(selectedWorkspaceId, {
        type: financialAction.type,
        credits: Number(financialAction.credits || 0),
        reason: financialAction.reason,
        reference: financialAction.reference,
      });
      setNotice(`${financialAction.type === "refund" ? "Refund" : "Adjustment"} applied.`);
      setFinancialAction({ type: "adjustment", credits: "0", reason: "", reference: "" });
      await loadAll();
      if (selectedWorkspaceId) {
        const res = await API.superAdmin.aiAddonStatements({ workspaceId: selectedWorkspaceId, limit: 4 });
        setWorkspaceStatements(res?.items || []);
      }
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Unable to apply financial action.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadAdminReport(reportType: string) {
    try {
      const blob = await API.superAdmin.aiAddonReportDownload({ reportType });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${reportType}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Unable to download admin AI report.");
    }
  }

  return (
    <div className="space-y-4 py-4 pr-6">
      <AdminToolbar
        title="AI Add-on Management"
        subtitle="Create super admin AI plans, top-up packs, pricing, limits, and workspace assignments."
        query={workspaceQuery}
        setQuery={setWorkspaceQuery}
        onRefresh={loadAll}
        isSyncing={loading}
        right={
          <div className="flex flex-wrap gap-2">
            <Button variant={tab === "plans" ? "primary" : "outline"} onClick={() => setTab("plans")}>Plans</Button>
            <Button variant={tab === "packs" ? "primary" : "outline"} onClick={() => setTab("packs")}>Top-up Packs</Button>
            <Button variant={tab === "assignments" ? "primary" : "outline"} onClick={() => setTab("assignments")}>Assignments</Button>
            <Button variant={tab === "financials" ? "primary" : "outline"} onClick={() => setTab("financials")}>Financials</Button>
          </div>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {tab === "plans" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">AI Plans</h2>
            <div className="mt-4">
              <AdminTable columns={[
                { key: "name", label: "Plan" },
                { key: "price", label: "Price" },
                { key: "credits", label: "Credits" },
                { key: "limits", label: "Limits" },
                { key: "status", label: "Status" },
                { key: "actions", label: "Actions" },
              ]}>
                {plans.length ? plans.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-black text-slate-900">{row.name}</div>
                      <div className="text-xs text-slate-500">{row.planKey}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.currency} {row.monthlyPrice}/mo</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.includedCredits} credits</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{row.limits.maxAgents} agents • {row.limits.maxKbStorageMb} MB • {row.limits.maxTokensPerReply} tokens</td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-slate-600">{row.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => { setEditingPlanId(row.id); setPlanDraft({ ...row }); }}>Edit</Button>
                        <Button variant="outline" onClick={() => void triggerPlanAction(row.id, "publish")}>Publish</Button>
                        <Button variant="outline" onClick={() => void triggerPlanAction(row.id, "disable")}>Disable</Button>
                        <Button variant="outline" onClick={() => void triggerPlanAction(row.id, "archive")}>Archive</Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td className="px-6 py-10 text-center text-slate-500" colSpan={6}>No AI plans created yet.</td></tr>
                )}
              </AdminTable>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">{editingPlanId ? "Edit AI Plan" : "Create AI Plan"}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input label="Plan name" value={planDraft.name} onChange={(e) => setPlanDraft((v) => ({ ...v, name: e.target.value }))} />
              <Input label="Plan key" value={planDraft.planKey} onChange={(e) => setPlanDraft((v) => ({ ...v, planKey: e.target.value }))} />
              <Input label="Monthly price" type="number" value={planDraft.monthlyPrice} onChange={(e) => setPlanDraft((v) => ({ ...v, monthlyPrice: Number(e.target.value) }))} />
              <Input label="Included credits" type="number" value={planDraft.includedCredits} onChange={(e) => setPlanDraft((v) => ({ ...v, includedCredits: Number(e.target.value) }))} />
              <Input label="Tokens per credit" type="number" value={planDraft.tokensPerCredit} onChange={(e) => setPlanDraft((v) => ({ ...v, tokensPerCredit: Number(e.target.value) }))} />
              <Input label="Duration days" type="number" value={planDraft.durationDays} onChange={(e) => setPlanDraft((v) => ({ ...v, durationDays: Number(e.target.value) }))} />
              <Input label="Max agents" type="number" value={planDraft.limits.maxAgents} onChange={(e) => setPlanDraft((v) => ({ ...v, limits: { ...v.limits, maxAgents: Number(e.target.value) } }))} />
              <Input label="KB storage (MB)" type="number" value={planDraft.limits.maxKbStorageMb} onChange={(e) => setPlanDraft((v) => ({ ...v, limits: { ...v.limits, maxKbStorageMb: Number(e.target.value) } }))} />
              <Input label="Max input tokens" type="number" value={planDraft.limits.maxInputTokens} onChange={(e) => setPlanDraft((v) => ({ ...v, limits: { ...v.limits, maxInputTokens: Number(e.target.value) } }))} />
              <Input label="Max tokens/reply" type="number" value={planDraft.limits.maxTokensPerReply} onChange={(e) => setPlanDraft((v) => ({ ...v, limits: { ...v.limits, maxTokensPerReply: Number(e.target.value) } }))} />
              <Select label="Renewal mode" value={planDraft.renewalPolicy.mode} onChange={(e) => setPlanDraft((v) => ({ ...v, renewalPolicy: { ...v.renewalPolicy, mode: e.target.value as "auto_renew" | "manual" } }))}>
                <option value="auto_renew">Auto renew</option>
                <option value="manual">Manual</option>
              </Select>
              <Select label="Status" value={planDraft.status} onChange={(e) => setPlanDraft((v) => ({ ...v, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="disabled">Disabled</option>
              </Select>
              <Select label="Expire unused credits" value={planDraft.renewalPolicy.expireUnusedCredits ? "yes" : "no"} onChange={(e) => setPlanDraft((v) => ({ ...v, renewalPolicy: { ...v.renewalPolicy, expireUnusedCredits: e.target.value === "yes" } }))}>
                <option value="yes">Expire</option>
                <option value="no">Carry forward</option>
              </Select>
            </div>
            <div className="mt-4">
              <Input label="Description" value={planDraft.description} onChange={(e) => setPlanDraft((v) => ({ ...v, description: e.target.value }))} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void savePlan()} disabled={saving}>{saving ? "Saving..." : editingPlanId ? "Update Plan" : "Create Plan"}</Button>
              <Button variant="outline" onClick={() => { setEditingPlanId(""); setPlanDraft(EMPTY_PLAN); }}>Reset</Button>
              {editingPlanId ? <Button variant="danger" onClick={() => void triggerPlanAction(editingPlanId, "delete")}>Delete</Button> : null}
            </div>
            {providerConfig ? (
              <div className="mt-8 rounded-[12px] border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Gemini model config</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Select
                    label="Default model"
                    value={providerConfig.defaultModel}
                    onChange={(e) => setProviderConfig((current) => current ? { ...current, defaultModel: e.target.value } : current)}
                  >
                    {providerConfig.models.map((model) => (
                      <option key={model.key} value={model.key}>{model.label}</option>
                    ))}
                  </Select>
                  <Select
                    label="Manual mode"
                    value={providerConfig.manualModeEnabled ? "enabled" : "disabled"}
                    onChange={(e) => setProviderConfig((current) => current ? { ...current, manualModeEnabled: e.target.value === "enabled" } : current)}
                  >
                    <option value="disabled">Disabled</option>
                    <option value="enabled">Enabled</option>
                  </Select>
                </div>
                <div className="mt-4 space-y-2">
                  {providerConfig.models.map((model, index) => (
                    <div key={model.key} className="grid gap-3 rounded-[8px] border border-slate-200 bg-white p-3 md:grid-cols-[1.15fr_1.1fr_0.65fr_0.5fr]">
                      <Input
                        label={`Model key ${index + 1}`}
                        value={model.key}
                        onChange={(e) => setProviderConfig((current) => current ? {
                          ...current,
                          models: current.models.map((entry, entryIndex) => entryIndex === index ? { ...entry, key: e.target.value } : entry),
                        } : current)}
                      />
                      <Input
                        label="Label"
                        value={model.label}
                        onChange={(e) => setProviderConfig((current) => current ? {
                          ...current,
                          models: current.models.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: e.target.value } : entry),
                        } : current)}
                      />
                      <Select
                        label="Status"
                        value={model.deprecated ? "deprecated" : "enabled"}
                        onChange={(e) => setProviderConfig((current) => current ? {
                          ...current,
                          models: current.models.map((entry, entryIndex) => entryIndex === index ? { ...entry, deprecated: e.target.value === "deprecated" } : entry),
                        } : current)}
                      >
                        <option value="enabled">Enabled</option>
                        <option value="deprecated">Deprecated</option>
                      </Select>
                      <Input
                        label="Order"
                        type="number"
                        value={Number(model.sortOrder || 0)}
                        onChange={(e) => setProviderConfig((current) => current ? {
                          ...current,
                          models: current.models.map((entry, entryIndex) => entryIndex === index ? { ...entry, sortOrder: Number(e.target.value) } : entry),
                        } : current)}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setProviderConfig((current) => current ? {
                      ...current,
                      models: [...current.models, { key: "", label: "", deprecated: false, sortOrder: current.models.length * 10 + 10 }],
                    } : current)}
                  >
                    Add Model
                  </Button>
                  <Button onClick={() => void saveProviderConfig()} disabled={saving}>
                    {saving ? "Saving..." : "Save Gemini Config"}
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {tab === "packs" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">Top-up Packs</h2>
            <div className="mt-4">
              <AdminTable columns={[
                { key: "label", label: "Pack" },
                { key: "credits", label: "Credits" },
                { key: "price", label: "Price" },
                { key: "status", label: "Status" },
                { key: "actions", label: "Actions" },
              ]}>
                {packs.length ? packs.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-black text-slate-900">{row.label}</div>
                      <div className="text-xs text-slate-500">{row.packId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.credits}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.currency} {row.price}</td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-slate-600">{row.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => { setEditingPackId(row.id); setPackDraft({ ...row }); }}>Edit</Button>
                        <Button variant="outline" onClick={() => void triggerPackAction(row.id, "publish")}>Publish</Button>
                        <Button variant="outline" onClick={() => void triggerPackAction(row.id, "disable")}>Disable</Button>
                        <Button variant="outline" onClick={() => void triggerPackAction(row.id, "archive")}>Archive</Button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td className="px-6 py-10 text-center text-slate-500" colSpan={5}>No top-up packs created yet.</td></tr>
                )}
              </AdminTable>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">{editingPackId ? "Edit Top-up Pack" : "Create Top-up Pack"}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Input label="Label" value={packDraft.label} onChange={(e) => setPackDraft((v) => ({ ...v, label: e.target.value }))} />
              <Input label="Pack id" value={packDraft.packId} onChange={(e) => setPackDraft((v) => ({ ...v, packId: e.target.value }))} />
              <Input label="Credits" type="number" value={packDraft.credits} onChange={(e) => setPackDraft((v) => ({ ...v, credits: Number(e.target.value) }))} />
              <Input label="Price" type="number" value={packDraft.price} onChange={(e) => setPackDraft((v) => ({ ...v, price: Number(e.target.value) }))} />
              <Select label="Status" value={packDraft.status} onChange={(e) => setPackDraft((v) => ({ ...v, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
                <option value="disabled">Disabled</option>
              </Select>
            </div>
            <div className="mt-4">
              <Input label="Description" value={packDraft.description} onChange={(e) => setPackDraft((v) => ({ ...v, description: e.target.value }))} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => void savePack()} disabled={saving}>{saving ? "Saving..." : editingPackId ? "Update Pack" : "Create Pack"}</Button>
              <Button variant="outline" onClick={() => { setEditingPackId(""); setPackDraft(EMPTY_PACK); }}>Reset</Button>
              {editingPackId ? <Button variant="danger" onClick={() => void triggerPackAction(editingPackId, "delete")}>Delete</Button> : null}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "assignments" ? (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">Assign Workspace AI Plan</h2>
            <div className="mt-4 space-y-3">
              <Input label="Search workspace" value={workspaceQuery} onChange={(e) => setWorkspaceQuery(e.target.value)} placeholder="workspace name or slug" />
              <Select label="Workspace" value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)}>
                <option value="">Select workspace</option>
                {workspaceResults.map((item) => (
                  <option key={item.id} value={item.id}>{item.name || item.businessName || item.slug}</option>
                ))}
              </Select>
              <Select label="AI Plan" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                <option value="">Select plan</option>
                {plans.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.status})</option>
                ))}
              </Select>
              <div className="rounded-[8px] bg-slate-50 p-3 text-sm text-slate-600">
                <div><span className="font-black text-slate-900">Workspace:</span> {selectedWorkspace ? (selectedWorkspace.name || selectedWorkspace.businessName || selectedWorkspace.slug) : "-"}</div>
                <div className="mt-1"><span className="font-black text-slate-900">Plan:</span> {selectedPlan ? `${selectedPlan.name} • ${selectedPlan.includedCredits} credits` : "-"}</div>
                <div className="mt-1"><span className="font-black text-slate-900">Renewal:</span> {selectedPlan?.renewalPolicy.mode || "-"}</div>
              </div>
              <Button onClick={() => void assignPlan()} disabled={saving || !selectedWorkspaceId || !selectedPlanId}>
                {saving ? "Assigning..." : "Assign Plan"}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-slate-900">Active AI Subscriptions</h2>
            <div className="mt-4">
              <AdminTable columns={[
                { key: "workspace", label: "Workspace" },
                { key: "plan", label: "Plan" },
                { key: "credits", label: "Credits" },
                { key: "renewal", label: "Renewal" },
                { key: "status", label: "Status" },
              ]}>
                {filteredSubscriptions.length ? filteredSubscriptions.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-black text-slate-900">{row.workspace?.name || row.workspace?.businessName || row.workspace?.slug || "-"}</div>
                      <div className="text-xs text-slate-500">{row.workspaceId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.planName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.remainingCredits}/{row.totalCredits}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{row.renewalDate ? new Date(row.renewalDate).toLocaleDateString("en-IN") : "-"}</td>
                    <td className="px-6 py-4 text-xs font-black uppercase text-slate-600">{row.status}</td>
                  </tr>
                )) : (
                  <tr><td className="px-6 py-10 text-center text-slate-500" colSpan={5}>No AI subscriptions found.</td></tr>
                )}
              </AdminTable>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "financials" ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Card className="p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">AI Revenue</div>
              <div className="mt-3 text-3xl font-black text-slate-900">INR {Number(financialDashboard?.metrics?.aiRevenue || 0)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Top-up Revenue</div>
              <div className="mt-3 text-3xl font-black text-slate-900">INR {Number(financialDashboard?.metrics?.topupRevenue || 0)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Credits Sold</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{Number(financialDashboard?.metrics?.creditsSold || 0)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Credits Consumed</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{Number(financialDashboard?.metrics?.creditsConsumed || 0)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Active Subs</div>
              <div className="mt-3 text-3xl font-black text-slate-900">{Number(financialDashboard?.metrics?.activeSubscriptions || 0)}</div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="p-5">
              <h2 className="text-lg font-black text-slate-900">Workspace Financial Action</h2>
              <div className="mt-4 space-y-3">
                <Input label="Search workspace" value={workspaceQuery} onChange={(e) => setWorkspaceQuery(e.target.value)} placeholder="workspace name or slug" />
                <Select label="Workspace" value={selectedWorkspaceId} onChange={(e) => setSelectedWorkspaceId(e.target.value)}>
                  <option value="">Select workspace</option>
                  {workspaceResults.map((item) => (
                    <option key={item.id} value={item.id}>{item.name || item.businessName || item.slug}</option>
                  ))}
                </Select>
                <Select label="Action type" value={financialAction.type} onChange={(e) => setFinancialAction((current) => ({ ...current, type: e.target.value }))}>
                  <option value="adjustment">Manual Adjustment</option>
                  <option value="refund">Refund</option>
                </Select>
                <Input label="Credits" type="number" value={financialAction.credits} onChange={(e) => setFinancialAction((current) => ({ ...current, credits: e.target.value }))} />
                <Input label="Reference" value={financialAction.reference} onChange={(e) => setFinancialAction((current) => ({ ...current, reference: e.target.value }))} />
                <Input label="Reason" value={financialAction.reason} onChange={(e) => setFinancialAction((current) => ({ ...current, reason: e.target.value }))} />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void runFinancialAction()} disabled={saving || !selectedWorkspaceId}>
                    {saving ? "Processing..." : financialAction.type === "refund" ? "Issue Refund" : "Apply Adjustment"}
                  </Button>
                  <Button variant="outline" onClick={() => void downloadAdminReport("revenue_summary")}>Download Revenue CSV</Button>
                  <Button variant="outline" onClick={() => void downloadAdminReport("refund_summary")}>Download Refund CSV</Button>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-black text-slate-900">Selected Workspace Statements</h2>
              <div className="mt-4 space-y-3">
                {workspaceStatements.length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-slate-200 px-4 py-8 text-center text-sm font-semibold text-slate-500">Select a workspace to load recent AI billing statements.</div>
                ) : (
                  workspaceStatements.map((statement) => (
                    <div key={statement.id} className="rounded-[10px] border border-slate-200 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-black text-slate-900">{statement.periodKey}</div>
                          <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Opening {Number(statement.balances?.openingCredits || 0)} â€¢ Closing {Number(statement.balances?.closingCredits || 0)}
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-slate-500">{Number(statement.activity?.totalAiRequests || 0)} requests</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-black text-slate-900">Highest Consuming Workspaces</h2>
              <div className="mt-4 space-y-3">
                {(financialDashboard?.highestConsumingWorkspaces || []).map((item: any) => (
                  <div key={item.workspaceId} className="flex items-center justify-between gap-3 rounded-[10px] border border-slate-200 px-4 py-3">
                    <div>
                      <div className="font-black text-slate-900">{item.workspaceName}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">{item.requests} requests</div>
                    </div>
                    <div className="text-sm font-black text-slate-900">{item.creditsConsumed} credits</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-black text-slate-900">Highest Consuming Agents</h2>
              <div className="mt-4 space-y-3">
                {(financialDashboard?.highestConsumingAgents || []).map((item: any) => (
                  <div key={item.agentId} className="flex items-center justify-between gap-3 rounded-[10px] border border-slate-200 px-4 py-3">
                    <div>
                      <div className="font-black text-slate-900">{item.agentName}</div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">Workspace {item.workspaceId}</div>
                    </div>
                    <div className="text-sm font-black text-slate-900">{item.creditsConsumed} credits</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">Ledger Preview</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Recent immutable AI ledger activity across workspaces.</p>
              </div>
              <Button variant="outline" onClick={() => void downloadAdminReport("adjustment_summary")}>Download Adjustment CSV</Button>
            </div>
            <div className="mt-4">
              <AdminTable columns={[
                { key: "workspace", label: "Workspace" },
                { key: "entryType", label: "Entry Type" },
                { key: "credits", label: "Credits" },
                { key: "amount", label: "Amount" },
                { key: "date", label: "Date" },
              ]}>
                {ledgerRows.length ? ledgerRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-black text-slate-900">{row.workspace?.name || row.workspace?.businessName || row.workspace?.slug || "-"}</div>
                      <div className="text-xs text-slate-500">{row.workspaceId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.entryType || row.type}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.direction === "debit" ? "-" : "+"}{row.credits}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.amount ? `${row.currency} ${row.amount}` : "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{row.createdAt ? new Date(row.createdAt).toLocaleString("en-IN") : "-"}</td>
                  </tr>
                )) : (
                  <tr><td className="px-6 py-10 text-center text-slate-500" colSpan={5}>No AI ledger entries found.</td></tr>
                )}
              </AdminTable>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
