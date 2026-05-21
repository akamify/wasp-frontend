import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "highlight.js/styles/github.css";
import { ArrowLeft, X } from "lucide-react";

type Doc = any;

const EMPTY_DOC = {
  id: "",
  title: "",
  slug: "",
  description: "",
  content: "",
  keywords: [] as string[],
  category: "general",
  status: "draft",
  sidebar: { section: "", sectionOrder: 0, itemOrder: 0 },
  seo: { metaTitle: "", metaDescription: "", ogImage: "", noIndex: false },
};

const TOOLBAR = [
  { label: "Text", title: "Text Block" },
  { label: "H", title: "Heading" },
  { label: "Sec", title: "Section Heading" },
  { label: "B", title: "Bold" },
  { label: "I", title: "Italic" },
  { label: "Link", title: "Link" },
  { label: "Code", title: "Code Block" },
  { label: "JSON", title: "API Response" },
  { label: "Resp", title: "Response Block" },
  { label: "Callout", title: "Callout Block" },
  { label: "Bash", title: "Bash Command" },
  { label: "Key", title: "Key Capability" },
  { label: "Mermaid", title: "Mermaid Diagram" },
  { label: "Step", title: "Step Card" },
] as const;
const CMS_PAGE_SLUGS = new Set(["about", "privacy-policy", "terms-of-service", "cookie-policy", "help-center", "careers"]);
const NON_DOC_SYSTEM_SLUGS = new Set(["brand", "settings", "home", "dashboard", "profile"]);
const KNOWN_DOC_SLUGS = new Set(["introduction", "quick-start", "authentication", "meta-setup", "webhooks"]);

function normalizeSlug(value: any) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isLikelyDocPage(item: any) {
  const slug = normalizeSlug(item?.slug);
  if (!slug) return false;
  if (NON_DOC_SYSTEM_SLUGS.has(slug)) return false;
  if (slug.startsWith("docs/") || slug.startsWith("docs-")) return true;
  if (KNOWN_DOC_SLUGS.has(slug)) return true;
  const data = item?.data || {};
  const hasDocType = String(data?.__type || data?.type || "").toLowerCase() === "doc";
  const hasDocShape =
    typeof data?.content === "string" ||
    typeof data?.description === "string" ||
    Array.isArray(data?.keywords) ||
    typeof data?.category === "string" ||
    typeof data?.order === "number" ||
    typeof data?.status === "string" ||
    !!data?.sidebar ||
    !!data?.seo;
  const hasMarkdownBody = typeof data?.bodyMarkdown === "string" && data.bodyMarkdown.trim().length > 0;

  if (hasDocType || hasDocShape) return true;
  if (hasMarkdownBody && !CMS_PAGE_SLUGS.has(slug)) return true;
  return false;
}

function mapPageToDoc(item: any, index: number) {
  const slug = normalizeSlug(item?.slug);
  const data = item?.data || {};
  const nested = data?.data && typeof data.data === "object" ? data.data : {};
  const source = { ...nested, ...data };
  const content = String(
    source?.content ||
      source?.bodyMarkdown ||
      source?.introMarkdown ||
      source?.markdown ||
      ""
  );
  const status = String(source?.status || "").toLowerCase();
  const normalizedStatus = status === "published" ? "published" : "draft";
  const category = String(source?.category || source?.sidebar?.section || "general");
  const keywords = Array.isArray(source?.keywords) ? source.keywords : [];
  return {
    id: String(item?.id || item?._id || slug || `doc-fallback-${index}`),
    slug,
    title: String(source?.title || item?.title || slug || "Untitled"),
    description: String(source?.description || ""),
    content,
    keywords,
    category,
    status: normalizedStatus,
    sidebar: {
      section: String(source?.sidebar?.section || category),
      sectionOrder: Number(source?.sidebar?.sectionOrder || 0),
      itemOrder: Number(source?.sidebar?.itemOrder || index + 1),
    },
    seo: {
      metaTitle: String(source?.seo?.metaTitle || source?.title || ""),
      metaDescription: String(source?.seo?.metaDescription || source?.description || ""),
      ogImage: String(source?.seo?.ogImage || ""),
      noIndex: !!source?.seo?.noIndex,
    },
    updatedAt: item?.updatedAt,
  };
}

