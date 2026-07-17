import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { useAuth } from "@shared/providers/AuthContext";
import { arrayToLines, defaultFeatures, defaultLimits, linesToArray, PAGE_ACCESS_OPTIONS, PAGE_BINDING } from "./shared";
import type { FeatureRow } from "./shared";

const initialEditor = () => ({
  id: "",
  slug: "",
  name: "",
  description: "",
  status: "in_review",
  publicVisible: true,
  purchasable: true,
  originalPriceRupees: "",
  discountedPriceRupees: "",
  gstPercent: "18",
  taxMode: "exclusive",
  billingCycle: "monthly",
  trial: { enabled: false, days: "14" },
  buttonText: "Buy Now",
  badgeText: "",
  badgeType: "none",
  cardColor: "blue",
  icon: "⭐",
  recommended: false,
  sortOrder: 1,
  reviewNote: "",
  features: defaultFeatures(),
  limits: defaultLimits(),
  displayFeaturesText: "",
  unavailableFeaturesText: "",
  addonServicesText: "",
  featureRows: [],
  isFreePlan: false,
  freeLimits: { maxContacts: "10", maxTemplates: "5", maxCampaignsPerMonth: "3", maxContactsExport: "10", maxAgents: "0", maxTags: "10", maxCustomAttributes: "5", maxWebhooks: "0", messageRatePerSec: "5", maxFlows: "0", maxTeams: "0", maxApiKeys: "0", maxStorageMb: "0", maxProjects: "0", maxMediaSizeMb: "0", dailyMessageLimit: "0" },
});

function normalizeRows(item: any): FeatureRow[] {
  return Array.isArray(item?.featureRows) ? item.featureRows.map((r: any) => ({
    label: r.label || "",
    type: r.type === "text" ? "text" : "page",
    pageAccessKey: PAGE_ACCESS_OPTIONS.includes(String(r.functionalityKey || "")) ? String(r.functionalityKey || "") : "",
    targetType: r.type === "limit" ? "limit" : r.type === "functionality" ? "functionality" : "",
    functionalityKey: r.functionalityKey || "",
    value: r.value == null ? "" : String(r.value),
    included: r.included !== false,
    sortOrder: Number(r.sortOrder || 0),
    unlimited: r.type === "limit" && r.value === null,
    limitKey: r.limitKey === "maxExportsPerMonth" ? "maxContactsExport" : (r.limitKey === "maxEmployees" ? "maxAgents" : (r.limitKey || "")),
  })) : [];
}

function toNumberOrZero(value: any) {
  if (value === "" || value === null || value === undefined) return 0;
  return Number(value || 0);
}

