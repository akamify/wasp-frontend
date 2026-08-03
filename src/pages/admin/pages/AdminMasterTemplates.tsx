import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { TemplateForm } from "@modules/templates/forms/TemplateForm";
import { TemplatePreview } from "@modules/templates/components/TemplatePreview";
import { TemplateHistoryModal } from "@modules/templates/components/TemplateHistoryModal";
import type { TemplateVersionItem } from "@modules/templates/types/templates.types";
import { parseComponentsForPreview } from "@pages/user/templates/helpers";
import { useToast } from "@shared/providers/ToastContext";
import { Archive, Copy, Eye, FileText, History, MoreVertical, Pencil, Plus, Rocket, Star, Trash2 } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

const LANGUAGE_OPTIONS = ["en_US", "en_GB", "hi", "ar", "pt_BR", "es", "fr", "de", "it", "id"];
const CATEGORY_OPTIONS = ["all", "marketing", "utility", "authentication"];
const STATUS_OPTIONS = ["all", "draft", "published", "archived"];
const FEATURED_OPTIONS = ["all", "featured", "standard"];
const SORT_OPTIONS = ["recent", "old", "name", "popular"];
const INDUSTRY_OPTIONS = ["all", "ecommerce", "education", "healthcare", "real_estate", "finance", "travel"];
const LIBRARY_CATEGORY_OPTIONS = ["all", "welcome", "offers", "order_updates", "payments", "reminders", "support", "re_engagement"];

