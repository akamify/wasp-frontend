import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { useAuth } from "@shared/providers/AuthContext";
import { arrayToLines, defaultFeatures, defaultLimits, defaultUnlimitedLimits, FUNCTIONALITY_KEYS, LIMIT_KEYS, linesToArray } from "./shared";
import type { FeatureRow } from "./shared";

const limitKeys = Object.keys(defaultLimits());

function deriveUnlimitedFlags(raw: Record<string, any> = {}) {
  return Object.fromEntries(limitKeys.map((key) => [key, raw?.[key] === null]));
}

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
  unlimitedLimits: defaultUnlimitedLimits(),
  displayFeaturesText: "",
  unavailableFeaturesText: "",
  addonServicesText: "",
  featureRows: [],
  isFreePlan: false,
    freeLimits: { maxContacts: "10", maxTemplates: "5", maxCampaignsPerMonth: "3", maxContactsExport: "10", maxAgents: "0", maxTags: "10", maxCustomAttributes: "5", maxWebhooks: "0", messageRatePerSec: "5", maxFlows: "0", maxApiKeys: "0", maxStorageMb: "0", maxMediaSizeMb: "0", dailyMessageLimit: "0" },
  freeUnlimitedLimits: defaultUnlimitedLimits(),
});

function normalizeRows(item: any): FeatureRow[] {
  return Array.isArray(item?.featureRows) ? item.featureRows.map((r: any) => ({
    label: r.label || "",
    type: r.type === "limit" ? "limit" : r.type === "functionality" ? "functionality" : "text",
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

function toLimitInputValue(value: any) {
  return value == null ? "" : String(value);
}

function serializeLimits(source: Record<string, any>, unlimited: Record<string, boolean>) {
  return Object.fromEntries(
    Object.entries(source || {}).map(([key, value]) => [key, unlimited?.[key] ? null : toNumberOrZero(value)])
  );
}

function serializeFeatureRows(rows: FeatureRow[] = []) {
  return rows
    .map((row, index) => {
      const label = String(row?.label || "").trim();
      const type = String(row?.type || "text");
      if (!label) return null;
      if (type === "functionality") {
        const functionalityKey = String(row?.functionalityKey || "").trim();
        if (!FUNCTIONALITY_KEYS.includes(functionalityKey as any)) return null;
        return { label, type: "functionality", functionalityKey, limitKey: "", value: null, included: row?.included !== false, sortOrder: Number(row?.sortOrder ?? index) };
      }
      if (type === "limit") {
        const limitKey = String(row?.limitKey || "").trim();
        if (!LIMIT_KEYS.includes(limitKey as any)) return null;
        return { label, type: "limit", functionalityKey: "", limitKey, value: row?.unlimited ? null : toNumberOrZero(row?.value), included: row?.included !== false, sortOrder: Number(row?.sortOrder ?? index) };
      }
      return { label, type: "text", functionalityKey: "", limitKey: "", value: null, included: row?.included !== false, sortOrder: Number(row?.sortOrder ?? index) };
    })
    .filter(Boolean);
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
    const isFreePlan = String(item?.id || "") === "free-plan" || String(item?.slug || "").toLowerCase() === "free";
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
      unlimitedLimits: deriveUnlimitedFlags(item?.limits || {}),
      displayFeaturesText: arrayToLines(item?.displayFeatures),
      unavailableFeaturesText: arrayToLines(item?.unavailableFeatures),
      addonServicesText: arrayToLines(item?.addonServices),
      featureRows: normalizeRows(item),
      isFreePlan,
      freeLimits: {
        maxContacts: toLimitInputValue(item?.limits?.maxContacts),
        maxTemplates: toLimitInputValue(item?.limits?.maxTemplates),
        maxCampaignsPerMonth: toLimitInputValue(item?.limits?.maxCampaignsPerMonth),
        maxContactsExport: toLimitInputValue(item?.limits?.maxContactsExport ?? item?.limits?.maxExportsPerMonth),
        maxAgents: toLimitInputValue(item?.limits?.maxAgents ?? item?.limits?.maxEmployees),
        maxTags: toLimitInputValue(item?.limits?.maxTags ?? 10),
        maxCustomAttributes: toLimitInputValue(item?.limits?.maxCustomAttributes ?? 5),
        maxWebhooks: toLimitInputValue(item?.limits?.maxWebhooks),
        messageRatePerSec: toLimitInputValue(item?.limits?.messageRatePerSec ?? 5),
        maxFlows: toLimitInputValue(item?.limits?.maxFlows),
          maxApiKeys: toLimitInputValue(item?.limits?.maxApiKeys),
          maxStorageMb: toLimitInputValue(item?.limits?.maxStorageMb),
          maxMediaSizeMb: toLimitInputValue(item?.limits?.maxMediaSizeMb),
          dailyMessageLimit: toLimitInputValue(item?.limits?.dailyMessageLimit),
        },
      freeUnlimitedLimits: deriveUnlimitedFlags(item?.limits || {}),
    });
  };

  useEffect(() => { let active = true; setLoading(true); setError(""); (async () => { try { if (isCreate) { const [settingsRes, plansRes] = await Promise.all([API.superAdmin.billingSettingsGet(), API.superAdmin.billingPlans({ includeArchived: true })]); if (!active) return; const s = settingsRes?.data?.item || settingsRes?.item || {}; setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: s?.taxMode || "exclusive" }); setItems(plansRes?.data?.items || plansRes?.items || []); setEditor({ ...initialEditor(), gstPercent: String(Number(s?.defaultGstPercent || 18)) }); } else if (isView || isEdit || isReview) await loadDetail(planId); else await loadList(); } catch (e: any) { if (active) setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load plans"); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, [statusFilter, query, isCreate, isView, isEdit, isReview, planId]);

  useEffect(() => { (async () => { if (!isEditorMode && !isView) return setPreview(null); try { const res = await API.superAdmin.billingPricePreview({ originalPriceRupees: editor.originalPriceRupees === "" ? null : Number(editor.originalPriceRupees), discountedPriceRupees: editor.discountedPriceRupees === "" ? null : Number(editor.discountedPriceRupees), gstPercent: editor.gstPercent === "" ? settings.defaultGstPercent : Number(editor.gstPercent), taxMode: editor.taxMode || "exclusive", billingCycle: editor.billingCycle || "monthly" }); setPreview(res?.data?.preview || null); } catch { setPreview(null); } })(); }, [editor.originalPriceRupees, editor.discountedPriceRupees, editor.gstPercent, editor.taxMode, editor.billingCycle, isEditorMode, isView]);

  const saveEditor = async () => {
    setSaving(true); setError("");
    try {
      const addonServices = linesToArray(editor.addonServicesText);
      const limitsPayload = editor.isFreePlan
        ? serializeLimits(editor.freeLimits || {}, editor.freeUnlimitedLimits || {})
        : serializeLimits(editor.limits || {}, editor.unlimitedLimits || {});
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
        limits: limitsPayload,
        displayFeatures: linesToArray(editor.displayFeaturesText),
        unavailableFeatures: linesToArray(editor.unavailableFeaturesText),
        featureRows: serializeFeatureRows(editor.featureRows || []),
        recommended: !!editor.recommended,
        sortOrder: Number(editor.sortOrder || 1),
        reviewNote: editor.reviewNote,
      };
      if (addonServices.length) payload.addonServices = addonServices;
      if (editor.id) {
        await API.superAdmin.billingPlanUpdate(editor.id, payload);
      } else {
        await API.superAdmin.billingPlanCreate(payload);
      }
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
  const availableFunctionalityKeys = (currentIndex: number) => { const used = new Set((editor.featureRows || []).map((r: FeatureRow, i: number) => (i === currentIndex || r.type !== "functionality" ? "" : String(r.functionalityKey || "").trim())).filter(Boolean)); return FUNCTIONALITY_KEYS.filter((k) => !used.has(k)); };
  const availableLimitKeys = (currentIndex: number) => { const used = new Set((editor.featureRows || []).map((r: FeatureRow, i: number) => (i === currentIndex || r.type !== "limit" ? "" : String(r.limitKey || "").trim())).filter(Boolean)); return LIMIT_KEYS.filter((k) => !used.has(k)); };
  return { isSuperAdmin, navigate, isCreate, isEdit, isReview, isView, isEditorMode, items, query, setQuery, statusFilter, setStatusFilter, loading, saving, error, settings, preview, confirmAction, setConfirmAction, editor, setEditor, loadList, saveEditor, summary, uniqueFeatureRows, availableFunctionalityKeys, availableLimitKeys, confirmAndRunAction, isFreePlan: !!editor.isFreePlan };
}
