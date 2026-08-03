import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Modal } from "@components/ui/Modal";
import { TemplatePreview } from "@modules/templates/components/TemplatePreview";
import { useTemplatePreviewBrand } from "@modules/templates/hooks/useTemplatePreviewBrand";
import { parseComponentsForPreview } from "@modules/templates/utils/templatePreviewHelpers";
import type { TemplateItem } from "@modules/templates/types/templates.types";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";
import { Input } from "@shared/ui/Input";
import { Select } from "@shared/ui/Select";
import { Copy, Eye, Flame, Grid2X2, Heart, Layers3, List, PackageOpen, Search, Sparkles, Star } from "lucide-react";

type ViewMode = "grid" | "list";
type SortMode = "popular" | "newest" | "recent";
type TemplatePack = {
  key: string;
  name: string;
  industry?: string | null;
  libraryCategory?: string | null;
  templateCount: number;
  templates: Array<{ _id: string; name: string; language: string; category: string; templatePackOrder?: number }>;
};

function relativeTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value).getTime();
  if (!Number.isFinite(date)) return "";
  const diff = Math.max(0, Date.now() - date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function sentenceCase(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return "General";
  return raw
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function describeTemplate(template: TemplateItem) {
  const fallback = `Ready-to-customize ${sentenceCase(template.category)} WhatsApp template for ${sentenceCase(template.industry || template.libraryCategory || "general")} journeys.`;
  const raw = String(template.description || "").trim().replace(/\s+/g, " ");
  return raw || fallback;
}

function shouldShowTemplateDescription(template: TemplateItem) {
  return false;
}

function tagSetFromTemplates(templates: TemplateItem[]) {
  return Array.from(
    new Set(
      templates.flatMap((template) => Array.isArray(template.tags) ? template.tags.map((tag) => String(tag || "").trim()).filter(Boolean) : [])
    )
  ).sort((a, b) => a.localeCompare(b));
}

export default function TemplateLibraryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [packs, setPacks] = useState<TemplatePack[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [language, setLanguage] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [previewPack, setPreviewPack] = useState<TemplatePack | null>(null);
  const previewBrand = useTemplatePreviewBrand();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [templatesResult, packsResult] = await Promise.allSettled([
          API.templates.library({ limit: 200 }),
          API.templates.libraryPacks(),
        ]);
        if (!alive) return;

        if (templatesResult.status === "fulfilled") {
          setTemplates(Array.isArray(templatesResult.value?.templates) ? templatesResult.value.templates : []);
        } else {
          setTemplates([]);
          const error = templatesResult.reason;
          toast(error?.response?.data?.message || "Failed to load template library", "error");
        }

        if (packsResult.status === "fulfilled") {
          setPacks(Array.isArray(packsResult.value?.packs) ? packsResult.value.packs : []);
        } else {
          setPacks([]);
          const error = packsResult.reason;
          toast(error?.response?.data?.message || "Failed to load template packs", "error");
        }
      } catch (e: any) {
        if (!alive) return;
        toast(e?.response?.data?.message || "Failed to load template library", "error");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [toast]);

  const categories = useMemo(
    () => Array.from(new Set(templates.map((template) => String(template.category || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [templates]
  );
  const industries = useMemo(
    () => Array.from(new Set(templates.map((template) => String(template.industry || template.libraryCategory || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [templates]
  );
  const languages = useMemo(
    () => Array.from(new Set(templates.map((template) => String(template.language || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [templates]
  );
  const tags = useMemo(() => tagSetFromTemplates(templates), [templates]);

  const filteredTemplates = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = templates.filter((template) => {
      if (featuredOnly && !template.featured) return false;
      if (category !== "all" && String(template.category || "") !== category) return false;
      if (industry !== "all" && String(template.industry || template.libraryCategory || "") !== industry) return false;
      if (language !== "all" && String(template.language || "") !== language) return false;
      if (selectedTag !== "all" && !(template.tags || []).includes(selectedTag)) return false;
      if (!needle) return true;
      const haystack = [
        template.name,
        template.description,
        template.category,
        template.industry,
        template.libraryCategory,
        template.language,
        ...(template.tags || []),
      ].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
    return [...list].sort((a, b) => {
      if (sortMode === "popular") {
        return Number(b.featured) - Number(a.featured)
          || Number(b.popularity || 0) - Number(a.popularity || 0)
          || new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      if (sortMode === "newest") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          || new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      }
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
  }, [templates, search, featuredOnly, category, industry, language, selectedTag, sortMode]);

  async function handleUseTemplate(template: TemplateItem) {
    setBusyId(template._id);
    try {
      const response = await API.templates.duplicate(template._id);
      const draftId = response?.template?._id;
      toast(`Draft created from "${template.name}".`, "success");
      if (draftId) navigate(`/app/templates?edit=${encodeURIComponent(draftId)}`);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to use template", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFavorite(template: TemplateItem) {
    setBusyId(template._id);
    try {
      if (template.isFavorite) {
        await API.templates.unfavoriteLibrary(template._id);
      } else {
        await API.templates.favoriteLibrary(template._id);
      }
      setTemplates((current) => current.map((item) => item._id === template._id ? { ...item, isFavorite: !template.isFavorite } : item));
      toast(template.isFavorite ? "Removed from favorites." : "Added to favorites.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to update favorite", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function installPack(pack: TemplatePack) {
    setBusyId(`pack:${pack.key}`);
    try {
      const response = await API.templates.installLibraryPack(pack.key);
      const created = Array.isArray(response?.templates) ? response.templates : [];
      toast(`${pack.name} installed. ${created.length} drafts created.`, "success");
      if (created[0]?._id) navigate(`/app/templates?edit=${encodeURIComponent(created[0]._id)}`);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to install template pack", "error");
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => ({
    total: templates.length,
    featured: templates.filter((template) => template.featured).length,
    industries: industries.length,
    languages: languages.length,
  }), [templates, industries.length, languages.length]);

  return (
    <div className="space-y-6 px-4">
      <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_28%),linear-gradient(135deg,#0f172a_0%,#172554_45%,#0f766e_100%)] p-0 text-white shadow-2xl shadow-slate-900/10">
        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)] md:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/80">
              <Sparkles size={14} />
              Template Library
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Browse proven WhatsApp blueprints before you build.</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-200/90">
                Explore curated templates published by AIWizChat. Preview them exactly like WhatsApp messages, pick the best fit for your workflow, then turn any template into your own editable draft.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[5px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Published</div>
                <div className="mt-2 text-3xl font-black">{stats.total}</div>
              </div>
              <div className="rounded-[5px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Featured</div>
                <div className="mt-2 text-3xl font-black">{stats.featured}</div>
              </div>
              <div className="rounded-[5px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Industries</div>
                <div className="mt-2 text-3xl font-black">{stats.industries}</div>
              </div>
              <div className="rounded-[5px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Languages</div>
                <div className="mt-2 text-3xl font-black">{stats.languages}</div>
              </div>
            </div>
          </div>

          <Card className="border border-white/10 bg-white/95 p-5 text-slate-900 shadow-none">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Find Faster</div>
            <div className="mt-4 space-y-4">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, description, tag, industry..." icon={<Search size={16} />} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="all">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{sentenceCase(item)}</option>)}
                </Select>
                <Select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="all">All industries</option>
                  {industries.map((item) => <option key={item} value={item}>{sentenceCase(item)}</option>)}
                </Select>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="all">All languages</option>
                  {languages.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
                <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
                  <option value="popular">Popular</option>
                  <option value="newest">Newest</option>
                  <option value="recent">Recently Updated</option>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFeaturedOnly((value) => !value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black transition",
                    featuredOnly ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  )}
                >
                  <Star size={14} />
                  Featured
                </button>
                <div className="ml-auto inline-flex rounded-[5px] border border-slate-200 bg-slate-50 p-1">
                  <button type="button" onClick={() => setViewMode("grid")} className={cn("rounded-[5px] px-3 py-2 text-xs font-black", viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}><Grid2X2 size={14} /></button>
                  <button type="button" onClick={() => setViewMode("list")} className={cn("rounded-[5px] px-3 py-2 text-xs font-black", viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}><List size={14} /></button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Tags</div>
        <button type="button" onClick={() => setSelectedTag("all")} className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition", selectedTag === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>All</button>
        {tags.map((tag) => (
          <button key={tag} type="button" onClick={() => setSelectedTag(tag)} className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition", selectedTag === tag ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100")}>
            #{tag}
          </button>
        ))}
      </div>

      {packs.length ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Template Packs</div>
              <div className="mt-1 text-sm font-semibold text-slate-600">Install a ready-made workflow set in one click.</div>
            </div>
          </div>
          <div className="-mx-1 overflow-x-auto pb-2 scrollbar-none">
            <div className="flex gap-4 px-1">
            {packs.map((pack) => (
              <Card key={pack.key} className="w-[320px] min-w-[320px] overflow-hidden border-ink-900/5 p-0 shadow-xl shadow-ink-900/5">
                <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-brand-500 to-amber-400" />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                        <PackageOpen size={12} />
                        Pack
                      </div>
                      <h2 className="mt-2 truncate text-lg font-black leading-tight tracking-tight text-slate-900">{pack.name}</h2>
                      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Templates</div>
                    </div>
                    <div className="min-w-[64px] rounded-[5px] bg-slate-50 px-3 py-2 text-center">
                      <div className="text-2xl font-black leading-none text-slate-900">{pack.templateCount}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{sentenceCase(pack.industry || pack.libraryCategory)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{pack.key}</span>
                  </div>
                  <div className="hidden rounded-[5px] border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Included Templates</div>
                    <div className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pr-1 scrollbar-none">
                      {pack.templates.slice(0, 6).map((template) => (
                        <div key={template._id} className="flex items-center justify-between gap-3 rounded-[5px] bg-white px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-black text-slate-900">{template.name}</div>
                            <div className="text-[11px] font-semibold text-slate-500">{sentenceCase(template.category)} • {template.language}</div>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">#{Number(template.templatePackOrder || 0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2">
                    <Button type="button" variant="outline" onClick={() => setPreviewPack(pack)} className="h-10 justify-center gap-2 px-3 whitespace-nowrap">
                      <Eye size={16} className="shrink-0" />
                      View
                    </Button>
                    <Button onClick={() => void installPack(pack)} disabled={busyId === `pack:${pack.key}`} className="h-10 px-3 whitespace-nowrap text-xs">
                      {busyId === `pack:${pack.key}` ? "Installing..." : `Install ${pack.name}`}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className={cn("grid gap-4", viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1")}>
          {Array.from({ length: viewMode === "grid" ? 6 : 4 }).map((_, index) => (
            <Card key={index} className="overflow-hidden border-ink-900/5 p-0 shadow-xl shadow-ink-900/5">
              <div className="h-1.5 bg-slate-100" />
              <div className="space-y-4 p-5">
                <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                <div className="h-28 animate-pulse rounded-[5px] bg-slate-100" />
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && filteredTemplates.length === 0 ? (
        <Card className="border-ink-900/5 p-10 text-center shadow-xl shadow-ink-900/5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Layers3 size={22} />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">No templates match these filters.</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">Try another category, remove a tag, or switch from featured-only mode.</p>
        </Card>
      ) : null}

      {!loading ? (
        <div className={cn("gap-4", viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3" : "space-y-4")}>
          {filteredTemplates.map((template) => {
            const preview = parseComponentsForPreview(template.components);
            const isBusy = busyId === template._id;
            const description = describeTemplate(template);
            const showDescription = shouldShowTemplateDescription(template);
            return (
              <Card
                key={template._id}
                className={cn(
                  "group overflow-hidden border-ink-900/5 p-0 shadow-xl shadow-ink-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-200/70",
                  viewMode === "list" ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_320px]" : ""
                )}
              >
                <div className="h-1.5 bg-gradient-to-r from-brand-500 via-emerald-500 to-amber-400" />
                <div className={cn("gap-5 p-5", viewMode === "list" ? "grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px]" : "space-y-4")}>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-[36px] font-black leading-none tracking-tight text-slate-900">{template.name}</h2>
                          {template.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-700"><Flame size={12} /> Featured</span> : null}
                          {template.isOfficial ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Official</span> : null}
                        </div>
                        {showDescription ? <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">{description}</p> : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Popularity</div>
                        <div className="mt-1 text-3xl font-black leading-none text-slate-900">{Number(template.popularity || 0)}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">{sentenceCase(template.category)}</span>
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{sentenceCase(template.industry || template.libraryCategory)}</span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{template.language || "en_US"}</span>
                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">Updated {relativeTime(template.updatedAt)}</span>
                      {template.createdAt ? <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">New {relativeTime(template.createdAt)}</span> : null}
                    </div>

                    {(template.tags || []).length ? (
                      <div className="flex flex-wrap gap-2">
                        {(template.tags || []).slice(0, 6).map((tag) => (
                          <button key={tag} type="button" onClick={() => setSelectedTag(tag)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
                            #{tag}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" onClick={() => setPreviewTemplate(template)} className="h-11 w-full justify-center gap-2 px-3"><Eye size={15} /> Preview</Button>
                      <Button variant="ghost" onClick={() => void toggleFavorite(template)} disabled={isBusy} className={cn("h-11 w-full justify-center gap-2 border px-3", template.isFavorite ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                        <Heart size={15} className={template.isFavorite ? "fill-current" : ""} />
                        {template.isFavorite ? "Favorite" : "Add Favorite"}
                      </Button>
                      <Button onClick={() => handleUseTemplate(template)} disabled={isBusy} className="h-11 w-full justify-center gap-2 px-3">{isBusy ? "Creating Draft..." : <><Copy size={15} /> Use Template</>}</Button>
                    </div>
                  </div>

                  <div className="rounded-[5px] border border-slate-200 bg-slate-50/70 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">WhatsApp Preview</div>
                      <button type="button" onClick={() => setPreviewTemplate(template)} className="text-xs font-bold text-brand-700 hover:text-brand-800">Expand</button>
                    </div>
                    <div className="mx-auto max-w-[280px] scale-[0.9] origin-top">
                      <TemplatePreview
                        category={template.category}
                        headerType={preview.headerType}
                        headerText={preview.headerText}
                        mediaHandle={preview.mediaHandle}
                        headerLocation={preview.headerLocation}
                        bodyText={preview.bodyText}
                        footerText={preview.footerText}
                        ctaButtons={preview.ctaButtons}
                        variableValues={{}}
                        authConfig={preview.authConfig}
                        previewBrand={previewBrand}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      <Modal open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title={previewTemplate ? `Preview • ${previewTemplate.name}` : "Preview"} className="max-w-5xl">
        {previewTemplate ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_360px]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-700">{sentenceCase(previewTemplate.category)}</span>
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{sentenceCase(previewTemplate.industry || previewTemplate.libraryCategory)}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{previewTemplate.language}</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">{previewTemplate.name}</h3>
                {shouldShowTemplateDescription(previewTemplate) ? <p className="mt-2 text-sm leading-6 text-slate-600">{describeTemplate(previewTemplate)}</p> : null}
              </div>
              {(previewTemplate.tags || []).length ? (
                <div className="flex flex-wrap gap-2">
                  {(previewTemplate.tags || []).map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600">#{tag}</span>
                  ))}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[5px] border border-slate-200 p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Popular Score</div>
                  <div className="mt-1 text-2xl font-black text-slate-900">{Number(previewTemplate.popularity || 0)}</div>
                </div>
                <div className="rounded-[5px] border border-slate-200 p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Created</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{relativeTime(previewTemplate.createdAt)}</div>
                </div>
                <div className="rounded-[5px] border border-slate-200 p-3">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Updated</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{relativeTime(previewTemplate.updatedAt)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => void toggleFavorite(previewTemplate)} disabled={busyId === previewTemplate._id} className={cn("border", previewTemplate.isFavorite ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}>
                  <Heart size={15} className={previewTemplate.isFavorite ? "fill-current" : ""} />
                  {previewTemplate.isFavorite ? "Favorite" : "Add Favorite"}
                </Button>
                <Button onClick={() => void handleUseTemplate(previewTemplate)} disabled={busyId === previewTemplate._id}>
                  {busyId === previewTemplate._id ? "Creating Draft..." : <><Copy size={15} /> Use Template</>}
                </Button>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
              </div>
            </div>

            <div className="rounded-[5px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Message Preview</div>
              <div className="mx-auto max-w-[300px]">
                {(() => {
                  const parsed = parseComponentsForPreview(previewTemplate.components);
                  return (
                    <TemplatePreview
                      category={previewTemplate.category}
                      headerType={parsed.headerType}
                      headerText={parsed.headerText}
                      mediaHandle={parsed.mediaHandle}
                      headerLocation={parsed.headerLocation}
                      bodyText={parsed.bodyText}
                      footerText={parsed.footerText}
                      ctaButtons={parsed.ctaButtons}
                      variableValues={{}}
                      authConfig={parsed.authConfig}
                      previewBrand={previewBrand}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
      <Modal open={!!previewPack} onClose={() => setPreviewPack(null)} title={previewPack ? `${previewPack.name} Details` : "Pack Details"} className="max-w-3xl">
        {previewPack ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                  <PackageOpen size={12} />
                  Pack
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{previewPack.name}</h3>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-600">
                  Install a starter sequence with {previewPack.templateCount} ready-to-edit templates for {sentenceCase(previewPack.industry || previewPack.libraryCategory || "general")} journeys.
                </p>
              </div>
              <div className="rounded-[5px] border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Templates</div>
                <div className="mt-1 text-3xl font-black leading-none text-slate-900">{previewPack.templateCount}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">{sentenceCase(previewPack.industry || previewPack.libraryCategory)}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{previewPack.key}</span>
            </div>

            <div className="rounded-[5px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Included Templates</div>
              <div className="mt-3 grid gap-2">
                {previewPack.templates.map((template) => (
                  <div key={template._id} className="flex items-center justify-between gap-3 rounded-[5px] border border-slate-200 bg-white px-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-900">{template.name}</div>
                      <div className="text-[11px] font-semibold text-slate-500">{sentenceCase(template.category)} • {template.language}</div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">#{Number(template.templatePackOrder || 0)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="outline" onClick={() => setPreviewPack(null)}>Close</Button>
              <Button onClick={() => void installPack(previewPack)} disabled={busyId === `pack:${previewPack.key}`}>
                {busyId === `pack:${previewPack.key}` ? "Installing..." : `Install ${previewPack.name}`}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