function normalizeMetaValue(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readableMetaValue(value: string) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildEditorMetadata(template?: any) {
  return {
    libraryCategory: String(template?.libraryCategory || ""),
    industry: String(template?.industry || ""),
    templatePackKey: String(template?.templatePackKey || ""),
    templatePackName: String(template?.templatePackName || ""),
    templatePackOrder: String(template?.templatePackOrder ?? ""),
    tags: Array.isArray(template?.tags) ? template.tags.join(", ") : "",
    featured: Boolean(template?.featured),
    isOfficial: Boolean(template?.isOfficial),
  };
}

function parseTags(value: string) {
  return String(value || "").split(",").map((tag) => tag.trim()).filter(Boolean);
}

function statusTone(status: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "published") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (normalized === "draft") return "bg-amber-50 text-amber-700 border-amber-100";
  if (normalized === "archived") return "bg-slate-200 text-slate-700 border-slate-300";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

export default function AdminMasterTemplatesPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [editorMetadata, setEditorMetadata] = useState(buildEditorMetadata());
  const [metadataTemplates, setMetadataTemplates] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<any | null>(null);
  const [historyTarget, setHistoryTarget] = useState<any | null>(null);
  const [historyVersions, setHistoryVersions] = useState<TemplateVersionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);

  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string; filter?: string; sort?: string }) =>
      API.admin.masterTemplates({
        ...params,
        ownerType: "system",
        filter: statusFilter,
        featured: featuredFilter,
        category: categoryFilter,
        industry: industryFilter,
        sort: params.sort,
      }).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
    [statusFilter, featuredFilter, categoryFilter, industryFilter]
  );

  const list = useAdminList<Item>({ fetcher, initialLimit: 25, initialFilter: "all", initialSort: "recent" });

  const previewData = useMemo(() => {
    if (!previewTarget?.components) return null;
    const parsed = parseComponentsForPreview(previewTarget.components || []);
    return {
      category: previewTarget.category,
      ...parsed,
    };
  }, [previewTarget]);

  useEffect(() => {
    if (!editorMode) return;
    let alive = true;
    API.admin.masterTemplates({
      page: 1,
      limit: 200,
      q: "",
      ownerType: "system",
      filter: "all",
      featured: "all",
      category: "all",
      industry: "all",
      sort: "recent",
    })
      .then((response: any) => {
        if (alive) setMetadataTemplates(Array.isArray(response?.items) ? response.items : []);
      })
      .catch(() => {
        if (alive) setMetadataTemplates([]);
      });
    return () => {
      alive = false;
    };
  }, [editorMode]);

  const metadataCatalog = useMemo(() => {
    const source = [...metadataTemplates, ...list.items];
    const categories = new Set(LIBRARY_CATEGORY_OPTIONS.filter((item) => item !== "all"));
    const industries = new Set(INDUSTRY_OPTIONS.filter((item) => item !== "all"));
    const tags = new Set<string>();
    const packMap = new Map<string, any>();
    source.forEach((template: any) => {
      const libraryCategory = String(template?.libraryCategory || "").trim();
      const industry = String(template?.industry || "").trim();
      if (libraryCategory) categories.add(libraryCategory);
      if (industry) industries.add(industry);
      (Array.isArray(template?.tags) ? template.tags : []).forEach((tag: any) => {
        const normalized = String(tag || "").trim();
        if (normalized) tags.add(normalized);
      });
      const packKey = String(template?.templatePackKey || "").trim();
      if (!packKey) return;
      const current = packMap.get(packKey) || {
        key: packKey,
        name: String(template?.templatePackName || readableMetaValue(packKey)),
        libraryCategory,
        industry,
        maxOrder: 0,
        count: 0,
      };
      current.name = current.name || String(template?.templatePackName || readableMetaValue(packKey));
      current.libraryCategory = current.libraryCategory || libraryCategory;
      current.industry = current.industry || industry;
      current.maxOrder = Math.max(Number(current.maxOrder || 0), Number(template?.templatePackOrder || 0));
      current.count += 1;
      packMap.set(packKey, current);
    });
    return {
      categories: Array.from(categories).sort((a, b) => a.localeCompare(b)),
      industries: Array.from(industries).sort((a, b) => a.localeCompare(b)),
      tags: Array.from(tags).sort((a, b) => a.localeCompare(b)),
      packs: Array.from(packMap.values()).sort((a, b) => String(a.name || a.key).localeCompare(String(b.name || b.key))),
    };
  }, [list.items, metadataTemplates]);

  const matchingPacks = useMemo(() => {
    const selectedCategory = String(editorMetadata.libraryCategory || "").trim();
    const selectedIndustry = String(editorMetadata.industry || "").trim();
    return metadataCatalog.packs.filter((pack) => {
      if (selectedCategory && pack.libraryCategory && pack.libraryCategory !== selectedCategory) return false;
      if (selectedIndustry && pack.industry && pack.industry !== selectedIndustry) return false;
      return true;
    });
  }, [editorMetadata.industry, editorMetadata.libraryCategory, metadataCatalog.packs]);

  const selectedPack = useMemo(
    () => metadataCatalog.packs.find((pack) => pack.key === editorMetadata.templatePackKey) || null,
    [editorMetadata.templatePackKey, metadataCatalog.packs]
  );

  const suggestedPackOrder = useMemo(() => String(Number(selectedPack?.maxOrder || 0) + 1), [selectedPack]);

  const relevantTags = useMemo(() => {
    const selectedCategory = String(editorMetadata.libraryCategory || "").trim();
    const selectedIndustry = String(editorMetadata.industry || "").trim();
    const selectedPackKey = String(editorMetadata.templatePackKey || "").trim();
    const scoped = metadataTemplates.filter((template: any) => {
      if (selectedPackKey && template.templatePackKey !== selectedPackKey) return false;
      if (!selectedPackKey && selectedCategory && template.libraryCategory !== selectedCategory) return false;
      if (!selectedPackKey && selectedIndustry && template.industry !== selectedIndustry) return false;
      return true;
    });
    const values = scoped.flatMap((template: any) => Array.isArray(template.tags) ? template.tags : []);
    return Array.from(new Set(values.map((tag: any) => String(tag || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [editorMetadata.industry, editorMetadata.libraryCategory, editorMetadata.templatePackKey, metadataTemplates]);

  const selectPack = useCallback((packKey: string) => {
    const pack = metadataCatalog.packs.find((item) => item.key === packKey);
    if (!pack) {
      setEditorMetadata((prev) => ({ ...prev, templatePackKey: packKey }));
      return;
    }
    setEditorMetadata((prev) => ({
      ...prev,
      templatePackKey: pack.key,
      templatePackName: pack.name || readableMetaValue(pack.key),
      libraryCategory: prev.libraryCategory || pack.libraryCategory || "",
      industry: prev.industry || pack.industry || "",
      templatePackOrder: String(Number(pack.maxOrder || 0) + 1),
    }));
  }, [metadataCatalog.packs]);

  const addTagSuggestion = useCallback((tag: string) => {
    setEditorMetadata((prev) => {
      const tags = parseTags(prev.tags);
      if (tags.includes(tag)) return prev;
      return { ...prev, tags: [...tags, tag].join(", ") };
    });
  }, []);

  const openCreate = () => {
    setEditingTemplate(null);
    setEditorMetadata(buildEditorMetadata());
    setEditorMode("create");
  };

  const openEdit = async (id: string) => {
    setBusyId(id);
    try {
      const res = await API.admin.masterTemplateGet(id);
      const template = res?.template || null;
      setEditingTemplate(template);
      setEditorMetadata(buildEditorMetadata(template));
      setEditorMode("edit");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load template", "error");
    } finally {
      setBusyId(null);
    }
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditingTemplate(null);
    setEditorMetadata(buildEditorMetadata());
  };

  const transformPayload = useCallback((payload: any) => ({
    ...payload,
    libraryCategory: editorMetadata.libraryCategory || null,
    industry: editorMetadata.industry || null,
    templatePackKey: editorMetadata.templatePackKey || null,
    templatePackName: editorMetadata.templatePackName || null,
    templatePackOrder: editorMetadata.templatePackOrder ? Number(editorMetadata.templatePackOrder) : 0,
    tags: parseTags(editorMetadata.tags),
    featured: editorMetadata.featured,
    isOfficial: editorMetadata.isOfficial,
  }), [editorMetadata]);

  const handleCreate = async (payload: any) => {
    setSaving(true);
    try {
      await API.admin.masterTemplateCreate(payload);
      toast("System template saved as draft.", "success");
      closeEditor();
      await list.refresh();
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to create template", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload: any) => {
    if (!editingTemplate?._id) return;
    setSaving(true);
    try {
      await API.admin.masterTemplateUpdate(editingTemplate._id, payload);
      toast("System template updated.", "success");
      closeEditor();
      await list.refresh();
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Failed to update template", "error");
    } finally {
      setSaving(false);
    }
  };

  const runRowAction = useCallback(async (id: string, action: () => Promise<any>, successMessage: string, fallbackError: string) => {
    setBusyId(id);
    try {
      await action();
      toast(successMessage, "success");
      await list.refresh();
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || fallbackError, "error");
    } finally {
      setBusyId(null);
    }
  }, [list, toast]);

  const openHistory = useCallback(async (template: any) => {
    setHistoryTarget(template);
    setHistoryLoading(true);
    try {
      const response = await API.admin.masterTemplateHistory(template.id || template._id);
      setHistoryVersions(Array.isArray(response?.versions) ? response.versions : []);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load version history", "error");
      setHistoryTarget(null);
      setHistoryVersions([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [toast]);

  const restoreVersion = useCallback(async (version: TemplateVersionItem) => {
    if (!historyTarget) return;
    const templateId = historyTarget.id || historyTarget._id;
    setRestoringVersionId(version._id);
    try {
      await API.admin.masterTemplateRestoreVersion(templateId, version._id);
      toast(`Version ${version.versionNumber} restored.`, "success");
      await openHistory(historyTarget);
      await list.refresh();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to restore version", "error");
    } finally {
      setRestoringVersionId(null);
    }
  }, [historyTarget, list, openHistory, toast]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!actionMenuRef.current) return;
      if (actionMenuRef.current.contains(event.target as Node)) return;
      setOpenActionId(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const metadataFields = (
    <Card className="p-5 border border-slate-100">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-800/55">Library metadata</div>
      <div className="mt-1 text-xs text-ink-800/65">Select an existing preset or type a new value. Existing packs auto-fill name and next order.</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Library category</span>
          <input
            list="library-category-options"
            className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={editorMetadata.libraryCategory}
            onChange={(event) => setEditorMetadata((prev) => ({ ...prev, libraryCategory: normalizeMetaValue(event.target.value) }))}
            placeholder="offers"
          />
          <datalist id="library-category-options">
            {metadataCatalog.categories.map((item) => <option key={item} value={item}>{readableMetaValue(item)}</option>)}
          </datalist>
        </label>
        <label className="block">
          <span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Industry</span>
          <input
            list="library-industry-options"
            className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={editorMetadata.industry}
            onChange={(event) => setEditorMetadata((prev) => ({ ...prev, industry: normalizeMetaValue(event.target.value) }))}
            placeholder="real_estate"
          />
          <datalist id="library-industry-options">
            {metadataCatalog.industries.map((item) => <option key={item} value={item}>{readableMetaValue(item)}</option>)}
          </datalist>
        </label>
        <label className="block">
          <span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Existing pack</span>
          <select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={editorMetadata.templatePackKey} onChange={(event) => selectPack(event.target.value)}>
            <option value="">No pack / create new below</option>
            {matchingPacks.map((pack) => <option key={pack.key} value={pack.key}>{pack.name || readableMetaValue(pack.key)} ({pack.key}) - next #{Number(pack.maxOrder || 0) + 1}</option>)}
          </select>
        </label>
        <Input label="Pack key" value={editorMetadata.templatePackKey} onChange={(event) => setEditorMetadata((prev) => ({ ...prev, templatePackKey: normalizeMetaValue(event.target.value) }))} placeholder="ecommerce_pack" />
        <Input label="Pack name" value={editorMetadata.templatePackName} onChange={(event) => setEditorMetadata((prev) => ({ ...prev, templatePackName: event.target.value }))} placeholder="Ecommerce Pack" />
        <div className="space-y-1.5">
          <Input label="Pack order" type="number" min="0" value={editorMetadata.templatePackOrder} onChange={(event) => setEditorMetadata((prev) => ({ ...prev, templatePackOrder: event.target.value }))} placeholder={suggestedPackOrder || "1"} />
          {selectedPack ? (
            <button type="button" className="ml-1 text-xs font-bold text-brand-700 hover:text-brand-800" onClick={() => setEditorMetadata((prev) => ({ ...prev, templatePackOrder: suggestedPackOrder }))}>
              Use suggested order #{suggestedPackOrder}
            </button>
          ) : null}
        </div>
        <label className="block md:col-span-2">
          <span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-500">Tags</span>
          <input
            list="library-tag-options"
            className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm"
            value={editorMetadata.tags}
            onChange={(event) => setEditorMetadata((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="welcome, promo, cart recovery"
          />
          <datalist id="library-tag-options">
            {metadataCatalog.tags.map((tag) => <option key={tag} value={tag} />)}
          </datalist>
          {relevantTags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {relevantTags.slice(0, 10).map((tag) => (
                <button key={tag} type="button" onClick={() => addTagSuggestion(tag)} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700">
                  + {tag}
                </button>
              ))}
            </div>
          ) : null}
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-[5px] border border-slate-200 bg-slate-50 px-4 py-3">
          <input type="checkbox" checked={editorMetadata.featured} onChange={(event) => setEditorMetadata((prev) => ({ ...prev, featured: event.target.checked }))} />
          <span className="text-sm font-semibold text-slate-700">Featured template</span>
        </label>
        <label className="flex items-center gap-3 rounded-[5px] border border-slate-200 bg-slate-50 px-4 py-3">
          <input type="checkbox" checked={editorMetadata.isOfficial} onChange={(event) => setEditorMetadata((prev) => ({ ...prev, isOfficial: event.target.checked }))} />
          <span className="text-sm font-semibold text-slate-700">Official template</span>
        </label>
      </div>
    </Card>
  );

  if (editorMode) {
    return (
      <div className="p-4 md:p-8 pb-20">
        <TemplateForm
          open
          creating={saving}
          languageOptions={LANGUAGE_OPTIONS}
          ownerType="system"
          submissionMode="local"
          extraFields={metadataFields}
          transformPayload={transformPayload}
          mode={editorMode}
          initialStatus={(editingTemplate?.status || "draft") as any}
          initialTemplate={editingTemplate ? {
            name: editingTemplate.name,
            language: editingTemplate.language,
            category: editingTemplate.category,
            components: editingTemplate.components || [],
          } : null}
          onClose={closeEditor}
          onCreate={editorMode === "edit" ? handleUpdate : handleCreate}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Template Library CMS"
        subtitle="Manage July 22, 2026 library blueprints for AIWizChat users. These templates are local system assets and never submit to Meta."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={
          <div className="flex items-center gap-3">
            <AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />
            <Button onClick={openCreate} className="gap-2">
              <Plus size={14} /> Create Template
            </Button>
          </div>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="block">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
            <select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Featured</span>
            <select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={featuredFilter} onChange={(event) => setFeaturedFilter(event.target.value)}>
              {FEATURED_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Category</span>
            <select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {CATEGORY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Industry</span>
            <select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}>
              {INDUSTRY_OPTIONS.map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Sort</span>
            <select className="mt-1.5 w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm" value={list.sort} onChange={(event) => list.setSort(event.target.value)}>
              {SORT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </Card>

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={8} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Template" },
              { key: "category", label: "Category" },
              { key: "industry", label: "Industry" },
              { key: "status", label: "Status" },
              { key: "featured", label: "Featured" },
              { key: "tags", label: "Tags" },
              { key: "popularity", label: "Popularity" },
              { key: "actions", label: "Actions" },
            ]}
          >
            {list.items.length ? list.items.map((t: any) => (
              <tr key={t.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        <AdminTruncate text={t.name} max={35} />
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.language || "N/A"} • {t.libraryCategory || "library"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{t.category || "N/A"}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-600">{t.industry || "N/A"}</td>
                <td className="px-6 py-4">
                  <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border", statusTone(t.status))}>
                    {t.status || "UNKNOWN"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest border", t.featured ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-slate-100 text-slate-500 border-slate-200")}>
                    <Star size={10} />
                    {t.featured ? "Featured" : "Normal"}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-500">{Array.isArray(t.tags) && t.tags.length ? t.tags.slice(0, 3).join(", ") : "-"}</td>
                <td className="px-6 py-4 text-sm font-bold text-slate-700">{Number(t.popularity || 0).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="relative flex justify-end" ref={openActionId === t.id ? actionMenuRef : null}>
                    <button
                      type="button"
                      className="inline-flex size-9 items-center justify-center rounded-[5px] border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => setOpenActionId((current) => current === t.id ? null : t.id)}
                      aria-label={`Open actions for ${t.name}`}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openActionId === t.id ? (
                      <div className="absolute right-0 top-11 z-20 w-48 overflow-hidden rounded-[8px] border border-slate-200 bg-white py-1 shadow-2xl shadow-slate-200/70">
                        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={busyId === t.id} onClick={() => { setOpenActionId(null); setPreviewTarget(t); }}><Eye size={14} /> Preview</button>
                        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={busyId === t.id} onClick={() => { setOpenActionId(null); void openEdit(t.id); }}><Pencil size={14} /> Edit</button>
                        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={busyId === t.id} onClick={() => { setOpenActionId(null); void runRowAction(t.id, () => API.admin.masterTemplateDuplicate(t.id), "Template duplicated.", "Duplicate failed"); }}><Copy size={14} /> Duplicate</button>
                        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={busyId === t.id} onClick={() => { setOpenActionId(null); void openHistory(t); }}><History size={14} /> History</button>
                        {t.status !== "published" ? <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50" disabled={busyId === t.id} onClick={() => { setOpenActionId(null); void runRowAction(t.id, () => API.admin.masterTemplatePublish(t.id), "Template published.", "Publish failed"); }}><Rocket size={14} /> Publish</button> : null}
                        {t.status !== "archived" ? <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={busyId === t.id} onClick={() => { setOpenActionId(null); void runRowAction(t.id, () => API.admin.masterTemplateArchive(t.id), "Template archived.", "Archive failed"); }}><Archive size={14} /> Archive</button> : null}
                        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50" disabled={busyId === t.id} onClick={() => { setOpenActionId(null); if (confirm(`Delete "${t.name}"?`)) void runRowAction(t.id, () => API.admin.masterTemplateDelete(t.id), "Template deleted.", "Delete failed"); }}><Trash2 size={14} /> Delete</button>
                      </div>
                    ) : null}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={8}>
                  No system templates found.
                </td>
              </tr>
            )}
          </AdminTable>
          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}

      {previewTarget && previewData ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-[5px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Template preview</div>
                <h3 className="mt-1 text-xl font-black text-slate-900">{previewTarget.name}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewTarget(null)}>Close</Button>
            </div>
            <div className="grid gap-6 px-6 py-5 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-3 rounded-[5px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">Metadata</div>
                <div className="text-sm font-semibold text-slate-700">Status: {previewTarget.status}</div>
                <div className="text-sm font-semibold text-slate-700">Category: {previewTarget.category}</div>
                <div className="text-sm font-semibold text-slate-700">Industry: {previewTarget.industry || "N/A"}</div>
                <div className="text-sm font-semibold text-slate-700">Library category: {previewTarget.libraryCategory || "N/A"}</div>
                <div className="text-sm font-semibold text-slate-700">Tags: {Array.isArray(previewTarget.tags) && previewTarget.tags.length ? previewTarget.tags.join(", ") : "N/A"}</div>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <TemplatePreview
                    category={previewData.category}
                    headerType={previewData.headerType}
                    headerText={previewData.headerText}
                    mediaHandle={previewData.mediaHandle}
                    headerLocation={previewData.headerLocation}
                    bodyText={previewData.bodyText}
                    footerText={previewData.footerText}
                    ctaButtons={previewData.ctaButtons}
                    variableValues={{}}
                    headerVariableValues={{}}
                    authConfig={previewData.authConfig}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <TemplateHistoryModal
        open={!!historyTarget}
        template={historyTarget}
        versions={historyVersions}
        loading={historyLoading}
        restoringVersionId={restoringVersionId}
        onClose={() => {
          setHistoryTarget(null);
          setHistoryVersions([]);
        }}
        onRestore={(version) => {
          void restoreVersion(version);
        }}
      />
    </div>
  );
}