export function useSubscriptionPlansState() {
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
  const [confirmAction, setConfirmAction] = useState<null | { id: string; action: "publish" | "disable" | "delete"; name: string }>(null);
  const [editor, setEditor] = useState<any>(initialEditor);

  const loadList = async () => {
    const [plansRes, settingsRes] = await Promise.all([API.superAdmin.billingPlans({ q: query || undefined, status: statusFilter || undefined }), API.superAdmin.billingSettingsGet()]);
    setItems(Array.isArray(plansRes?.data?.items) ? plansRes.data.items : []);
    const s = settingsRes?.data?.item || settingsRes?.item || {};
    setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: s?.taxMode || "exclusive" });
  };

  const loadDetail = async (id: string) => {
    const [planRes, settingsRes] = await Promise.all([API.superAdmin.billingPlanGet(id), API.superAdmin.billingSettingsGet()]);
    const item = planRes?.data?.item || planRes?.item;
    if (!item) throw new Error("Plan not found");
    const s = settingsRes?.data?.item || settingsRes?.item || {};
    setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: s?.taxMode || "exclusive" });
    const features = { ...defaultFeatures(), ...(item.features || {}) };
    const limits = { ...defaultLimits(), ...(item.limits || {}) };
    setEditor({
      ...initialEditor(),
      id: item.id,
      slug: item.slug || "",
      name: item.name || "",
      description: item.description || "",
      status: item?.status || "in_review",
      publicVisible: item.publicVisible !== false,
      purchasable: item.purchasable !== false,
      originalPriceRupees: item?.pricing?.originalPricePaise == null ? "" : String(Number(item.pricing.originalPricePaise) / 100),
      discountedPriceRupees: item?.pricing?.discountedPricePaise == null ? "" : String(Number(item.pricing.discountedPricePaise) / 100),
      gstPercent: item?.pricing?.gstPercent == null ? String(s?.defaultGstPercent || 18) : String(item.pricing.gstPercent),
      taxMode: item?.pricing?.taxMode || "exclusive",
      billingCycle: item?.pricing?.billingCycle || "monthly",
      trial: { enabled: Boolean(item?.trial?.enabled), days: String(item?.trial?.days || 14) },
      buttonText: item.buttonText || "Buy Now",
      badgeText: item.badgeText || "",
      badgeType: item.badgeType || "none",
      cardColor: item.cardColor || "blue",
      icon: item.icon || "⭐",
      recommended: Boolean(item.recommended),
      sortOrder: Number(item.sortOrder || 1),
      reviewNote: item?.review?.reviewNote || "",
      features,
      limits: Object.fromEntries(Object.entries(limits).map(([key, value]) => [key, value == null ? "" : String(value)])),
      displayFeaturesText: arrayToLines(item?.displayFeatures),
      unavailableFeaturesText: arrayToLines(item?.unavailableFeatures),
      addonServicesText: arrayToLines(item?.addonServices),
      featureRows: normalizeRows(item),
      isFreePlan: false,
      freeLimits: {
        maxContacts: String(item?.limits?.maxContacts ?? 0),
        maxTemplates: String(item?.limits?.maxTemplates ?? 0),
        maxCampaignsPerMonth: String(item?.limits?.maxCampaignsPerMonth ?? 0),
        maxContactsExport: String(item?.limits?.maxContactsExport ?? item?.limits?.maxExportsPerMonth ?? 0),
        maxAgents: String(item?.limits?.maxAgents ?? item?.limits?.maxEmployees ?? 0),
        maxTags: String(item?.limits?.maxTags ?? 10),
        maxCustomAttributes: String(item?.limits?.maxCustomAttributes ?? 5),
        maxWebhooks: String(item?.limits?.maxWebhooks ?? 0),
        messageRatePerSec: String(item?.limits?.messageRatePerSec ?? 5),
        maxFlows: String(item?.limits?.maxFlows ?? 0),
        maxTeams: String(item?.limits?.maxTeams ?? 0),
        maxApiKeys: String(item?.limits?.maxApiKeys ?? 0),
        maxStorageMb: String(item?.limits?.maxStorageMb ?? 0),
        maxProjects: String(item?.limits?.maxProjects ?? 0),
        maxMediaSizeMb: String(item?.limits?.maxMediaSizeMb ?? 0),
        dailyMessageLimit: String(item?.limits?.dailyMessageLimit ?? 0),
      },
    });
  };

  useEffect(() => { let active = true; setLoading(true); setError(""); (async () => { try { if (isCreate) { const [settingsRes, plansRes] = await Promise.all([API.superAdmin.billingSettingsGet(), API.superAdmin.billingPlans({ includeArchived: true })]); if (!active) return; const s = settingsRes?.data?.item || settingsRes?.item || {}; setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: s?.taxMode || "exclusive" }); setItems(plansRes?.data?.items || plansRes?.items || []); setEditor({ ...initialEditor(), gstPercent: String(Number(s?.defaultGstPercent || 18)) }); } else if (isView || isEdit || isReview) await loadDetail(planId); else await loadList(); } catch (e: any) { if (active) setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load plans"); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, [statusFilter, query, isCreate, isView, isEdit, isReview, planId]);

  useEffect(() => { (async () => { if (!isEditorMode && !isView) return setPreview(null); try { const res = await API.superAdmin.billingPricePreview({ originalPriceRupees: editor.originalPriceRupees === "" ? null : Number(editor.originalPriceRupees), discountedPriceRupees: editor.discountedPriceRupees === "" ? null : Number(editor.discountedPriceRupees), gstPercent: editor.gstPercent === "" ? settings.defaultGstPercent : Number(editor.gstPercent), taxMode: editor.taxMode || "exclusive", billingCycle: editor.billingCycle || "monthly" }); setPreview(res?.data?.preview || null); } catch { setPreview(null); } })(); }, [editor.originalPriceRupees, editor.discountedPriceRupees, editor.gstPercent, editor.taxMode, editor.billingCycle, isEditorMode, isView]);

  const saveEditor = async () => {
    setSaving(true); setError("");
    try {
      const addonServices = linesToArray(editor.addonServicesText);
      const payload: any = {
        slug: editor.slug || undefined,
        name: editor.name,
        description: editor.description,
        status: editor.status || "in_review",
        publicVisible: !!editor.publicVisible,
        purchasable: !!editor.purchasable,
        originalPriceRupees: editor.originalPriceRupees === "" ? null : Number(editor.originalPriceRupees),
        discountedPriceRupees: editor.discountedPriceRupees === "" ? null : Number(editor.discountedPriceRupees),
        gstPercent: editor.gstPercent === "" ? settings.defaultGstPercent : Number(editor.gstPercent),
        taxMode: editor.taxMode || "exclusive",
        billingCycle: editor.billingCycle || "monthly",
        trial: { enabled: !!editor.trial?.enabled, days: Number(editor.trial?.days || 0) },
        buttonText: editor.buttonText,
        badgeText: editor.badgeText,
        badgeType: editor.badgeType || "none",
        cardColor: editor.cardColor || "blue",
        icon: editor.icon || "⭐",
        features: editor.features || {},
        limits: Object.fromEntries(Object.entries(editor.limits || {}).map(([key, value]) => [key, toNumberOrZero(value)])),
        displayFeatures: linesToArray(editor.displayFeaturesText),
        unavailableFeatures: linesToArray(editor.unavailableFeaturesText),
        featureRows: editor.featureRows || [],
        recommended: !!editor.recommended,
        sortOrder: Number(editor.sortOrder || 1),
        reviewNote: editor.reviewNote,
      };
      if (addonServices.length) payload.addonServices = addonServices;
      if (editor.id) await API.superAdmin.billingPlanUpdate(editor.id, payload); else await API.superAdmin.billingPlanCreate(payload);
      navigate("/super-admin/subscription-plans", { replace: true });
    } catch (e: any) {
      setError(e?.userMessage || e?.response?.data?.message || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const triggerAction = async (id: string, action: "publish" | "disable" | "delete") => { try { if (action === "publish") await API.superAdmin.billingPlanPublish(id, {}); if (action === "disable") await API.superAdmin.billingPlanDisable(id); if (action === "delete") { await API.superAdmin.billingPlanDelete(id); navigate("/super-admin/subscription-plans", { replace: true }); return; } if (isView || isEdit || isReview) await loadDetail(id); else await loadList(); } catch (e: any) { setError(e?.userMessage || e?.response?.data?.message || e?.message || `Failed to ${action}`); } };
  const confirmAndRunAction = async () => { if (!confirmAction) return; const payload = confirmAction; setConfirmAction(null); await triggerAction(payload.id, payload.action); };
  const summary = useMemo(() => { const m = new Map<string, number>(); items.forEach((i) => m.set(i.status, (m.get(i.status) || 0) + 1)); return Array.from(m.entries()); }, [items]);
  const uniqueFeatureRows: FeatureRow[] = useMemo(() => [], []);
  const availableFunctionalityKeys = (currentIndex: number, pageAccessKey: string) => { const allowed = PAGE_BINDING[pageAccessKey]?.functionality || []; const used = new Set((editor.featureRows || []).map((r: FeatureRow, i: number) => (i === currentIndex || r.targetType !== "functionality" ? "" : String(r.functionalityKey || "").trim())).filter(Boolean)); return allowed.filter((k) => !used.has(k)); };
  const availableLimitKeys = (currentIndex: number, pageAccessKey: string) => { const allowed = PAGE_BINDING[pageAccessKey]?.limits || []; const used = new Set((editor.featureRows || []).map((r: FeatureRow, i: number) => (i === currentIndex || r.targetType !== "limit" ? "" : String(r.limitKey || "").trim())).filter(Boolean)); return allowed.filter((k) => !used.has(k)); };
  return { isSuperAdmin, navigate, isCreate, isEdit, isReview, isView, isEditorMode, items, query, setQuery, statusFilter, setStatusFilter, loading, saving, error, settings, preview, confirmAction, setConfirmAction, editor, setEditor, loadList, saveEditor, summary, uniqueFeatureRows, availableFunctionalityKeys, availableLimitKeys, confirmAndRunAction };
}
