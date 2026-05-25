import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { useAuth } from "@shared/providers/AuthContext";
import { createRow, dedupeBy, PAGE_ACCESS_OPTIONS, PAGE_BINDING } from "./shared";
import type { FeatureRow } from "./shared";

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
  const [confirmAction, setConfirmAction] = useState<null | { id: string; action: "publish" | "disable"; name: string }>(null);
  const [editor, setEditor] = useState<any>({ id: "", slug: "", name: "", description: "", originalPriceRupees: "", discountedPriceRupees: "", gstPercent: "18", taxMode: "exclusive", buttonText: "Buy Now", badgeText: "", recommended: false, sortOrder: 1, reviewNote: "", featureRows: [createRow()], isFreePlan: false, freeLimits: { maxContacts: "10", maxTemplates: "5", maxCampaignsPerMonth: "3", maxContactsExport: "10" } });

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
    const rows = Array.isArray(item?.featureRows) && item.featureRows.length ? item.featureRows.map((r: any) => ({ label: r.label || "", type: r.type === "text" ? "text" : "page", pageAccessKey: PAGE_ACCESS_OPTIONS.includes(String(r.functionalityKey || "")) ? String(r.functionalityKey || "") : "", targetType: r.type === "limit" ? "limit" : r.type === "functionality" ? "functionality" : "", functionalityKey: r.functionalityKey || "", value: r.value == null ? "" : String(r.value), included: r.included !== false, sortOrder: Number(r.sortOrder || 0), unlimited: r.type === "limit" && r.value === null, limitKey: r.limitKey === "maxExportsPerMonth" ? "maxContactsExport" : (r.limitKey || "") })) : [createRow()];
    setEditor({ id: item.id, slug: item.slug || "", name: item.name || "", description: item.description || "", originalPriceRupees: item?.pricing?.originalPricePaise == null ? "" : String(Number(item.pricing.originalPricePaise) / 100), discountedPriceRupees: item?.pricing?.discountedPricePaise == null ? "" : String(Number(item.pricing.discountedPricePaise) / 100), gstPercent: item?.pricing?.gstPercent == null ? String(settings.defaultGstPercent) : String(item.pricing.gstPercent), taxMode: "exclusive", buttonText: item.buttonText || "", badgeText: item.badgeText || "", recommended: Boolean(item.recommended), sortOrder: Number(item.sortOrder || 1), reviewNote: item?.review?.reviewNote || "", status: item?.status || "in_review", displayFeatures: Array.isArray(item?.displayFeatures) ? item.displayFeatures : [], unavailableFeatures: Array.isArray(item?.unavailableFeatures) ? item.unavailableFeatures : [], featureRows: rows, isFreePlan: Boolean(item?.isFreePlan || item?.slug === "free" || item?.id === "free-plan"), freeLimits: { maxContacts: String(item?.limits?.maxContacts ?? 0), maxTemplates: String(item?.limits?.maxTemplates ?? 0), maxCampaignsPerMonth: String(item?.limits?.maxCampaignsPerMonth ?? 0), maxContactsExport: String(item?.limits?.maxContactsExport ?? item?.limits?.maxExportsPerMonth ?? 0) } });
  };

  useEffect(() => { let active = true; setLoading(true); setError(""); (async () => { try { if (isCreate) { const settingsRes = await API.superAdmin.billingSettingsGet(); if (!active) return; const s = settingsRes?.data?.item || settingsRes?.item || {}; setSettings({ defaultGstPercent: Number(s?.defaultGstPercent || 18), taxMode: "exclusive" }); setEditor((p: any) => ({ ...p, gstPercent: String(Number(s?.defaultGstPercent || 18)) })); } else if (isView || isEdit || isReview) await loadDetail(planId); else await loadList(); } catch (e: any) { if (active) setError(e?.userMessage || e?.response?.data?.message || e?.message || "Failed to load plans"); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, [statusFilter, query, isCreate, isView, isEdit, isReview, planId]);
  useEffect(() => { (async () => { if ((!isEditorMode && !isView) || editor?.isFreePlan) return setPreview(null); try { const res = await API.superAdmin.billingPricePreview({ originalPriceRupees: editor.originalPriceRupees === "" ? null : Number(editor.originalPriceRupees), discountedPriceRupees: editor.discountedPriceRupees === "" ? null : Number(editor.discountedPriceRupees), gstPercent: editor.gstPercent === "" ? settings.defaultGstPercent : Number(editor.gstPercent), taxMode: "exclusive" }); setPreview(res?.data?.preview || null); } catch { setPreview(null); } })(); }, [editor.originalPriceRupees, editor.discountedPriceRupees, editor.gstPercent, isEditorMode, isView]);

  const serializeRows = (rows: FeatureRow[]) => rows.flatMap((r) => r.type === "text" ? [{ label: r.label, type: "text", functionalityKey: "", limitKey: "", value: null, included: !!r.included, sortOrder: Number(r.sortOrder || 0) }] : [{ label: r.label || r.pageAccessKey, type: "functionality", functionalityKey: r.pageAccessKey || "", limitKey: "", value: null, included: !!r.included, sortOrder: Number(r.sortOrder || 0) }, ...(r.targetType === "functionality" && r.functionalityKey ? [{ label: r.label || r.functionalityKey, type: "functionality", functionalityKey: r.functionalityKey, limitKey: "", value: null, included: !!r.included, sortOrder: Number(r.sortOrder || 0) }] : []), ...(r.targetType === "limit" && r.limitKey ? [{ label: r.label || r.limitKey, type: "limit", functionalityKey: "", limitKey: r.limitKey, value: r.unlimited ? null : r.value === "" ? 0 : Number(r.value), included: !!r.included, sortOrder: Number(r.sortOrder || 0) }] : [])]);
  const saveEditor = async () => { setSaving(true); setError(""); try { if (editor?.isFreePlan) { await API.superAdmin.billingPlanUpdate(editor.id, { name: editor.name, description: editor.description, buttonText: editor.buttonText || "Current Plan", limits: { maxContacts: Number(editor?.freeLimits?.maxContacts || 0), maxTemplates: Number(editor?.freeLimits?.maxTemplates || 0), maxCampaignsPerMonth: Number(editor?.freeLimits?.maxCampaignsPerMonth || 0), maxContactsExport: Number(editor?.freeLimits?.maxContactsExport || 0) } }); navigate("/super-admin/subscription-plans", { replace: true }); return; } const payload = { slug: editor.slug || undefined, name: editor.name, description: editor.description, originalPriceRupees: editor.originalPriceRupees === "" ? null : Number(editor.originalPriceRupees), discountedPriceRupees: editor.discountedPriceRupees === "" ? null : Number(editor.discountedPriceRupees), gstPercent: editor.gstPercent === "" ? settings.defaultGstPercent : Number(editor.gstPercent), taxMode: "exclusive", buttonText: editor.buttonText, badgeText: editor.badgeText, featureRows: serializeRows(editor.featureRows), recommended: !!editor.recommended, sortOrder: Number(editor.sortOrder || 1), reviewNote: editor.reviewNote }; if (editor.id) await API.superAdmin.billingPlanUpdate(editor.id, payload); else await API.superAdmin.billingPlanCreate(payload); navigate("/super-admin/subscription-plans", { replace: true }); } catch (e: any) { setError(e?.userMessage || e?.response?.data?.message || e?.message || "Save failed"); } finally { setSaving(false); } };
  const triggerAction = async (id: string, action: "publish" | "disable") => { try { if (action === "publish") await API.superAdmin.billingPlanPublish(id, {}); if (action === "disable") await API.superAdmin.billingPlanDisable(id); if (isView || isEdit || isReview) await loadDetail(id); else await loadList(); } catch (e: any) { setError(e?.userMessage || e?.response?.data?.message || e?.message || `Failed to ${action}`); } };
  const confirmAndRunAction = async () => { if (!confirmAction) return; const payload = confirmAction; setConfirmAction(null); await triggerAction(payload.id, payload.action); };
  const summary = useMemo(() => { const m = new Map<string, number>(); items.forEach((i) => m.set(i.status, (m.get(i.status) || 0) + 1)); return Array.from(m.entries()); }, [items]);
  const uniqueFeatureRows: FeatureRow[] = useMemo(() => dedupeBy(editor.featureRows || [], (r) => `${String(r.type || "")}:${String(r.label || "").trim().toLowerCase()}:${String(r.functionalityKey || "").trim()}:${String(r.limitKey || "").trim()}`), [editor.featureRows]);
  const availableFunctionalityKeys = (currentIndex: number, pageAccessKey: string) => { const allowed = PAGE_BINDING[pageAccessKey]?.functionality || []; const used = new Set((editor.featureRows || []).map((r: FeatureRow, i: number) => (i === currentIndex || r.targetType !== "functionality" ? "" : String(r.functionalityKey || "").trim())).filter(Boolean)); return allowed.filter((k) => !used.has(k)); };
  const availableLimitKeys = (currentIndex: number, pageAccessKey: string) => { const allowed = PAGE_BINDING[pageAccessKey]?.limits || []; const used = new Set((editor.featureRows || []).map((r: FeatureRow, i: number) => (i === currentIndex || r.targetType !== "limit" ? "" : String(r.limitKey || "").trim())).filter(Boolean)); return allowed.filter((k) => !used.has(k)); };
  return { isSuperAdmin, navigate, isCreate, isEdit, isReview, isView, isEditorMode, items, query, setQuery, statusFilter, setStatusFilter, loading, saving, error, settings, preview, confirmAction, setConfirmAction, editor, setEditor, loadList, saveEditor, summary, uniqueFeatureRows, availableFunctionalityKeys, availableLimitKeys, confirmAndRunAction };
}