function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitBlocks(content: string) {
  return String(content || "")
    .split(/\n{2,}/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function detectBlockLabel(snippet: string) {
  const s = String(snippet || "").trim();
  if (!s) return "Text Block";
  if (/^:::step-card/i.test(s)) return "Step Card";
  if (/^:::callout/i.test(s)) return "Callout Block";
  if (/^\*\s+\*\*.+\*\*\s*:/.test(s)) return "Key Capability";
  if (/^####\s+.*\n```json/i.test(s)) return "Response Block";
  if (/^```mermaid/i.test(s)) return "Mermaid Diagram";
  if (/^```bash/i.test(s)) return "Bash Command";
  if (/^```json/i.test(s)) return "API Response";
  if (/^```/.test(s)) return "Code Block";
  if (/^###\s+/.test(s)) return "Section Heading";
  if (/^#\s+/.test(s)) return "Heading";
  if (/^\*\*.+\*\*$/.test(s)) return "Bold";
  if (/^\*[^\n]+\*$/.test(s)) return "Italic";
  if (/^\[[^\]]+\]\([^\)]+\)$/.test(s)) return "Link";
  return "Text Block";
}

function MarkdownPreview({ content }: { content: string }) {
  const previewMarkdown = useMemo(() => {
    const source = String(content || "");
    return source.replace(/:::step-card\s*([\s\S]*?):::/g, (_m, inner) => `<div class="step-card">\n${String(inner || "").trim()}\n</div>`);
  }, [content]);

  return (
    <div className="docs-preview bg-[#f8fafc] p-8">
      <style>{`
        .docs-preview { color:#64748b; line-height:1.72; font-size:15px; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
        .docs-preview h1,.docs-preview h2,.docs-preview h3 { color:#0f172a; margin:0; }
        .docs-preview h1 { font-size:22px; font-weight:700; line-height:1.1; margin:0 0 22px; letter-spacing:0.1em; text-transform:uppercase; }
        .docs-preview h2,.docs-preview h3 { font-size:16px; font-weight:700; line-height:1.35; margin:42px 0 16px; letter-spacing:0.14em; text-transform:uppercase; }
        .docs-preview p { margin:0 0 22px; }
        .docs-preview ul { margin:0 0 20px 30px; }
        .docs-preview li { margin:0 0 14px; }
        .docs-preview li::marker { color:#d1d5db; }
        .docs-preview strong { color:#111827; font-weight:600; }
        .docs-preview .step-card { border:1px solid #dbe1ea; border-radius:8px; padding:26px 28px; background:#f8fafc; margin:18px 0; }
        .docs-preview a { color:#111827; font-weight:700; text-decoration:underline; text-underline-offset:4px; }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeHighlight]}>
        {previewMarkdown}
      </ReactMarkdown>
    </div>
  );
}

export default function AdminDocsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isSuperAdminPath = location.pathname.startsWith("/super-admin");
  const docsBasePath = isSuperAdminPath ? "/super-admin/docs" : "/admin/docs";
  const isEditorRoute = /\/docs\/(create|[^/]+\/edit)$/.test(location.pathname);

  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [addedBlocks, setAddedBlocks] = useState<Array<{ id: string; label: string; snippet: string }>>([]);

  const [activeTool, setActiveTool] = useState<(typeof TOOLBAR)[number] | null>(null);
  const [toolForm, setToolForm] = useState<any>({
    text: "",
    title: "",
    description: "",
    url: "https://example.com",
    buttonText: "Learn more",
    language: "ts",
    code: "const example = true;",
    keyTitle: "",
    keyDescription: "",
    responseTitle: "Response",
    responseStatus: "200 OK",
    responseBody: '{\n  "success": true\n}',
    calloutType: "error",
    calloutTitle: "Unauthorized Request",
    calloutDescription: "If your API token is invalid, expired, or has been revoked, you will receive a `401 Unauthorized` response.",
  });

  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const [brandModal, setBrandModal] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandUploading, setBrandUploading] = useState(false);
  const [brandUploadPct, setBrandUploadPct] = useState(0);
  const [brandSettings, setBrandSettings] = useState({ brandName: "", brandLogoUrl: "" });

  const liveContent = useMemo(() => {
    if (!editing) return "";
    return addedBlocks.map((b) => b.snippet).join("\n\n");
  }, [editing, addedBlocks]);

  const canCreate = useMemo(
    () => user?.role === "super_admin" || !!user?.permissions?.components?.includes("docs.create") || !!user?.permissions?.actions?.includes("docs.create"),
    [user]
  );
  const canEdit = useMemo(
    () => user?.role === "super_admin" || !!user?.permissions?.components?.includes("docs.edit") || !!user?.permissions?.actions?.includes("docs.edit"),
    [user]
  );
  const canDelete = useMemo(
    () => user?.role === "super_admin" || !!user?.permissions?.components?.includes("docs.delete") || !!user?.permissions?.actions?.includes("docs.delete"),
    [user]
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [docsRes, brandRes]: any = await Promise.allSettled([API.admin.docsList(), API.admin.docsBrandGet()]);
      const docsData = docsRes?.status === "fulfilled" ? docsRes.value : null;
      const brandData = brandRes?.status === "fulfilled" ? brandRes.value : null;
      let nextItems = Array.isArray(docsData?.items) ? docsData.items : [];
      if (!nextItems.length) {
        try {
          const pagesRes: any = await API.admin.pages();
          const pagesItems = Array.isArray(pagesRes?.items) ? pagesRes.items : [];
          nextItems = pagesItems.filter(isLikelyDocPage).map(mapPageToDoc);
        } catch (_e) {
          nextItems = [];
        }
      }
      setItems(nextItems);
      setBrandSettings({
        brandName: String(brandData?.settings?.brandName || docsData?.meta?.brandName || ""),
        brandLogoUrl: String(brandData?.settings?.brandLogoUrl || docsData?.meta?.brandLogoUrl || ""),
      });

      if (docsRes?.status === "rejected") {
        throw docsRes.reason;
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load docs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isEditorRoute) {
      setEditing(null);
      setAddedBlocks([]);
      return;
    }
    const initEditor = async () => {
      if (location.pathname.endsWith("/create")) {
        setEditing({ ...EMPTY_DOC });
        setAddedBlocks([]);
        return;
      }
      if (!id) return;
      try {
        const res: any = await API.admin.docsGet(id);
        const doc = { ...(res?.doc || EMPTY_DOC) };
        setEditing(doc);
        setAddedBlocks(
          splitBlocks(doc.content).map((snippet, i) => ({
            id: `loaded-${i}-${Date.now()}`,
            label: detectBlockLabel(snippet),
            snippet,
          }))
        );
      } catch (e: any) {
        toast(e?.response?.data?.message || "Failed to load doc", "error");
        navigate(docsBasePath, { replace: true });
      }
    };
    initEditor();
  }, [id, isEditorRoute, location.pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) =>
        String(x.title || "").toLowerCase().includes(q) ||
        String(x.slug || "").toLowerCase().includes(q) ||
        String(x.category || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  function syncBlocks(next: Array<{ id: string; label: string; snippet: string }>) {
    setAddedBlocks(next);
    setEditing((p: any) => (p ? { ...p, content: next.map((x) => x.snippet).join("\n\n") } : p));
  }

  function insertSnippet(snippet: string, label: string) {
    const next = [...addedBlocks, { id: `${Date.now()}-${Math.random()}`, label, snippet: snippet.trim() }];
    syncBlocks(next);
  }

  function saveToolBlock() {
    if (!activeTool) return;
    const label = activeTool.title;
    if (activeTool.label === "Text") return insertSnippet(toolForm.text || "Write text...", label), setActiveTool(null);
    if (activeTool.label === "H") return insertSnippet(`# ${toolForm.text || "Heading"}`, label), setActiveTool(null);
    if (activeTool.label === "Sec") return insertSnippet(`### ${toolForm.text || "Section Title"}`, label), setActiveTool(null);
    if (activeTool.label === "B") return insertSnippet(`**${toolForm.text || "text"}**`, label), setActiveTool(null);
    if (activeTool.label === "I") return insertSnippet(`*${toolForm.text || "text"}*`, label), setActiveTool(null);
    if (activeTool.label === "Link") return insertSnippet(`[${toolForm.text || "text"}](${toolForm.url || "https://example.com"})`, label), setActiveTool(null);
    if (["Code", "JSON", "Bash", "Mermaid"].includes(activeTool.label)) {
      return insertSnippet(`\`\`\`${toolForm.language}\n${toolForm.code}\n\`\`\``, label), setActiveTool(null);
    }
    if (activeTool.label === "Resp") {
      return insertSnippet(`#### ${toolForm.responseTitle || "Response"} (${toolForm.responseStatus || "200 OK"})\n\`\`\`json\n${toolForm.responseBody}\n\`\`\``, label), setActiveTool(null);
    }
    if (activeTool.label === "Callout") {
      return insertSnippet(`:::callout type="${toolForm.calloutType}"\n**${toolForm.calloutTitle}**\n${toolForm.calloutDescription}\n:::`, label), setActiveTool(null);
    }
    if (activeTool.label === "Key") {
      return insertSnippet(`* **${toolForm.keyTitle || "Capability"}**: ${toolForm.keyDescription || "Description"}`, label), setActiveTool(null);
    }
    if (activeTool.label === "Step") {
      const step = Math.max(1, addedBlocks.filter((x) => x.label === "Step Card").length + 1);
      return insertSnippet(`:::step-card\n#### ${step}. ${toolForm.title || "Step Title"}\n${toolForm.description || "Step description"} [${toolForm.buttonText || "Learn more"}](${toolForm.url || "./quick-start"})\n:::`, label), setActiveTool(null);
    }
  }

  async function saveDoc() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        slug: editing.slug || slugify(editing.title),
        keywords: Array.isArray(editing.keywords)
          ? editing.keywords
          : String(editing.keywords || "")
              .split(",")
              .map((x: string) => x.trim())
              .filter(Boolean),
        sidebar: {
          ...(editing.sidebar || {}),
          section: String(editing.category || "general").trim() || "general",
        },
        seo: {
          ...(editing.seo || {}),
          metaTitle: String(editing.title || ""),
          metaDescription: String(editing.description || ""),
          ogImage: "",
        },
      };
      if (editing.id) await API.admin.docsUpdate(editing.id, payload);
      else await API.admin.docsCreate(payload);
      toast("Doc saved", "success");
      await load();
      navigate(docsBasePath);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to save doc", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveBrandSettings() {
    setBrandSaving(true);
    try {
      const res: any = await API.admin.docsBrandUpdate(brandSettings);
      setBrandSettings({
        brandName: String(res?.settings?.brandName || ""),
        brandLogoUrl: String(res?.settings?.brandLogoUrl || ""),
      });
      toast("Docs brand settings saved", "success");
      setBrandModal(false);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to save brand settings", "error");
    } finally {
      setBrandSaving(false);
    }
  }

  async function uploadBrandLogo(file?: File | null) {
    if (!file) return;
    setBrandUploading(true);
    setBrandUploadPct(0);
    try {
      const res: any = await API.admin.docsBrandUploadLogo(file, (pct: number) => setBrandUploadPct(pct));
      const logoUrl = String(res?.logoUrl || "").trim();
      if (!logoUrl) throw new Error("Invalid upload response");
      setBrandSettings((prev) => ({ ...prev, brandLogoUrl: logoUrl }));
      toast("Logo uploaded", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Logo upload failed", "error");
    } finally {
      setBrandUploading(false);
      setBrandUploadPct(0);
    }
  }

  async function openPreview(docId: string) {
    setPreviewLoading(true);
    setPreviewDoc(null);
    try {
      const res: any = await API.admin.docsGet(docId);
      setPreviewDoc(res?.doc || null);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load preview", "error");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;
    try {
      await API.admin.docsDelete(deleteTarget.id);
      toast("Doc deleted", "success");
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to delete doc", "error");
    }
  }

  if (isEditorRoute) {
    return (
      <div className="flex h-[calc(100vh-4px)] flex-col p-2">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button onClick={saveDoc} disabled={saving || (!editing?.id && !canCreate) || (!!editing?.id && !canEdit)}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
        {!editing ? (
          <TableSkeleton rows={6} cols={4} />
        ) : (
          <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
            <div className="overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-4">
              <div className="space-y-3">
                <Input label="Title" value={editing.title} onChange={(e) => setEditing((p: any) => ({ ...p, title: e.target.value }))} />
                <Input label="Slug" value={editing.slug} onChange={(e) => setEditing((p: any) => ({ ...p, slug: slugify(e.target.value) }))} />
                <Input label="Description" value={editing.description} onChange={(e) => setEditing((p: any) => ({ ...p, description: e.target.value }))} />
                <Input
                  label="Keywords (comma separated)"
                  value={Array.isArray(editing.keywords) ? editing.keywords.join(", ") : String(editing.keywords || "")}
                  onChange={(e) => setEditing((p: any) => ({ ...p, keywords: e.target.value }))}
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Input label="Category" value={editing.category || ""} onChange={(e) => setEditing((p: any) => ({ ...p, category: e.target.value }))} />
                  <Select label="Status" value={editing.status} onChange={(e) => setEditing((p: any) => ({ ...p, status: e.target.value }))}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                  </Select>
                </div>
                <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Add Blocks</div>
                  <div className="flex flex-wrap gap-2">
                    {TOOLBAR.map((b) => (
                      <Button
                        key={b.label}
                        type="button"
                        variant="outline"
                        className="h-8 px-2 text-xs"
                        onClick={() => setActiveTool(b)}
                        disabled={(!editing?.id && !canCreate) || (!!editing?.id && !canEdit)}
                      >
                        {b.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[5px] border border-slate-200 bg-white p-3">
                  <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Blocks</div>
                  <div className="space-y-2">
                    {addedBlocks.map((b, idx) => (
                      <div key={b.id} className="flex items-center justify-between rounded-[5px] border border-slate-200 px-3 py-2 text-xs">
                        <span className="font-black text-slate-900">{idx + 1}. {b.label}</span>
                        <Button type="button" variant="ghost" className="h-7 px-2" onClick={() => syncBlocks(addedBlocks.filter((x) => x.id !== b.id))}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-4">
              <div className="mb-3 border-b border-slate-100 pb-3 text-sm font-black text-slate-900">Live Preview</div>
              <MarkdownPreview content={liveContent} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6">
      <AdminToolbar
        title="Docs"
        subtitle="Manage docs content, preview, publish state, and docs branding from one place."
        query={query}
        setQuery={setQuery}
        onRefresh={load}
        isSyncing={loading}
        right={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setBrandModal(true)}>Brand & Logo</Button>
            <Button onClick={() => navigate(`${docsBasePath}/create`)} disabled={!canCreate}>Create Doc</Button>
          </div>
        }
      />
      {error ? <Alert variant="danger">{error}</Alert> : null}

      {loading ? (
        <TableSkeleton rows={7} cols={5} />
      ) : (
        <AdminTable columns={[
          { key: "title", label: "Title" },
          { key: "slug", label: "Slug" },
          { key: "category", label: "Category" },
          { key: "status", label: "Status" },
          { key: "actions", label: "Actions" },
        ]}>
          {filtered.map((d) => (
            <tr key={d.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openPreview(d.id)}>
              <td className="px-6 py-4 text-sm font-bold">{d.title}</td>
              <td className="px-6 py-4 text-xs">{d.slug}</td>
              <td className="px-6 py-4 text-xs">{d.category || "general"}</td>
              <td className="px-6 py-4 text-xs font-bold uppercase">{d.status || "draft"}</td>
              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate(`${docsBasePath}/${d.id}/edit`)} disabled={!canEdit}>Edit</Button>
                  <Button variant="ghost" onClick={() => setDeleteTarget(d)} disabled={!canDelete}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal isOpen={brandModal} onClose={() => setBrandModal(false)} title="Docs Brand Settings">
        <div className="space-y-3">
          <Input label="Brand Name" value={brandSettings.brandName} onChange={(e) => setBrandSettings((p) => ({ ...p, brandName: e.target.value }))} />
          <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Logo Upload</div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="docs-brand-logo-file">
                <input
                  id="docs-brand-logo-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => uploadBrandLogo(e.target.files?.[0] || null)}
                />
                <span className="inline-flex h-9 cursor-pointer items-center rounded-[5px] border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">
                  {brandUploading ? `Uploading ${brandUploadPct}%` : "Upload Logo"}
                </span>
              </label>
              {brandSettings.brandLogoUrl ? (
                <Button variant="ghost" type="button" onClick={() => setBrandSettings((p) => ({ ...p, brandLogoUrl: "" }))}>
                  Remove
                </Button>
              ) : null}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">Allowed: PNG, JPG, WEBP, SVG. Max size: 5MB.</div>
          </div>
          <Input label="Logo URL" value={brandSettings.brandLogoUrl} onChange={(e) => setBrandSettings((p) => ({ ...p, brandLogoUrl: e.target.value }))} />
          {brandSettings.brandLogoUrl ? (
            <div className="rounded-[5px] border border-slate-200 p-3">
              <img src={brandSettings.brandLogoUrl} alt="Docs brand logo" className="h-14 w-auto object-contain" />
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBrandModal(false)}>Cancel</Button>
            <Button onClick={saveBrandSettings} disabled={brandSaving || brandUploading}>{brandSaving ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Doc">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-bold text-slate-900">{deleteTarget?.title}</span>?</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={previewLoading || !!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || "Doc Preview"}
        className="max-w-[1400px]"
      >
        {previewLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : previewDoc ? (
          <div className="max-h-[82vh] overflow-auto rounded-[5px] border border-slate-200 bg-white">
            <MarkdownPreview content={String(previewDoc.content || "")} />
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={!!activeTool} onClose={() => setActiveTool(null)} title={activeTool ? `Add ${activeTool.title}` : ""}>
        {activeTool ? (
          <div className="space-y-3">
            {["Text", "H", "Sec", "B", "I"].includes(activeTool.label) ? (
              <Input label="Text" value={toolForm.text} onChange={(e) => setToolForm((p: any) => ({ ...p, text: e.target.value }))} />
            ) : null}
            {activeTool.label === "Link" ? (
              <>
                <Input label="Text" value={toolForm.text} onChange={(e) => setToolForm((p: any) => ({ ...p, text: e.target.value }))} />
                <Input label="URL" value={toolForm.url} onChange={(e) => setToolForm((p: any) => ({ ...p, url: e.target.value }))} />
              </>
            ) : null}
            {["Code", "JSON", "Bash", "Mermaid"].includes(activeTool.label) ? (
              <>
                <Input label="Language" value={toolForm.language} onChange={(e) => setToolForm((p: any) => ({ ...p, language: e.target.value }))} />
                <Textarea label="Code" rows={8} value={toolForm.code} onChange={(e) => setToolForm((p: any) => ({ ...p, code: e.target.value }))} />
              </>
            ) : null}
            {activeTool.label === "Resp" ? (
              <>
                <Input label="Response Title" value={toolForm.responseTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, responseTitle: e.target.value }))} />
                <Input label="Status" value={toolForm.responseStatus} onChange={(e) => setToolForm((p: any) => ({ ...p, responseStatus: e.target.value }))} />
                <Textarea label="Response JSON" rows={8} value={toolForm.responseBody} onChange={(e) => setToolForm((p: any) => ({ ...p, responseBody: e.target.value }))} />
              </>
            ) : null}
            {activeTool.label === "Callout" ? (
              <>
                <Select label="Type" value={toolForm.calloutType} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutType: e.target.value }))}>
                  <option value="info">info</option>
                  <option value="warning">warning</option>
                  <option value="success">success</option>
                  <option value="error">error</option>
                </Select>
                <Input label="Title" value={toolForm.calloutTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutTitle: e.target.value }))} />
                <Textarea label="Description" rows={5} value={toolForm.calloutDescription} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutDescription: e.target.value }))} />
              </>
            ) : null}
            {activeTool.label === "Key" ? (
              <>
                <Input label="Title" value={toolForm.keyTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, keyTitle: e.target.value }))} />
                <Textarea label="Description" rows={4} value={toolForm.keyDescription} onChange={(e) => setToolForm((p: any) => ({ ...p, keyDescription: e.target.value }))} />
              </>
            ) : null}
            {activeTool.label === "Step" ? (
              <>
                <Input label="Step Title" value={toolForm.title} onChange={(e) => setToolForm((p: any) => ({ ...p, title: e.target.value }))} />
                <Textarea label="Step Description" rows={3} value={toolForm.description} onChange={(e) => setToolForm((p: any) => ({ ...p, description: e.target.value }))} />
                <Input label="Button Text" value={toolForm.buttonText} onChange={(e) => setToolForm((p: any) => ({ ...p, buttonText: e.target.value }))} />
                <Input label="Button URL" value={toolForm.url} onChange={(e) => setToolForm((p: any) => ({ ...p, url: e.target.value }))} />
              </>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setActiveTool(null)}>Cancel</Button>
              <Button onClick={saveToolBlock}>Save</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
