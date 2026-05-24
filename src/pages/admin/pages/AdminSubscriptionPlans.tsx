import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { useAuth } from "@shared/providers/AuthContext";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { SuperAdminPlanPreviewCard } from "@pages/admin/components/SuperAdminPlanPreviewCard";

const FUNCTIONALITY_KEYS = [
  "dashboardPageAccess",
  "templatesPageAccess",
  "campaignsPageAccess",
  "contactsPageAccess",
  "inboxPageAccess",
  "crmPageAccess",
  "flowsPageAccess",
  "walletPageAccess",
  "linksPageAccess",
  "automationPageAccess",
  "activityPageAccess",
  "apiKeysPageAccess",
  "apiReportsPageAccess",
  "campaignApiAccess",
  "externalChatApiAccess",
  "crmAccess",
  "employeeAccess",
  "leadDistributionAccess",
  "analyticsAccess",
  "exportAccess",
  "automationAccess",
  "apiKeyAccess",
];
const LIMIT_KEYS = ["maxContacts", "maxTemplates", "maxEmployees", "maxApiKeys", "maxCampaignsPerMonth", "maxContactsExport", "maxStorageMb"];

const PAGE_ACCESS_OPTIONS = [
  "dashboardPageAccess",
  "templatesPageAccess",
  "campaignsPageAccess",
  "contactsPageAccess",
  "inboxPageAccess",
  "crmPageAccess",
  "flowsPageAccess",
  "walletPageAccess",
  "linksPageAccess",
  "automationPageAccess",
  "activityPageAccess",
  "apiKeysPageAccess",
  "apiReportsPageAccess",
];

const PAGE_BINDING: Record<string, { functionality: string[]; limits: string[] }> = {
  dashboardPageAccess: { functionality: [], limits: [] },
  templatesPageAccess: { functionality: [], limits: ["maxTemplates"] },
  campaignsPageAccess: { functionality: ["campaignApiAccess"], limits: ["maxCampaignsPerMonth"] },
  contactsPageAccess: { functionality: [], limits: ["maxContacts", "maxContactsExport"] },
  inboxPageAccess: { functionality: ["apiKeyAccess"], limits: [] },
  crmPageAccess: { functionality: ["crmAccess", "employeeAccess", "leadDistributionAccess"], limits: ["maxEmployees"] },
  flowsPageAccess: { functionality: ["automationAccess"], limits: [] },
  walletPageAccess: { functionality: [], limits: [] },
  linksPageAccess: { functionality: ["analyticsAccess"], limits: [] },
  automationPageAccess: { functionality: ["automationAccess"], limits: [] },
  activityPageAccess: { functionality: ["analyticsAccess"], limits: [] },
  apiKeysPageAccess: { functionality: ["apiKeyAccess"], limits: ["maxApiKeys"] },
  apiReportsPageAccess: { functionality: ["analyticsAccess"], limits: [] },
};

type FeatureRow = {
  label: string;
  type: "page" | "text";
  pageAccessKey: string;
  targetType: "functionality" | "limit" | "";
  functionalityKey: string;
  limitKey: string;
  value: string;
  included: boolean;
  sortOrder: number;
  unlimited: boolean;
};

function createRow(): FeatureRow {
  return { label: "", type: "text", pageAccessKey: "", targetType: "", functionalityKey: "", limitKey: "", value: "", included: true, sortOrder: 0, unlimited: false };
}

function inr(paise?: number | null) {
  if (paise == null) return "-";
  return `₹${Math.round(Number(paise) / 100).toLocaleString("en-IN")}`;
}

function statusColor(status: string) {
  if (status === "published") return "text-emerald-700";
  if (status === "in_review") return "text-amber-700";
  if (status === "disabled") return "text-rose-700";
  return "text-slate-700";
}

