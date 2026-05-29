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
  const [editorMode, setEditorMode] = useState<"blocks" | "raw">("blocks");
  const [rawContent, setRawContent] = useState("");
  const [activeTool, setActiveTool] = useState<(typeof TOOLBAR)[number] | null>(null);
  const [toolForm, setToolForm] = useState<any>({ text: "", title: "", description: "", url: "https://example.com", buttonText: "Learn more", language: "ts", code: "const example = true;", keyTitle: "", keyDescription: "", responseTitle: "Response", responseStatus: "200 OK", responseBody: '{\n  "success": true\n}', calloutType: "error", calloutTitle: "Unauthorized Request", calloutDescription: "If your API token is invalid, expired, or has been revoked, you will receive a `401 Unauthorized` response." });
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
          items
            .map((x) => String(x?.category || "").trim())
            .filter(Boolean)
            .concat(String(editing?.category || "").trim() || [])
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items, editing?.category]
  );

  async function load() {
    setLoading(true); setError("");
    try {
      const [docsRes, brandRes]: any = await Promise.allSettled([API.admin.docsList(), API.admin.docsBrandGet()]);
      const docsData = docsRes?.status === "fulfilled" ? docsRes.value : null;
      const brandData = brandRes?.status === "fulfilled" ? brandRes.value : null;
      setItems(Array.isArray(docsData?.items) ? docsData.items : []);
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
        setAddedBlocks(splitBlocks(doc.content).map((snippet, i) => ({ id: `loaded-${i}-${Date.now()}`, label: detectBlockLabel(snippet), snippet })));
        setRawContent(String(doc.content || ""));
      }
      catch (e: any) { toast(e?.response?.data?.message || "Failed to load doc", "error"); navigate(docsBasePath, { replace: true }); }
      setEditorMode("blocks");
    };
    void initEditor();
  }, [id, isEditorRoute, location.pathname]);

  function syncBlocks(next: Array<{ id: string; label: string; snippet: string }>) { setAddedBlocks(next); setEditing((p: any) => (p ? { ...p, content: next.map((x) => x.snippet).join("\n\n") } : p)); }
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
    syncBlocks(parsed.map((snippet, i) => ({ id: `raw-${i}-${Date.now()}`, label: detectBlockLabel(snippet), snippet })));
    setEditorMode("blocks");
  }
  function insertSnippet(snippet: string, label: string) { syncBlocks([...addedBlocks, { id: `${Date.now()}-${Math.random()}`, label, snippet: snippet.trim() }]); }
  function saveToolBlock() {
    if (!activeTool) return; const label = activeTool.title;
    if (activeTool.label === "Text") return insertSnippet(toolForm.text || "Write text...", label), setActiveTool(null);
    if (activeTool.label === "H") return insertSnippet(`# ${toolForm.text || "Heading"}`, label), setActiveTool(null);
    if (activeTool.label === "Sec") return insertSnippet(`### ${toolForm.text || "Section Title"}`, label), setActiveTool(null);
    if (activeTool.label === "B") return insertSnippet(`**${toolForm.text || "text"}**`, label), setActiveTool(null);
    if (activeTool.label === "I") return insertSnippet(`*${toolForm.text || "text"}*`, label), setActiveTool(null);
    if (activeTool.label === "Link") return insertSnippet(`[${toolForm.text || "text"}](${toolForm.url || "https://example.com"})`, label), setActiveTool(null);
    if (["Code", "JSON", "Bash", "Mermaid"].includes(activeTool.label)) return insertSnippet(`\`\`\`${toolForm.language}\n${toolForm.code}\n\`\`\``, label), setActiveTool(null);
    if (activeTool.label === "Resp") return insertSnippet(`#### ${toolForm.responseTitle || "Response"} (${toolForm.responseStatus || "200 OK"})\n\`\`\`json\n${toolForm.responseBody}\n\`\`\``, label), setActiveTool(null);
    if (activeTool.label === "Callout") return insertSnippet(`:::callout type="${toolForm.calloutType}"\n**${toolForm.calloutTitle}**\n${toolForm.calloutDescription}\n:::`, label), setActiveTool(null);
    if (activeTool.label === "Key") return insertSnippet(`* **${toolForm.keyTitle || "Capability"}**: ${toolForm.keyDescription || "Description"}`, label), setActiveTool(null);
    if (activeTool.label === "Step") { const step = Math.max(1, addedBlocks.filter((x) => x.label === "Step Card").length + 1); return insertSnippet(`:::step-card\n#### ${step}. ${toolForm.title || "Step Title"}\n${toolForm.description || "Step description"} [${toolForm.buttonText || "Learn more"}](${toolForm.url || "./quick-start"})\n:::`, label), setActiveTool(null); }
  }

  async function saveDoc() {
    if (!editing) return; setSaving(true);
    try {
      const payload = { ...editing, slug: editing.slug || slugify(editing.title), keywords: Array.isArray(editing.keywords) ? editing.keywords : String(editing.keywords || "").split(",").map((x: string) => x.trim()).filter(Boolean), sidebar: { ...(editing.sidebar || {}), section: String(editing.category || "general").trim() || "general" }, seo: { ...(editing.seo || {}), metaTitle: String(editing.title || ""), metaDescription: String(editing.description || ""), ogImage: "" } };
      payload.order = Number.isFinite(Number(payload.order)) ? Number(payload.order) : 0;
      if (editing.id) await API.admin.docsUpdate(editing.id, payload); else await API.admin.docsCreate(payload);
      toast("Doc saved", "success"); await load(); navigate(docsBasePath);
    } catch (e: any) { toast(e?.response?.data?.message || "Failed to save doc", "error"); } finally { setSaving(false); }
  }
  async function saveBrandSettings() { setBrandSaving(true); try { const res: any = await API.admin.docsBrandUpdate(brandSettings); setBrandSettings({ brandName: String(res?.settings?.brandName || ""), brandLogoUrl: String(res?.settings?.brandLogoUrl || "") }); toast("Docs brand settings saved", "success"); setBrandModal(false); } catch (e: any) { toast(e?.response?.data?.message || "Failed to save brand settings", "error"); } finally { setBrandSaving(false); } }
  async function uploadBrandLogo(file?: File | null) { if (!file) return; setBrandUploading(true); setBrandUploadPct(0); try { const res: any = await API.admin.docsBrandUploadLogo(file, (pct: number) => setBrandUploadPct(pct)); const logoUrl = String(res?.logoUrl || "").trim(); if (!logoUrl) throw new Error("Invalid upload response"); setBrandSettings((prev) => ({ ...prev, brandLogoUrl: logoUrl })); toast("Logo uploaded", "success"); } catch (e: any) { toast(e?.response?.data?.message || e?.message || "Logo upload failed", "error"); } finally { setBrandUploading(false); setBrandUploadPct(0); } }
  async function openPreview(docId: string) { setPreviewLoading(true); setPreviewDoc(null); try { const res: any = await API.admin.docsGet(docId); setPreviewDoc(res?.doc || null); } catch (e: any) { toast(e?.response?.data?.message || "Failed to load preview", "error"); } finally { setPreviewLoading(false); } }
  async function confirmDelete() { if (!deleteTarget?.id) return; try { await API.admin.docsDelete(deleteTarget.id); toast("Doc deleted", "success"); setDeleteTarget(null); await load(); } catch (e: any) { toast(e?.response?.data?.message || "Failed to delete doc", "error"); } }

  return (
    <>
      {isEditorRoute ? <EditorScreen navigate={navigate} saveDoc={saveDoc} saving={saving} editing={editing} canCreate={canCreate} canEdit={canEdit} setEditing={setEditing} slugify={slugify} TOOLBAR={TOOLBAR} setActiveTool={setActiveTool} addedBlocks={addedBlocks} syncBlocks={syncBlocks} liveContent={liveContent} editorMode={editorMode} onEditorModeChange={onEditorModeChange} rawContent={rawContent} onRawContentChange={onRawContentChange} canUseRaw={user?.role === "super_admin" || user?.role === "admin"} availableCategories={availableCategories} /> : <ListScreen query={query} setQuery={setQuery} load={load} loading={loading} navigate={navigate} docsBasePath={docsBasePath} canCreate={canCreate} error={error} filtered={filtered} openPreview={openPreview} canEdit={canEdit} canDelete={canDelete} setDeleteTarget={setDeleteTarget} brandModal={brandModal} setBrandModal={setBrandModal} brandSettings={brandSettings} setBrandSettings={setBrandSettings} uploadBrandLogo={uploadBrandLogo} brandUploading={brandUploading} brandUploadPct={brandUploadPct} saveBrandSettings={saveBrandSettings} brandSaving={brandSaving} deleteTarget={deleteTarget} confirmDelete={confirmDelete} setPreviewDoc={setPreviewDoc} previewLoading={previewLoading} previewDoc={previewDoc} />}
      <Modal isOpen={!!activeTool} onClose={() => setActiveTool(null)} title={activeTool ? `Add ${activeTool.title}` : ""}>
        {activeTool ? <div className="space-y-3">{["Text", "H", "Sec", "B", "I"].includes(activeTool.label) ? <Input label="Text" value={toolForm.text} onChange={(e) => setToolForm((p: any) => ({ ...p, text: e.target.value }))} /> : null}{activeTool.label === "Link" ? <><Input label="Text" value={toolForm.text} onChange={(e) => setToolForm((p: any) => ({ ...p, text: e.target.value }))} /><Input label="URL" value={toolForm.url} onChange={(e) => setToolForm((p: any) => ({ ...p, url: e.target.value }))} /></> : null}{["Code", "JSON", "Bash", "Mermaid"].includes(activeTool.label) ? <><Input label="Language" value={toolForm.language} onChange={(e) => setToolForm((p: any) => ({ ...p, language: e.target.value }))} /><Textarea label="Code" rows={8} value={toolForm.code} onChange={(e) => setToolForm((p: any) => ({ ...p, code: e.target.value }))} /></> : null}{activeTool.label === "Resp" ? <><Input label="Response Title" value={toolForm.responseTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, responseTitle: e.target.value }))} /><Input label="Status" value={toolForm.responseStatus} onChange={(e) => setToolForm((p: any) => ({ ...p, responseStatus: e.target.value }))} /><Textarea label="Response JSON" rows={8} value={toolForm.responseBody} onChange={(e) => setToolForm((p: any) => ({ ...p, responseBody: e.target.value }))} /></> : null}{activeTool.label === "Callout" ? <><Select label="Type" value={toolForm.calloutType} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutType: e.target.value }))}><option value="info">info</option><option value="warning">warning</option><option value="success">success</option><option value="error">error</option></Select><Input label="Title" value={toolForm.calloutTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutTitle: e.target.value }))} /><Textarea label="Description" rows={5} value={toolForm.calloutDescription} onChange={(e) => setToolForm((p: any) => ({ ...p, calloutDescription: e.target.value }))} /></> : null}{activeTool.label === "Key" ? <><Input label="Title" value={toolForm.keyTitle} onChange={(e) => setToolForm((p: any) => ({ ...p, keyTitle: e.target.value }))} /><Textarea label="Description" rows={4} value={toolForm.keyDescription} onChange={(e) => setToolForm((p: any) => ({ ...p, keyDescription: e.target.value }))} /></> : null}{activeTool.label === "Step" ? <><Input label="Step Title" value={toolForm.title} onChange={(e) => setToolForm((p: any) => ({ ...p, title: e.target.value }))} /><Textarea label="Step Description" rows={3} value={toolForm.description} onChange={(e) => setToolForm((p: any) => ({ ...p, description: e.target.value }))} /><Input label="Button Text" value={toolForm.buttonText} onChange={(e) => setToolForm((p: any) => ({ ...p, buttonText: e.target.value }))} /><Input label="Button URL" value={toolForm.url} onChange={(e) => setToolForm((p: any) => ({ ...p, url: e.target.value }))} /></> : null}<div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setActiveTool(null)}>Cancel</Button><Button type="button" onClick={saveToolBlock}>Save</Button></div></div> : null}
      </Modal>
    </>
  );
}
