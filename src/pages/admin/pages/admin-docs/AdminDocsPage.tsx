import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { useAuth } from "@shared/providers/AuthContext";
import { useToast } from "@shared/providers/ToastContext";
import { EMPTY_DOC, TOOLBAR, detectBlockLabel, slugify, splitBlocks } from "./constants";
import { EditorScreen } from "./EditorScreen";
import { ListScreen } from "./ListScreen";

type Doc = any;
type EditorBlock = { id: string; label: string; snippet: string; block?: any };

function blockToSnippet(block: any) {
  const type = String(block?.type || "text");
  if (type === "heading") return `${"#".repeat(Math.max(1, Math.min(Number(block?.level || 2), 4)))} ${String(block?.value || "")}`;
  if (type === "text") return String(block?.value || "");
  if (type === "list") return (Array.isArray(block?.items) ? block.items : []).map((item: string) => `- ${item}`).join("\n");
  if (type === "callout") return `:::callout type="${String(block?.tone || "info")}"\n**${String(block?.title || "Note")}**\n${String(block?.description || "")}\n:::`;
  if (type === "image") return `![${String(block?.caption || "Image")}](${String(block?.url || "")})`;
  if (type === "video") return `:::video\nTitle: ${String(block?.title || "Video Tutorial")}\nURL: ${String(block?.url || "")}\nCaption: ${String(block?.caption || "")}\nDuration: ${String(block?.duration || "")}\n:::`;
  if (type === "api-endpoint") {
    return [
      ":::api-endpoint",
      `Title: ${String(block?.title || "API Endpoint")}`,
      `Method: ${String(block?.method || "POST")}`,
      `Endpoint: ${String(block?.endpoint || "/api/example")}`,
      `Auth: ${String(block?.auth || "X-API-KEY")}`,
      "Request:",
      String(block?.requestExample || "{}"),
      "Response:",
      String(block?.responseExample || "{}"),
      ":::",
    ].join("\n");
  }
  if (type === "table") {
    const columns = Array.isArray(block?.columns) ? block.columns : [];
    const rows = Array.isArray(block?.rows) ? block.rows : [];
    const header = `| ${columns.join(" | ")} |`;
    const divider = `| ${columns.map(() => "---").join(" | ")} |`;
    const body = rows.map((row: any[]) => `| ${row.map((cell) => String(cell || "")).join(" | ")} |`);
    return [header, divider, ...body].join("\n");
  }
  if (type === "code" || type === "response") return `\`\`\`${String(block?.language || "text")}\n${String(block?.code || block?.responseBody || "")}\n\`\`\``;
  return String(block?.value || block?.content || "");
}