function dedupeBy<T>(items: T[], keyGetter: (item: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyGetter(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export default function AdminSubscriptionPlansPage() {
  const { user } = useAuth();
  const isSuperAdmin = String(user?.role || "") === "super_admin";
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();

  const pathname = location.pathname;
  const planId = params.id || "";
  const isCreate = pathname.endsWith("/create");
  const isEdit = /\/subscription-plans\/[^/]+\/edit$/.test(pathname);
  const isReview = /\/subscription-plans\/[^/]+\/review$/.test(pathname);
  const isView = Boolean(planId) && !isEdit && !isReview;
  const isEditorMode = isCreate || isEdit || isReview;

  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({ defaultGstPercent: 18, taxMode: "exclusive" });
  const [preview, setPreview] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<null | { id: string; action: "publish" | "disable"; name: string }>(null);
  const [editor, setEditor] = useState<any>({
    id: "",
    slug: "",
    name: "",
    description: "",
    originalPriceRupees: "",
    discountedPriceRupees: "",
    gstPercent: "18",
    taxMode: "exclusive",
    buttonText: "Buy Now",
    badgeText: "",
    recommended: false,
    sortOrder: 1,
    reviewNote: "",
    featureRows: [createRow()],
    isFreePlan: false,
    freeLimits: { maxContacts: "10", maxTemplates: "5", maxCampaignsPerMonth: "3", maxContactsExport: "10" },
  });

  async function loadList() {
    const [plansRes, settingsRes] = await Promise.all([
      API.superAdmin.billingPlans({ q: query || undefined, status: statusFilter || undefined }),
      API.superAdmin.billingSettingsGet(),
    ]);
    setItems(Array.isArray(plansRes?.data?.items) ? plansRes.data.items : []);
    const s = settingsRes?.data?.item || settingsRes?.item || {};
    setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: s?.taxMode || "exclusive" });
  }

  async function loadDetail(id: string) {
    const [planRes, settingsRes] = await Promise.all([
      API.superAdmin.billingPlanGet(id),
      API.superAdmin.billingSettingsGet(),
    ]);
    const item = planRes?.data?.item || planRes?.item;
    if (!item) throw new Error("Plan not found");
    const s = settingsRes?.data?.item || settingsRes?.item || {};
    setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: s?.taxMode || "exclusive" });

    const rows = Array.isArray(item?.featureRows) && item.featureRows.length
      ? item.featureRows.map((r: any) => ({
        label: r.label || "",
        type: r.type === "text" ? "text" : "page",
        pageAccessKey: PAGE_ACCESS_OPTIONS.includes(String(r.functionalityKey || "")) ? String(r.functionalityKey || "") : "",
        targetType: r.type === "limit" ? "limit" : r.type === "functionality" ? "functionality" : "",
        functionalityKey: r.functionalityKey || "",
        value: r.value == null ? "" : String(r.value),
        included: r.included !== false,
        sortOrder: Number(r.sortOrder || 0),
        unlimited: r.type === "limit" && r.value === null,
        limitKey: r.limitKey === "maxExportsPerMonth" ? "maxContactsExport" : (r.limitKey || ""),
      }))
      : [createRow()];

    setEditor({
      id: item.id,
      slug: item.slug || "",
      name: item.name || "",
      description: item.description || "",
      originalPriceRupees: item?.pricing?.originalPricePaise == null ? "" : String(Number(item.pricing.originalPricePaise) / 100),
      discountedPriceRupees: item?.pricing?.discountedPricePaise == null ? "" : String(Number(item.pricing.discountedPricePaise) / 100),
      gstPercent: item?.pricing?.gstPercent == null ? String(settings.defaultGstPercent) : String(item.pricing.gstPercent),
      taxMode: "exclusive",
      buttonText: item.buttonText || "",
      badgeText: item.badgeText || "",
      recommended: Boolean(item.recommended),
      sortOrder: Number(item.sortOrder || 1),
      reviewNote: item?.review?.reviewNote || "",
      status: item?.status || "in_review",
      displayFeatures: Array.isArray(item?.displayFeatures) ? item.displayFeatures : [],
      unavailableFeatures: Array.isArray(item?.unavailableFeatures) ? item.unavailableFeatures : [],
      featureRows: rows,
      isFreePlan: Boolean(item?.isFreePlan || item?.slug === "free" || item?.id === "free-plan"),
      freeLimits: {
        maxContacts: String(item?.limits?.maxContacts ?? 0),
        maxTemplates: String(item?.limits?.maxTemplates ?? 0),
        maxCampaignsPerMonth: String(item?.limits?.maxCampaignsPerMonth ?? 0),
        maxContactsExport: String(item?.limits?.maxContactsExport ?? item?.limits?.maxExportsPerMonth ?? 0),
      },
    });
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        if (isCreate) {
          const settingsRes = await API.superAdmin.billingSettingsGet();
          if (!active) return;
          const s = settingsRes?.data?.item || settingsRes?.item || {};
          setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: "exclusive" });
          setEditor({
            id: "",
            slug: "",
            name: "",
            description: "",
            originalPriceRupees: "",
            discountedPriceRupees: "",
            gstPercent: String(Number(s?.defaultGstPercent || 18)),
            taxMode: "exclusive",
            buttonText: "Buy Now",
            badgeText: "",
            recommended: false,
            sortOrder: 1,
            reviewNote: "",
            status: "in_review",
            displayFeatures: [],
            unavailableFeatures: [],
            featureRows: [createRow()],
            isFreePlan: false,
            freeLimits: { maxContacts: "10", maxTemplates: "5", maxCampaignsPerMonth: "3", maxContactsExport: "10" },
          });
        } else if (isView || isEdit || isReview) {
          await loadDetail(planId);
        } else {
          await loadList();
        }
      } catch (e: any) {
        if (!active) return;
        setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load plans");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [statusFilter, query, isCreate, isView, isEdit, isReview, planId]);

  async function computePreview() {
    if (!isEditorMode && !isView) return;
    if (editor?.isFreePlan) {
      setPreview(null);
      return;
    }
    try {
      const res = await API.superAdmin.billingPricePreview({
        originalPriceRupees: editor.originalPriceRupees === "" ? null : Number(editor.originalPriceRupees),
        discountedPriceRupees: editor.discountedPriceRupees === "" ? null : Number(editor.discountedPriceRupees),
        gstPercent: editor.gstPercent === "" ? settings.defaultGstPercent : Number(editor.gstPercent),
        taxMode: "exclusive",
      });
      setPreview(res?.data?.preview || null);
    } catch {
      setPreview(null);
    }
  }

  useEffect(() => {
    void computePreview();
  }, [editor.originalPriceRupees, editor.discountedPriceRupees, editor.gstPercent, isEditorMode, isView]);

  function serializeRows(rows: FeatureRow[]) {
    const output: any[] = [];
    rows.forEach((r) => {
      if (r.type === "text") {
        output.push({
          label: r.label,
          type: "text",
          functionalityKey: "",
          limitKey: "",
          value: null,
          included: !!r.included,
          sortOrder: Number(r.sortOrder || 0),
        });
        return;
      }

      if (r.pageAccessKey) {
        output.push({
          label: r.label || r.pageAccessKey,
          type: "functionality",
          functionalityKey: r.pageAccessKey,
          limitKey: "",
          value: null,
          included: !!r.included,
          sortOrder: Number(r.sortOrder || 0),
        });
      }

      if (r.targetType === "functionality" && r.functionalityKey) {
        output.push({
          label: r.label || r.functionalityKey,
          type: "functionality",
          functionalityKey: r.functionalityKey,
          limitKey: "",
          value: null,
          included: !!r.included,
          sortOrder: Number(r.sortOrder || 0),
        });
      }

      if (r.targetType === "limit" && r.limitKey) {
        output.push({
          label: r.label || r.limitKey,
          type: "limit",
          functionalityKey: "",
          limitKey: r.limitKey,
          value: r.unlimited ? null : r.value === "" ? 0 : Number(r.value),
          included: !!r.included,
          sortOrder: Number(r.sortOrder || 0),
        });
      }
    });
    return output;
  }

  async function saveEditor() {
    setSaving(true);
    setError("");
    try {
      if (editor?.isFreePlan) {
        await API.superAdmin.billingPlanUpdate(editor.id, {
          name: editor.name,
          description: editor.description,
          buttonText: editor.buttonText || "Current Plan",
          limits: {
            maxContacts: Number(editor?.freeLimits?.maxContacts || 0),
            maxTemplates: Number(editor?.freeLimits?.maxTemplates || 0),
            maxCampaignsPerMonth: Number(editor?.freeLimits?.maxCampaignsPerMonth || 0),
            maxContactsExport: Number(editor?.freeLimits?.maxContactsExport || 0),
          },
        });
        navigate("/super-admin/subscription-plans", { replace: true });
        return;
      }
      const payload = {
        slug: editor.slug || undefined,
        name: editor.name,
        description: editor.description,
        originalPriceRupees: editor.originalPriceRupees === "" ? null : Number(editor.originalPriceRupees),
        discountedPriceRupees: editor.discountedPriceRupees === "" ? null : Number(editor.discountedPriceRupees),
        gstPercent: editor.gstPercent === "" ? settings.defaultGstPercent : Number(editor.gstPercent),
        taxMode: "exclusive",
        buttonText: editor.buttonText,
        badgeText: editor.badgeText,
        featureRows: serializeRows(editor.featureRows),
        recommended: !!editor.recommended,
        sortOrder: Number(editor.sortOrder || 1),
        reviewNote: editor.reviewNote,
      };
      if (editor.id) await API.superAdmin.billingPlanUpdate(editor.id, payload);
      else await API.superAdmin.billingPlanCreate(payload);
      navigate("/super-admin/subscription-plans", { replace: true });
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function triggerAction(id: string, action: "publish" | "disable") {
    try {
      if (action === "publish") await API.superAdmin.billingPlanPublish(id, {});
      if (action === "disable") await API.superAdmin.billingPlanDisable(id);
      if (isView || isEdit || isReview) {
        await loadDetail(id);
      } else {
        await loadList();
      }
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || `Failed to ${action}`);
    }
  }

  async function confirmAndRunAction() {
    if (!confirmAction) return;
    const payload = confirmAction;
    setConfirmAction(null);
    await triggerAction(payload.id, payload.action);
  }

  const summary = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((i) => m.set(i.status, (m.get(i.status) || 0) + 1));
    return Array.from(m.entries());
  }, [items]);

  const uniqueFeatureRows: FeatureRow[] = useMemo(
    () => dedupeBy(editor.featureRows || [], (r) => `${String(r.type || "")}:${String(r.label || "").trim().toLowerCase()}:${String(r.functionalityKey || "").trim()}:${String(r.limitKey || "").trim()}`),
    [editor.featureRows]
  );

  function availableFunctionalityKeys(currentIndex: number, pageAccessKey: string) {
    const allowed = PAGE_BINDING[pageAccessKey]?.functionality || [];
    const used = new Set(
      (editor.featureRows || [])
        .map((r: FeatureRow, i: number) => (i === currentIndex || r.targetType !== "functionality" ? "" : String(r.functionalityKey || "").trim()))
        .filter(Boolean)
    );
    return allowed.filter((k) => !used.has(k));
  }

  function availableLimitKeys(currentIndex: number, pageAccessKey: string) {
    const allowed = PAGE_BINDING[pageAccessKey]?.limits || [];
    const used = new Set(
      (editor.featureRows || [])
        .map((r: FeatureRow, i: number) => (i === currentIndex || r.targetType !== "limit" ? "" : String(r.limitKey || "").trim()))
        .filter(Boolean)
    );
    return allowed.filter((k) => !used.has(k));
  }

  if (!isSuperAdmin) {
    return <div className="p-4 md:p-8"><Alert variant="danger">Only super admin can access plan management.</Alert></div>;
  }

  if (loading) {
    return <div className="p-4 md:p-8"><TableSkeleton cols={10} rows={8} /></div>;
  }

  if (isCreate || isEdit || isReview || isView) {
    const readOnly = false;
    const title = isCreate ? "Create Plan" : isEdit ? "Edit Plan" : isReview ? "Review Plan" : "View Plan";
    const status = String(editor.status || "in_review");
    const isFreePlan = Boolean(editor?.isFreePlan || editor?.slug === "free" || editor?.id === "free-plan");
    const displayFeatures = Array.isArray(editor.displayFeatures) && editor.displayFeatures.length
      ? editor.displayFeatures
      : uniqueFeatureRows.filter((r: FeatureRow) => r.included && String(r.label || "").trim()).map((r: FeatureRow) => r.label);
    const unavailableFeatures = Array.isArray(editor.unavailableFeatures) && editor.unavailableFeatures.length
      ? editor.unavailableFeatures
      : uniqueFeatureRows.filter((r: FeatureRow) => !r.included && String(r.label || "").trim()).map((r: FeatureRow) => r.label);

    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">Status: <span className={statusColor(status)}>{status}</span></p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" onClick={() => navigate("/super-admin/subscription-plans")}>Back to Plans</Button>
            {editor.id && !isFreePlan ? <Button onClick={() => setConfirmAction({ id: editor.id, action: "publish", name: editor.name || "this plan" })}>Publish</Button> : null}
            {editor.id && !isFreePlan ? <Button variant="ghost" onClick={() => setConfirmAction({ id: editor.id, action: "disable", name: editor.name || "this plan" })}>Disable</Button> : null}
          </div>
        </div>

        {error ? <Alert variant="danger">{error}</Alert> : null}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="w-full rounded-[5px] border border-slate-200 bg-white p-5 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Plan Name" value={editor.name} onChange={(e) => setEditor((s: any) => ({ ...s, name: e.target.value }))} disabled={readOnly} />
                <Input label="Slug (optional)" value={editor.slug} onChange={(e) => setEditor((s: any) => ({ ...s, slug: e.target.value }))} disabled={readOnly} />
                <div className="md:col-span-2"><Textarea label="Description" value={editor.description} onChange={(e) => setEditor((s: any) => ({ ...s, description: e.target.value }))} disabled={readOnly} /></div>
                <Input label="Original Price (Rupees)" value={editor.originalPriceRupees} onChange={(e) => setEditor((s: any) => ({ ...s, originalPriceRupees: e.target.value.replace(/[^\d.]/g, "") }))} disabled={readOnly || isFreePlan} />
                <Input label="Discounted Price (Rupees)" value={editor.discountedPriceRupees} onChange={(e) => setEditor((s: any) => ({ ...s, discountedPriceRupees: e.target.value.replace(/[^\d.]/g, "") }))} disabled={readOnly || isFreePlan} />
                <Input label="GST Percent" value={editor.gstPercent} onChange={(e) => setEditor((s: any) => ({ ...s, gstPercent: e.target.value.replace(/[^\d.]/g, "") }))} disabled={readOnly || isFreePlan} />
                <Input label="Tax Mode" value={isFreePlan ? "N/A (free)" : "exclusive"} disabled />
                <Input label="Button Text" value={editor.buttonText} onChange={(e) => setEditor((s: any) => ({ ...s, buttonText: e.target.value }))} disabled={readOnly} />
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Sort Order</div>
                  <select className="w-full rounded-[5px] border border-slate-200 px-3 py-2.5 text-sm" value={String(editor.sortOrder || 1)} onChange={(e) => setEditor((s: any) => ({ ...s, sortOrder: Number(e.target.value || 1) }))} disabled={readOnly}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-1 gap-3 text-xs font-semibold text-slate-700">
                  <label><input type="checkbox" checked={editor.recommended} onChange={(e) => setEditor((s: any) => ({ ...s, recommended: e.target.checked }))} disabled={readOnly} /> recommended (only one)</label>
                </div>

                <div className="md:col-span-2 border border-slate-200 rounded-[5px] p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-black text-slate-900">Feature Builder</div>
                    {!readOnly && !isFreePlan ? (
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => setEditor((s: any) => ({ ...s, featureRows: [...s.featureRows, createRow()] }))}>
                          Add Row
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  {isFreePlan ? (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-slate-500">Free plan include/exclude is fixed. You can update only limits below.</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="rounded-[5px] border border-emerald-200 bg-emerald-50 p-3">
                          <div className="text-xs font-black uppercase tracking-wider text-emerald-700">Included</div>
                          <ul className="mt-2 space-y-1 text-xs font-semibold text-emerald-900">
                            {displayFeatures.map((feature: string, i: number) => (
                              <li key={`free-included-${i}`}>- {feature}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-[5px] border border-rose-200 bg-rose-50 p-3">
                          <div className="text-xs font-black uppercase tracking-wider text-rose-700">Excluded</div>
                          <ul className="mt-2 space-y-1 text-xs font-semibold text-rose-900">
                            {unavailableFeatures.map((feature: string, i: number) => (
                              <li key={`free-excluded-${i}`}>- {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-3">
                    {editor.featureRows.map((row: FeatureRow, idx: number) => (
                      <div key={idx} className="border border-slate-100 rounded-[5px] p-3 space-y-3">
                        <div className="grid grid-cols-1 gap-2">
                          <Input label="Label" value={row.label} onChange={(e) => setEditor((s: any) => {
                            const next = [...s.featureRows]; next[idx] = { ...next[idx], label: e.target.value }; return { ...s, featureRows: next };
                          })} disabled={readOnly || isFreePlan} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Type</div>
                            <select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.type} onChange={(e) => setEditor((s: any) => {
                              const nextType = e.target.value as "text" | "page";
                              const next = [...s.featureRows];
                              next[idx] = {
                                ...next[idx],
                                type: nextType,
                                pageAccessKey: nextType === "page" ? next[idx].pageAccessKey : "",
                                targetType: nextType === "page" ? next[idx].targetType : "",
                                functionalityKey: nextType === "page" ? next[idx].functionalityKey : "",
                                limitKey: nextType === "page" ? next[idx].limitKey : "",
                                value: nextType === "page" ? next[idx].value : "",
                                unlimited: nextType === "page" ? next[idx].unlimited : false,
                              };
                              return { ...s, featureRows: next };
                            })} disabled={readOnly || isFreePlan}>
                              <option value="text">text</option><option value="page">page</option>
                            </select>
                          </div>

                          <div>
                            {row.type === "page" ? (
                              <>
                                <div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Page Access</div>
                                <select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.pageAccessKey} onChange={(e) => setEditor((s: any) => {
                                  const pageAccessKey = e.target.value;
                                  const autoFunctionality = pageAccessKey === "campaignsPageAccess" ? "campaignApiAccess" : "";
                                  const next = [...s.featureRows];
                                  next[idx] = {
                                    ...next[idx],
                                    pageAccessKey,
                                    targetType: "",
                                    functionalityKey: autoFunctionality,
                                    limitKey: "",
                                    value: "",
                                    unlimited: false,
                                  };
                                  return { ...s, featureRows: next };
                                })} disabled={readOnly || isFreePlan}>
                                  <option value="">Select page access</option>
                                  {PAGE_ACCESS_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                                </select>
                              </>
                            ) : null}

                            {row.type === "text" ? (
                              <>
                                <div className="h-full flex items-end">
                                  <div className="text-xs font-semibold text-slate-400">Text row: no mapping required</div>
                                </div>
                              </>
                            ) : null}
                          </div>

                          <div>
                            {row.type === "page" ? (
                              <div className="h-full flex items-end">
                                <div className="w-full">
                                  <div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Map To</div>
                                  <select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.targetType} onChange={(e) => setEditor((s: any) => {
                                    const targetType = e.target.value as "functionality" | "limit" | "";
                                    const next = [...s.featureRows];
                                    next[idx] = { ...next[idx], targetType, functionalityKey: targetType === "functionality" ? next[idx].functionalityKey : "", limitKey: targetType === "limit" ? next[idx].limitKey : "", value: "", unlimited: false };
                                    return { ...s, featureRows: next };
                                  })} disabled={readOnly || isFreePlan || !row.pageAccessKey}>
                                    <option value="">None</option>
                                    <option value="functionality">functionality</option>
                                    <option value="limit">limit</option>
                                  </select>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {row.type === "page" && row.targetType ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {row.targetType === "functionality" ? (
                              <div>
                                <div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Functionality</div>
                                <select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.functionalityKey} onChange={(e) => setEditor((s: any) => {
                                  const next = [...s.featureRows]; next[idx] = { ...next[idx], functionalityKey: e.target.value }; return { ...s, featureRows: next };
                                })} disabled={readOnly || isFreePlan || !row.pageAccessKey}>
                                  <option value="">Select functionality</option>
                                  {availableFunctionalityKeys(idx, row.pageAccessKey).map((k) => <option key={k} value={k}>{k}</option>)}
                                </select>
                                {row.pageAccessKey === "campaignsPageAccess" ? <div className="mt-1 text-[11px] text-slate-500">`campaignApiAccess` auto-enabled with campaign page access.</div> : null}
                              </div>
                            ) : null}

                            {row.targetType === "limit" ? (
                              <>
                                <div>
                                  <div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Limit Key</div>
                                  <select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.limitKey} onChange={(e) => setEditor((s: any) => {
                                    const next = [...s.featureRows]; next[idx] = { ...next[idx], limitKey: e.target.value }; return { ...s, featureRows: next };
                                  })} disabled={readOnly || isFreePlan || !row.pageAccessKey}>
                                    <option value="">Select limit</option>
                                    {availableLimitKeys(idx, row.pageAccessKey).map((k) => <option key={k} value={k}>{k}</option>)}
                                  </select>
                                </div>
                                <Input label="Value" value={row.value} onChange={(e) => setEditor((s: any) => {
                                  const next = [...s.featureRows]; next[idx] = { ...next[idx], value: e.target.value.replace(/[^\d]/g, "") }; return { ...s, featureRows: next };
                                })} disabled={readOnly || isFreePlan || row.unlimited} />
                              </>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 items-end">
                          <div />

                          <div className="inline-flex items-center gap-4 pb-2 text-xs font-semibold text-slate-700">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name={`feature-row-included-${idx}`}
                                checked={row.included === true}
                                onChange={() => setEditor((s: any) => {
                                  const next = [...s.featureRows];
                                  next[idx] = { ...next[idx], included: true };
                                  return { ...s, featureRows: next };
                                })}
                                disabled={readOnly || isFreePlan}
                              />
                              included
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="radio"
                                name={`feature-row-included-${idx}`}
                                checked={row.included === false}
                                onChange={() => setEditor((s: any) => {
                                  const next = [...s.featureRows];
                                  next[idx] = { ...next[idx], included: false };
                                  return { ...s, featureRows: next };
                                })}
                                disabled={readOnly || isFreePlan}
                              />
                              excluded
                            </label>
                          </div>

                          <label className={`text-xs font-semibold inline-flex items-center gap-2 pb-2 ${row.type === "page" && row.targetType === "limit" ? "text-slate-700" : "text-slate-400"}`}>
                            <input type="checkbox" checked={row.unlimited} onChange={(e) => setEditor((s: any) => {
                              const next = [...s.featureRows]; next[idx] = { ...next[idx], unlimited: e.target.checked }; return { ...s, featureRows: next };
                            })} disabled={readOnly || isFreePlan || row.type !== "page" || row.targetType !== "limit"} />
                            unlimited
                          </label>

                          <div className="pb-1">
                            {!readOnly && !isFreePlan ? <Button variant="outline" onClick={() => setEditor((s: any) => ({ ...s, featureRows: s.featureRows.filter((_: any, i: number) => i !== idx) }))}>Remove</Button> : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>

                {isFreePlan ? (
                  <div className="md:col-span-2 border border-slate-200 rounded-[5px] p-3">
                    <div className="text-sm font-black text-slate-900 mb-2">Free Plan Limits</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input label="Max Contacts / Month" value={editor?.freeLimits?.maxContacts || ""} onChange={(e) => setEditor((s: any) => ({ ...s, freeLimits: { ...(s.freeLimits || {}), maxContacts: e.target.value.replace(/[^\d]/g, "") } }))} />
                      <Input label="Max Templates / Month" value={editor?.freeLimits?.maxTemplates || ""} onChange={(e) => setEditor((s: any) => ({ ...s, freeLimits: { ...(s.freeLimits || {}), maxTemplates: e.target.value.replace(/[^\d]/g, "") } }))} />
                      <Input label="Max Campaigns / Month" value={editor?.freeLimits?.maxCampaignsPerMonth || ""} onChange={(e) => setEditor((s: any) => ({ ...s, freeLimits: { ...(s.freeLimits || {}), maxCampaignsPerMonth: e.target.value.replace(/[^\d]/g, "") } }))} />
                      <Input label="Max Contact Exports / Month" value={editor?.freeLimits?.maxContactsExport || ""} onChange={(e) => setEditor((s: any) => ({ ...s, freeLimits: { ...(s.freeLimits || {}), maxContactsExport: e.target.value.replace(/[^\d]/g, "") } }))} />
                    </div>
                  </div>
                ) : null}


                <div className="md:col-span-2"><Textarea label="Review Note" value={editor.reviewNote} onChange={(e) => setEditor((s: any) => ({ ...s, reviewNote: e.target.value }))} disabled={readOnly} /></div>
              {preview && !isFreePlan ? (
                <div className="col-span-2 rounded-[5px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-black text-slate-900">Price Preview</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                    <div className="rounded-[5px] border border-slate-200 bg-white px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Original</div>
                      <div className="mt-1 text-sm font-black text-slate-900">{inr(preview.originalPricePaise)}</div>
                    </div>
                    <div className="rounded-[5px] border border-slate-200 bg-white px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Discounted</div>
                      <div className="mt-1 text-sm font-black text-slate-900">{inr(preview.discountedPricePaise)}</div>
                    </div>
                    <div className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Save</div>
                      <div className="mt-1 text-sm font-black text-emerald-800">{inr(preview.discountAmountPaise)}</div>
                    </div>
                    <div className="rounded-[5px] border border-slate-200 bg-white px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Discount</div>
                      <div className="mt-1 text-sm font-black text-slate-900">{preview.discountPercent}%</div>
                    </div>
                    <div className="rounded-[5px] border border-slate-200 bg-white px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">GST</div>
                      <div className="mt-1 text-sm font-black text-slate-900">{inr(preview.gstAmountPaise)}</div>
                    </div>
                    <div className="rounded-[5px] border border-brand-200 bg-brand-50 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">Payable</div>
                      <div className="mt-1 text-sm font-black text-brand-800">{inr(preview.payableAmountPaise)}</div>
                    </div>
                  </div>
                </div>
              ) : null}
              </div>

              {!readOnly ? (
                <div className="sticky bottom-0 bg-white pt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => navigate("/super-admin/subscription-plans")}>Cancel</Button>
                  <Button onClick={() => void saveEditor()} disabled={saving || !editor.name}>{saving ? "Saving..." : (isFreePlan ? "Save Free Plan" : "Save (In Review)")}</Button>
                </div>
              ) : null}

            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <SuperAdminPlanPreviewCard
              name={editor.name}
              description={editor.description}
              discountedPriceRupees={editor.discountedPriceRupees}
              recommended={editor.recommended}
              badgeText={editor.badgeText}
              discountAmountPaise={Number(preview?.discountAmountPaise || 0)}
              displayFeatures={displayFeatures}
              unavailableFeatures={unavailableFeatures}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Subscription Plans"
        subtitle="Create plans manually and publish. No default plans are auto-created."
        query={query}
        setQuery={setQuery}
        onRefresh={loadList}
        isSyncing={loading}
        right={<Button onClick={() => navigate("/super-admin/subscription-plans/create")}>Create Plan</Button>}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {[
          ["", "All"],
          ["in_review", "In Review"],
          ["published", "Published"],
          ["disabled", "Disabled"],
        ].map(([value, label]) => (
          <Button key={value} variant={statusFilter === value ? "primary" : "outline"} onClick={() => setStatusFilter(value)}>{label}</Button>
        ))}
      </div>

      {summary.length ? (
        <div className="text-xs font-semibold text-slate-600 flex gap-3 flex-wrap">
          {summary.map(([k, v]) => <span key={k}>{k}: {v}</span>)}
        </div>
      ) : null}

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <AdminTable
        columns={[
          { key: "name", label: "Name" },
          { key: "orig", label: "Original" },
          { key: "disc", label: "Discounted" },
          { key: "gst", label: "GST%" },
          { key: "status", label: "Status" },
          { key: "recommended", label: "Recommended" },
          { key: "created", label: "Created" },
        ]}
      >
        {items.length ? items.map((row) => (
          <tr key={row.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/super-admin/subscription-plans/${row.id}`)}>
            <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.name}</td>
            <td className="px-6 py-4 text-sm text-slate-700">{inr(row?.pricing?.originalPricePaise)}</td>
            <td className="px-6 py-4 text-sm text-slate-700">{inr(row?.pricing?.discountedPricePaise)}</td>
            <td className="px-6 py-4 text-sm text-slate-700">{row?.pricing?.gstPercent ?? "-"}</td>
            <td className={`px-6 py-4 text-xs font-black uppercase ${statusColor(row.status)}`}>{row.status}</td>
            <td className="px-6 py-4 text-xs font-semibold text-slate-700">{row.recommended ? "Yes" : "No"}</td>
            <td className="px-6 py-4 text-xs text-slate-600">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</td>
          </tr>
        )) : (
          <tr><td className="px-6 py-16 text-center text-slate-500" colSpan={7}>No plans created yet.</td></tr>
        )}
      </AdminTable>

      <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-600">
        WhatsApp/message charges are billed separately from wallet balance where applicable.
      </div>

      {confirmAction ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[5px] border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">
              {confirmAction.action === "publish" ? "Confirm Publish" : "Confirm Disable"}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {confirmAction.action === "publish"
                ? `Are you sure you want to publish "${confirmAction.name}"?`
                : `Are you sure you want to disable "${confirmAction.name}"?`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button onClick={() => void confirmAndRunAction()}>
                {confirmAction.action === "publish" ? "Yes, Publish" : "Yes, Disable"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