function snippetToBlock(snippet: string, label: string) {
  const text = String(snippet || "").trim();
  const lines = text.split("\n");
  if (/^###\s+/.test(text)) return { type: "heading", level: 3, value: text.replace(/^###\s+/, "") };
  if (/^#\s+/.test(text)) return { type: "heading", level: 1, value: text.replace(/^#\s+/, "") };
  if (/^!\[([^\]]*)\]\(([^)]+)\)/.test(text)) {
    const match = text.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    return { type: "image", caption: match?.[1] || "", url: match?.[2] || "" };
  }
  if (/^:::callout/i.test(text)) {
    const tone = text.match(/type="([^"]+)"/i)?.[1] || "info";
    const body = lines.slice(1, -1);
    const titleLine = body.find((line) => /^\*\*.+\*\*$/.test(line.trim()));
    const title = titleLine ? titleLine.replace(/^\*\*|\*\*$/g, "").trim() : label;
    const description = body.filter((line) => line !== titleLine).join("\n").trim();
    return { type: "callout", tone, title, description };
  }
  if (/^:::video/i.test(text)) {
    const title = text.match(/Title:\s*(.+)/i)?.[1] || "Video Tutorial";
    const url = text.match(/URL:\s*(.+)/i)?.[1] || "";
    const caption = text.match(/Caption:\s*(.+)/i)?.[1] || "";
    const duration = text.match(/Duration:\s*(.+)/i)?.[1] || "";
    return { type: "video", title, url, caption, duration, thumbnail: "" };
  }
  if (/^:::api-endpoint/i.test(text)) {
    const title = text.match(/Title:\s*(.+)/i)?.[1] || "API Endpoint";
    const method = text.match(/Method:\s*(.+)/i)?.[1] || "POST";
    const endpoint = text.match(/Endpoint:\s*(.+)/i)?.[1] || "/api/example";
    const auth = text.match(/Auth:\s*(.+)/i)?.[1] || "X-API-KEY";
    const requestSection = text.split(/\nRequest:\n/i)[1] || "";
    const requestExample = requestSection.split(/\nResponse:\n/i)[0]?.trim() || "{}";
    const responseExample = requestSection.split(/\nResponse:\n/i)[1]?.replace(/\n:::\s*$/i, "").trim() || "{}";
    return { type: "api-endpoint", title, method, endpoint, auth, requestExample, responseExample };
  }
  if (/^```/.test(text)) return { type: "code", language: label === "API Response" ? "json" : "text", code: text.replace(/^```[a-z]*\n?/i, "").replace(/\n```$/, "") };
  if (/^\|.+\|/.test(text)) {
    const tableLines = lines.filter(Boolean);
    const columns = (tableLines[0] || "")
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    const rows = tableLines
      .slice(2)
      .map((line) =>
        line
          .split("|")
          .map((cell) => cell.trim())
          .filter(Boolean)
      )
      .filter((row) => row.length);
    return { type: "table", columns, rows };
  }
  if (/^- /.test(text)) return { type: "list", items: text.split("\n").map((item) => item.replace(/^- /, "").trim()).filter(Boolean) };
  return { type: "text", value: text };
}

function getNextCategoryOrder(categories: any[]) {
  if (!Array.isArray(categories) || !categories.length) return 1;
  const maxOrder = categories.reduce((max, category) => {
    const value = Number(category?.order);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return maxOrder + 1;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [addedBlocks, setAddedBlocks] = useState<EditorBlock[]>([]);
  const [editorMode, setEditorMode] = useState<"blocks" | "raw">("blocks");
  const [rawContent, setRawContent] = useState("");
  const [activeTool, setActiveTool] = useState<(typeof TOOLBAR)[number] | null>(null);
  const [toolForm, setToolForm] = useState<any>({ text: "", title: "", description: "", url: "https://example.com", buttonText: "Learn more", language: "ts", code: "const example = true;", keyTitle: "", keyDescription: "", responseTitle: "Response", responseStatus: "200 OK", responseBody: '{\n  "success": true\n}', calloutType: "error", calloutTitle: "Unauthorized Request", calloutDescription: "If your API token is invalid, expired, or has been revoked, you will receive a `401 Unauthorized` response.", listItems: "First item\nSecond item\nThird item", tableColumns: "Column 1, Column 2, Column 3", tableRows: "Value A1, Value A2, Value A3\nValue B1, Value B2, Value B3" });
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [feedbackSummary, setFeedbackSummary] = useState<any | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState<any>({ id: "", name: "", slug: "", order: 1, icon: "BookOpen", description: "", audience: "business, marketing", isPublished: true });
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<any | null>(null);
  const [categoryDeleting, setCategoryDeleting] = useState(false);
  const [brandModal, setBrandModal] = useState(false);
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandUploading, setBrandUploading] = useState(false);
  const [brandUploadPct, setBrandUploadPct] = useState(0);
  const [brandSettings, setBrandSettings] = useState({ brandName: "", brandLogoUrl: "" });
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadPct, setMediaUploadPct] = useState(0);
  const [lastUploadedMedia, setLastUploadedMedia] = useState("");
  const liveContent = useMemo(() => {
    if (!editing) return "";
    return editorMode === "raw" ? rawContent : addedBlocks.map((b) => b.snippet).join("\n\n");
  }, [editing, editorMode, rawContent, addedBlocks]);
  const canCreate = useMemo(() => user?.role === "super_admin" || !!user?.permissions?.components?.includes("docs.create") || !!user?.permissions?.actions?.includes("docs.create"), [user]);
  const canEdit = useMemo(() => user?.role === "super_admin" || !!user?.permissions?.components?.includes("docs.edit") || !!user?.permissions?.actions?.includes("docs.edit"), [user]);
  const canDelete = useMemo(() => user?.role === "super_admin" || !!user?.permissions?.components?.includes("docs.delete") || !!user?.permissions?.actions?.includes("docs.delete"), [user]);
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); return q ? items.filter((x) => String(x.title || "").toLowerCase().includes(q) || String(x.slug || "").toLowerCase().includes(q) || String(x.category || "").toLowerCase().includes(q)) : items; }, [items, query]);
  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set(
          categories
            .map((x) => String(x?.name || "").trim())
            .concat(items.map((x) => String(x?.category || "").trim()))
            .filter(Boolean)
            .concat(String(editing?.category || "").trim() || [])
        )
      ).sort((a, b) => a.localeCompare(b)),
    [categories, items, editing?.category]
  );

  async function load() {
    setLoading(true); setError("");
    try {
      const [docsRes, brandRes, categoriesRes, feedbackRes]: any = await Promise.allSettled([API.admin.docsList(), API.admin.docsBrandGet(), API.admin.docsCategories(), API.admin.docsFeedbackSummary()]);
      const docsData = docsRes?.status === "fulfilled" ? docsRes.value : null;
      const brandData = brandRes?.status === "fulfilled" ? brandRes.value : null;
      const nextCategories = Array.isArray(categoriesRes?.value?.items) ? categoriesRes.value.items : Array.isArray(docsData?.meta?.categories) ? docsData.meta.categories : [];
      setItems(Array.isArray(docsData?.items) ? docsData.items : []);
      setCategories(nextCategories);
      setCategoryForm((prev: any) =>
        prev?.id
          ? prev
          : { ...prev, order: Number.isFinite(Number(prev?.order)) && Number(prev.order) > 0 ? Number(prev.order) : getNextCategoryOrder(nextCategories) }
      );
      setFeedbackSummary(feedbackRes?.status === "fulfilled" ? feedbackRes.value : null);
      setBrandSettings({ brandName: String(brandData?.settings?.brandName || docsData?.meta?.brandName || ""), brandLogoUrl: String(brandData?.settings?.brandLogoUrl || docsData?.meta?.brandLogoUrl || "") });
      if (docsRes?.status === "rejected") throw docsRes.reason;
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load docs");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!isEditorRoute) { setEditing(null); setAddedBlocks([]); setEditorMode("blocks"); setRawContent(""); return; }
    const initEditor = async () => {
      if (location.pathname.endsWith("/create")) {
        setEditing({ ...EMPTY_DOC });
        setAddedBlocks([]);
        setRawContent("");
        setEditorMode("blocks");
        return;
      }
      if (!id) return;
      try {
        const res: any = await API.admin.docsGet(id);
        const doc = { ...(res?.doc || EMPTY_DOC) };
        setEditing(doc);
        const seededBlocks = Array.isArray(doc.contentBlocks) && doc.contentBlocks.length
          ? doc.contentBlocks.map((block: any, i: number) => {
              const snippet = blockToSnippet(block);
              return { id: `loaded-${i}-${Date.now()}`, label: detectBlockLabel(snippet), snippet, block };
            })
          : splitBlocks(doc.content).map((snippet, i) => ({ id: `loaded-${i}-${Date.now()}`, label: detectBlockLabel(snippet), snippet, block: snippetToBlock(snippet, detectBlockLabel(snippet)) }));
        setAddedBlocks(seededBlocks);
        setRawContent(String(doc.content || ""));
      }
      catch (e: any) { toast(e?.response?.data?.message || "Failed to load doc", "error"); navigate(docsBasePath, { replace: true }); }
      setEditorMode("blocks");
    };
    void initEditor();
  }, [id, isEditorRoute, location.pathname]);

  function syncBlocks(next: EditorBlock[]) {
    setAddedBlocks(next);
    setEditing((p: any) => (p ? { ...p, content: next.map((x) => x.snippet).join("\n\n"), contentBlocks: next.map((x) => x.block || snippetToBlock(x.snippet, x.label)) } : p));
  }
  function onRawContentChange(value: string) {
    setRawContent(value);
    setEditing((p: any) => (p ? { ...p, content: value } : p));
  }
  function onEditorModeChange(nextMode: "blocks" | "raw") {
    if (nextMode === editorMode) return;
    if (nextMode === "raw") {
      const nextRaw = String(editing?.content || addedBlocks.map((b) => b.snippet).join("\n\n") || "");
      setRawContent(nextRaw);
      setEditing((p: any) => (p ? { ...p, content: nextRaw } : p));
      setEditorMode("raw");
      return;
    }
    const parsed = splitBlocks(String(rawContent || ""));
    syncBlocks(parsed.map((snippet, i) => ({ id: `raw-${i}-${Date.now()}`, label: detectBlockLabel(snippet), snippet, block: snippetToBlock(snippet, detectBlockLabel(snippet)) })));
    setEditorMode("blocks");
  }
  function insertSnippet(snippet: string, label: string, block?: any) { syncBlocks([...addedBlocks, { id: `${Date.now()}-${Math.random()}`, label, snippet: snippet.trim(), block: block || snippetToBlock(snippet, label) }]); }
  function saveToolBlock() {
    if (!activeTool) return; const label = activeTool.title;
    if (activeTool.label === "Text") return insertSnippet(toolForm.text || "Write text...", label, { type: "text", value: toolForm.text || "Write text..." }), setActiveTool(null);
    if (activeTool.label === "H") return insertSnippet(`# ${toolForm.text || "Heading"}`, label, { type: "heading", level: 1, value: toolForm.text || "Heading" }), setActiveTool(null);
    if (activeTool.label === "Sec") return insertSnippet(`### ${toolForm.text || "Section Title"}`, label, { type: "heading", level: 3, value: toolForm.text || "Section Title" }), setActiveTool(null);
    if (activeTool.label === "List") {
      const items = String(toolForm.listItems || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      return insertSnippet(items.map((item) => `- ${item}`).join("\n"), label, { type: "list", items }), setActiveTool(null);
    }
    if (activeTool.label === "Table") {
      const columns = String(toolForm.tableColumns || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const rows = String(toolForm.tableRows || "")
        .split("\n")
        .map((row) => row.split(",").map((cell) => cell.trim()).filter(Boolean))
        .filter((row) => row.length);
      const header = `| ${columns.join(" | ")} |`;
      const divider = `| ${columns.map(() => "---").join(" | ")} |`;
      const body = rows.map((row) => `| ${row.join(" | ")} |`);
      return insertSnippet([header, divider, ...body].join("\n"), label, { type: "table", columns, rows }), setActiveTool(null);
    }
    if (activeTool.label === "B") return insertSnippet(`**${toolForm.text || "text"}**`, label, { type: "text", value: toolForm.text || "text" }), setActiveTool(null);
    if (activeTool.label === "I") return insertSnippet(`*${toolForm.text || "text"}*`, label, { type: "text", value: toolForm.text || "text" }), setActiveTool(null);
    if (activeTool.label === "Link") return insertSnippet(`[${toolForm.text || "text"}](${toolForm.url || "https://example.com"})`, label, { type: "text", value: `${toolForm.text || "text"} ${toolForm.url || "https://example.com"}` }), setActiveTool(null);
    if (["Code", "JSON", "Bash", "Mermaid"].includes(activeTool.label)) return insertSnippet(`\`\`\`${toolForm.language}\n${toolForm.code}\n\`\`\``, label, { type: "code", language: toolForm.language, code: toolForm.code }), setActiveTool(null);
    if (activeTool.label === "Resp") return insertSnippet(`#### ${toolForm.responseTitle || "Response"} (${toolForm.responseStatus || "200 OK"})\n\`\`\`json\n${toolForm.responseBody}\n\`\`\``, label, { type: "response", title: toolForm.responseTitle, status: toolForm.responseStatus, language: "json", code: toolForm.responseBody }), setActiveTool(null);
    if (activeTool.label === "Callout") return insertSnippet(`:::callout type="${toolForm.calloutType}"\n**${toolForm.calloutTitle}**\n${toolForm.calloutDescription}\n:::`, label, { type: "callout", tone: toolForm.calloutType, title: toolForm.calloutTitle, description: toolForm.calloutDescription }), setActiveTool(null);
    if (activeTool.label === "Key") return insertSnippet(`* **${toolForm.keyTitle || "Capability"}**: ${toolForm.keyDescription || "Description"}`, label, { type: "text", value: `${toolForm.keyTitle || "Capability"}: ${toolForm.keyDescription || "Description"}` }), setActiveTool(null);
    if (activeTool.label === "Step") { const step = Math.max(1, addedBlocks.filter((x) => x.label === "Step Card").length + 1); return insertSnippet(`:::step-card\n#### ${step}. ${toolForm.title || "Step Title"}\n${toolForm.description || "Step description"} [${toolForm.buttonText || "Learn more"}](${toolForm.url || "./quick-start"})\n:::`, label, { type: "step-card", step: String(step), title: toolForm.title || "Step Title", description: toolForm.description || "Step description", buttonText: toolForm.buttonText || "Learn more", url: toolForm.url || "./quick-start" }), setActiveTool(null); }
    if (activeTool.label === "Image") return insertSnippet(`![${toolForm.title || "Academy Image"}](${toolForm.url || lastUploadedMedia || ""})`, label, { type: "image", url: toolForm.url || lastUploadedMedia || "", caption: toolForm.description || toolForm.title || "Academy Image" }), setActiveTool(null);
    if (activeTool.label === "Video") return insertSnippet(`:::video\nTitle: ${toolForm.title || "Video Tutorial"}\nURL: ${toolForm.url || lastUploadedMedia || ""}\nCaption: ${toolForm.description || ""}\nDuration: ${toolForm.responseStatus || ""}\n:::`, label, { type: "video", title: toolForm.title || "Video Tutorial", url: toolForm.url || lastUploadedMedia || "", thumbnail: "", duration: toolForm.responseStatus || "", caption: toolForm.description || "" }), setActiveTool(null);
    if (activeTool.label === "API") return insertSnippet(`:::api-endpoint\nTitle: ${toolForm.title || "API Endpoint"}\nMethod: ${toolForm.responseStatus || "POST"}\nEndpoint: ${toolForm.url || "/api/example"}\nAuth: ${toolForm.keyTitle || "X-API-KEY"}\nRequest:\n${toolForm.code || "{\n  \"example\": true\n}"}\nResponse:\n${toolForm.responseBody || "{\n  \"success\": true\n}"}\n:::`, label, { type: "api-endpoint", title: toolForm.title || "API Endpoint", method: toolForm.responseStatus || "POST", endpoint: toolForm.url || "/api/example", auth: toolForm.keyTitle || "X-API-KEY", requestExample: toolForm.code || "{\n  \"example\": true\n}", responseExample: toolForm.responseBody || "{\n  \"success\": true\n}" }), setActiveTool(null);
  }

  async function saveDoc() {
    if (!editing) return; setSaving(true);
    try {
      const normalizedOrder = Number.isFinite(Number(editing.order)) && Number(editing.order) > 0 ? Number(editing.order) : 1;
      const payload = {
        ...editing,
        slug: editing.slug || slugify(editing.title),
        keywords: Array.isArray(editing.keywords) ? editing.keywords : String(editing.keywords || "").split(",").map((x: string) => x.trim()).filter(Boolean),
        sidebar: {
          ...(editing.sidebar || {}),
          section: String(editing.category || "general").trim() || "general",
          itemOrder: normalizedOrder,
        },
        seo: { ...(editing.seo || {}), metaTitle: String(editing.title || ""), metaDescription: String(editing.description || ""), ogImage: "" },
      };
      payload.tags = Array.isArray(editing.tags) ? editing.tags : String(editing.tags || "").split(",").map((x: string) => x.trim()).filter(Boolean);
      payload.audience = Array.isArray(editing.audience) ? editing.audience : String(editing.audience || "").split(",").map((x: string) => x.trim()).filter(Boolean);
      payload.relatedArticleSlugs = Array.isArray(editing.relatedArticleSlugs) ? editing.relatedArticleSlugs : String(editing.relatedArticleSlugs || "").split(",").map((x: string) => x.trim()).filter(Boolean);
      payload.contentBlocks = Array.isArray(editing.contentBlocks) ? editing.contentBlocks : addedBlocks.map((block) => block.block || snippetToBlock(block.snippet, block.label));
      payload.order = normalizedOrder;
      if (editing.id) await API.admin.docsUpdate(editing.id, payload); else await API.admin.docsCreate(payload);
      toast("Doc saved", "success"); await load(); navigate(docsBasePath);
    } catch (e: any) { toast(e?.response?.data?.message || "Failed to save doc", "error"); } finally { setSaving(false); }
  }
  async function saveCategory() {
    try {
      const payload = { ...categoryForm, audience: String(categoryForm.audience || "").split(",").map((item: string) => item.trim()).filter(Boolean) };
      if (categoryForm.id) await API.admin.docsCategoryUpdate(categoryForm.id, payload);
      else await API.admin.docsCategoryCreate(payload);
      toast("Category saved", "success");
      setCategoryModalOpen(false);
      await load();
      setCategoryForm({ id: "", name: "", slug: "", order: getNextCategoryOrder(categories), icon: "BookOpen", description: "", audience: "business, marketing", isPublished: true });
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to save category", "error");
    }
  }
  async function deleteCategory() {
    if (!categoryDeleteTarget?.id) return;
    setCategoryDeleting(true);
    try {
      await API.admin.docsCategoryDelete(categoryDeleteTarget.id);
      toast("Category deleted", "success");
      setCategoryDeleteTarget(null);
      setCategoryModalOpen(false);
      setCategoryForm({ id: "", name: "", slug: "", order: getNextCategoryOrder(categories), icon: "BookOpen", description: "", audience: "business, marketing", isPublished: true });
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to delete category", "error");
    } finally {
      setCategoryDeleting(false);
    }
  }
  async function uploadDocsMedia(file?: File | null) {
    if (!file) return;
    setMediaUploading(true);
    setMediaUploadPct(0);
    try {
      const response: any = await API.admin.docsMediaUpload(file, (pct: number) => setMediaUploadPct(pct));
      const url = String(response?.url || "").trim();
      setLastUploadedMedia(url);
      setToolForm((prev: any) => ({ ...prev, url }));
      toast("Media uploaded", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || e?.message || "Media upload failed", "error");
    } finally {
      setMediaUploading(false);
      setMediaUploadPct(0);
    }
  }
  async function saveBrandSettings() { setBrandSaving(true); try { const res: any = await API.admin.docsBrandUpdate(brandSettings); setBrandSettings({ brandName: String(res?.settings?.brandName || ""), brandLogoUrl: String(res?.settings?.brandLogoUrl || "") }); toast("Docs brand settings saved", "success"); setBrandModal(false); } catch (e: any) { toast(e?.response?.data?.message || "Failed to save brand settings", "error"); } finally { setBrandSaving(false); } }
  async function uploadBrandLogo(file?: File | null) { if (!file) return; setBrandUploading(true); setBrandUploadPct(0); try { const res: any = await API.admin.docsBrandUploadLogo(file, (pct: number) => setBrandUploadPct(pct)); const logoUrl = String(res?.logoUrl || "").trim(); if (!logoUrl) throw new Error("Invalid upload response"); setBrandSettings((prev) => ({ ...prev, brandLogoUrl: logoUrl })); toast("Logo uploaded", "success"); } catch (e: any) { toast(e?.response?.data?.message || e?.message || "Logo upload failed", "error"); } finally { setBrandUploading(false); setBrandUploadPct(0); } }
  async function openPreview(docId: string) { setPreviewLoading(true); setPreviewDoc(null); try { const res: any = await API.admin.docsGet(docId); setPreviewDoc(res?.doc || null); } catch (e: any) { toast(e?.response?.data?.message || "Failed to load preview", "error"); } finally { setPreviewLoading(false); } }
  async function confirmDelete() { if (!deleteTarget?.id) return; try { await API.admin.docsDelete(deleteTarget.id); toast("Doc deleted", "success"); setDeleteTarget(null); await load(); } catch (e: any) { toast(e?.response?.data?.message || "Failed to delete doc", "error"); } }

  return (
    <>
      {isEditorRoute ? <EditorScreen navigate={navigate} saveDoc={saveDoc} saving={saving} editing={editing} canCreate={canCreate} canEdit={canEdit} setEditing={setEditing} slugify={slugify} TOOLBAR={TOOLBAR} setActiveTool={setActiveTool} addedBlocks={addedBlocks} syncBlocks={syncBlocks} liveContent={liveContent} editorMode={editorMode} onEditorModeChange={onEditorModeChange} rawContent={rawContent} onRawContentChange={onRawContentChange} canUseRaw={user?.role === "super_admin" || user?.role === "admin"} availableCategories={availableCategories} /> : <ListScreen query={query} setQuery={setQuery} load={load} loading={loading} navigate={navigate} docsBasePath={docsBasePath} canCreate={canCreate} error={error} filtered={filtered} openPreview={openPreview} canEdit={canEdit} canDelete={canDelete} setDeleteTarget={setDeleteTarget} brandModal={brandModal} setBrandModal={setBrandModal} brandSettings={brandSettings} setBrandSettings={setBrandSettings} uploadBrandLogo={uploadBrandLogo} brandUploading={brandUploading} brandUploadPct={brandUploadPct} saveBrandSettings={saveBrandSettings} brandSaving={brandSaving} deleteTarget={deleteTarget} confirmDelete={confirmDelete} setPreviewDoc={setPreviewDoc} previewLoading={previewLoading} previewDoc={previewDoc} categories={categories} openCategories={() => { setCategoryForm({ id: "", name: "", slug: "", order: getNextCategoryOrder(categories), icon: "BookOpen", description: "", audience: "business, marketing", isPublished: true }); setCategoryModalOpen(true); }} openFeedback={() => setFeedbackModalOpen(true)} feedbackSummary={feedbackSummary} />}
      <Modal isOpen={!!activeTool} onClose={() => setActiveTool(null)} title={activeTool ? `Add ${activeTool.title}` : ""}>
        {activeTool ? <div className="space-y-3">{["Text", "H", "Sec", "B", "I"].includes(activeTool.label) ? <Input label="Text" value={toolForm.text} onChange={(e) => setToolForm((p: any) => ({ ...p, text: e.target.value }))} /> : null}{activeTool.label === "List" ? <Textarea label="List Items" rows={6} value={toolForm.listItems} onChange={(e) => setToolForm((p: any) => ({ ...p, listItems: e.target.value }))} placeholder={"First item\nSecond item\nThird item"} /> : null}{activeTool.label === "Table" ? <><Input label="Columns" value={toolForm.tableColumns} onChange={(e) => setToolForm((p: any) => ({ ...p, tableColumns: e.target.value }))} placeholder="Issue, Reason, Fix" /><Textarea label="Rows" rows={6} value={toolForm.tableRows} onChange={(e) => setToolForm((p: any) => ({ ...p, tableRows: e.target.value }))} placeholder={"Rejected, Name mismatch, Match business name\nPending, Verification review, Wait for Meta"} /></> : null}{activeTool.label === "Link" ? <><Input label="Text" value={toolForm.text} onChange={(e) => setToolForm((p: any) => ({ ...p, text: e.target.value }))} /><Input label="URL" value={toolForm.url} onChange={(e) => setToolForm((p: any) => ({ ...p, url: e.target.value }))} /></> : null}{["Code", "JSON", "Bash", "Mermaid"].includes(activeTool.label) ? <><Input label="Language" value={toolForm.language} onChange={(e) => setToolForm((p: any) => ({ ...p, language: e.target.value }))} /><Textarea label="Code" rows={8} value={toolForm.code} onChange={(e) => setToolForm((p: any) => ({ ...p, code: e.target.value }))} /></> : null}{activeTool.label === "Resp" ? <><Input label="Response Title" value={toolForm.responseTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, responseTitle: e.target.value }))} /><Input label="Status" value={toolForm.responseStatus} onChange={(e) => setToolForm((p: any) => ({ ...p, responseStatus: e.target.value }))} /><Textarea label="Response JSON" rows={8} value={toolForm.responseBody} onChange={(e) => setToolForm((p: any) => ({ ...p, responseBody: e.target.value }))} /></> : null}{activeTool.label === "Callout" ? <><Select label="Type" value={toolForm.calloutType} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutType: e.target.value }))}><option value="info">info</option><option value="warning">warning</option><option value="success">success</option><option value="error">error</option></Select><Input label="Title" value={toolForm.calloutTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutTitle: e.target.value }))} /><Textarea label="Description" rows={5} value={toolForm.calloutDescription} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutDescription: e.target.value }))} /></> : null}{activeTool.label === "Key" ? <><Input label="Title" value={toolForm.keyTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, keyTitle: e.target.value }))} /><Textarea label="Description" rows={4} value={toolForm.keyDescription} onChange={(e) => setToolForm((p: any) => ({ ...p, keyDescription: e.target.value }))} /></> : null}{activeTool.label === "Step" ? <><Input label="Step Title" value={toolForm.title} onChange={(e) => setToolForm((p: any) => ({ ...p, title: e.target.value }))} /><Textarea label="Step Description" rows={3} value={toolForm.description} onChange={(e) => setToolForm((p: any) => ({ ...p, description: e.target.value }))} /><Input label="Button Text" value={toolForm.buttonText} onChange={(e) => setToolForm((p: any) => ({ ...p, buttonText: e.target.value }))} /><Input label="Button URL" value={toolForm.url} onChange={(e) => setToolForm((p: any) => ({ ...p, url: e.target.value }))} /></> : null}{["Image", "Video", "API"].includes(activeTool.label) ? <><Input label="Title" value={toolForm.title} onChange={(e) => setToolForm((p: any) => ({ ...p, title: e.target.value }))} /><Textarea label="Description" rows={3} value={toolForm.description} onChange={(e) => setToolForm((p: any) => ({ ...p, description: e.target.value }))} /><Input label={activeTool.label === "API" ? "Endpoint / URL" : "Media URL"} value={toolForm.url} onChange={(e) => setToolForm((p: any) => ({ ...p, url: e.target.value }))} /><div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Upload Media</div><label htmlFor="docs-media-upload"><input id="docs-media-upload" type="file" className="hidden" onChange={(e) => uploadDocsMedia(e.target.files?.[0] || null)} /><span className="inline-flex h-9 cursor-pointer items-center rounded-[5px] border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">{mediaUploading ? `Uploading ${mediaUploadPct}%` : "Upload file"}</span></label>{lastUploadedMedia ? <div className="mt-2 break-all text-[11px] text-slate-500">{lastUploadedMedia}</div> : null}</div></> : null}<div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setActiveTool(null)}>Cancel</Button><Button type="button" onClick={saveToolBlock}>Save</Button></div></div> : null}
      </Modal>
      <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Manage Category">
        <div className="space-y-3">
          <Input label="Name" value={categoryForm.name} onChange={(e) => setCategoryForm((p: any) => ({ ...p, name: e.target.value }))} />
          <Input label="Slug" value={categoryForm.slug} onChange={(e) => setCategoryForm((p: any) => ({ ...p, slug: e.target.value }))} />
          <Input label="Icon" value={categoryForm.icon} onChange={(e) => setCategoryForm((p: any) => ({ ...p, icon: e.target.value }))} />
          <Input label="Sort Order" type="number" value={String(categoryForm.order || 0)} onChange={(e) => setCategoryForm((p: any) => ({ ...p, order: Number(e.target.value || 0) }))} />
          <Input label="Audience" value={categoryForm.audience} onChange={(e) => setCategoryForm((p: any) => ({ ...p, audience: e.target.value }))} />
          <Textarea label="Description" rows={4} value={categoryForm.description} onChange={(e) => setCategoryForm((p: any) => ({ ...p, description: e.target.value }))} />
          <div className="space-y-2">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500">Existing Categories</div>
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-[5px] border border-slate-200 p-2">
              {categories.map((category: any) => <button key={category.id} type="button" onClick={() => setCategoryForm({ id: category.id, name: category.name, slug: category.slug, order: category.order, icon: category.icon, description: category.description, audience: Array.isArray(category.audience) ? category.audience.join(", ") : "", isPublished: category.isPublished !== false })} className="flex w-full items-center justify-between rounded-[5px] px-3 py-2 text-left text-sm hover:bg-slate-50"><span className="font-semibold text-slate-700">{category.name}</span><span className="text-xs font-black text-slate-400">#{Number(category.order || 0)}</span></button>)}
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <div>
              {categoryForm.id ? <Button variant="ghost" onClick={() => setCategoryDeleteTarget({ id: categoryForm.id, name: categoryForm.name })} className="text-rose-600">Delete Category</Button> : null}
            </div>
            <div className="flex gap-2"><Button variant="ghost" onClick={() => setCategoryModalOpen(false)}>Close</Button><Button onClick={saveCategory}>Save Category</Button></div>
          </div>
        </div>
      </Modal>
      <Modal isOpen={!!categoryDeleteTarget} onClose={() => setCategoryDeleteTarget(null)} title="Delete Category">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-bold text-slate-900">{categoryDeleteTarget?.name}</span>?</p>
          <p className="text-xs text-slate-500">Category tabhi delete hogi jab uske andar koi doc use nahi kar raha hoga.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCategoryDeleteTarget(null)} disabled={categoryDeleting}>Cancel</Button>
            <Button onClick={deleteCategory} disabled={categoryDeleting}>{categoryDeleting ? "Deleting..." : "Delete"}</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} title="Docs Feedback Analytics" className="max-w-4xl">
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            {(feedbackSummary?.summary || []).slice(0, 10).map((row: any) => <div key={row.slug} className="rounded-[5px] border border-slate-200 bg-slate-50 p-4"><div className="text-sm font-black text-slate-900">{row.slug}</div><div className="mt-1 text-xs text-slate-500">Helpful {Number(row.helpfulPct || 0).toFixed(1)}% · {row.total} responses</div></div>)}
          </div>
          <div>
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Negative Feedback</div>
            <div className="space-y-2">
              {(feedbackSummary?.negativeFeedback || []).slice(0, 12).map((row: any) => <div key={row.id} className="rounded-[5px] border border-slate-200 p-3"><div className="text-xs font-black uppercase tracking-widest text-slate-500">{row.slug}</div><div className="mt-2 text-sm text-slate-700">{row.feedback || "No details provided."}</div></div>)}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
