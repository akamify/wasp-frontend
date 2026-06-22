import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { MarkdownPreview } from "./MarkdownPreview";

function sectionOrder(doc: any) {
  const value = Number(doc?.sidebar?.sectionOrder);
  return Number.isFinite(value) ? value : 0;
}

function itemOrder(doc: any) {
  const value = Number(doc?.sidebar?.itemOrder);
  if (Number.isFinite(value)) return value;
  const order = Number(doc?.order);
  return Number.isFinite(order) ? order : 0;
}

export function ListScreen(props: any) {
  const { query, setQuery, load, loading, navigate, docsBasePath, canCreate, error, filtered, openPreview, canEdit, canDelete, setDeleteTarget, brandModal, setBrandModal, brandSettings, setBrandSettings, uploadBrandLogo, brandUploading, brandUploadPct, saveBrandSettings, brandSaving, deleteTarget, confirmDelete, setPreviewDoc, previewLoading, previewDoc } = props;
  return (
    <div className="flex flex-col p-6">
      <AdminToolbar title="Docs" subtitle="Manage docs content, preview, publish state, and docs branding from one place." query={query} setQuery={setQuery} onRefresh={load} isSyncing={loading} right={<div className="flex items-center gap-2"><Button variant="outline" onClick={() => setBrandModal(true)}>Brand & Logo</Button><Button onClick={() => navigate(`${docsBasePath}/create`)} disabled={!canCreate}>Create Doc</Button></div>} />
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {loading ? <TableSkeleton rows={7} cols={7} /> : <AdminTable columns={[{ key: "title", label: "Title" }, { key: "slug", label: "Slug" }, { key: "category", label: "Category" }, { key: "categoryOrder", label: "Category Order" }, { key: "pageOrder", label: "Page Order" }, { key: "status", label: "Status" }, { key: "actions", label: "Actions" }]}>{filtered.map((d: any) => <tr key={d.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openPreview(d.id)}><td className="px-6 py-4 text-sm font-bold">{d.title}</td><td className="px-6 py-4 text-xs">{d.slug}</td><td className="px-6 py-4 text-xs">{d.category || "general"}</td><td className="px-6 py-4 text-xs">{sectionOrder(d)}</td><td className="px-6 py-4 text-xs">{itemOrder(d)}</td><td className="px-6 py-4 text-xs font-bold uppercase">{d.status || "draft"}</td><td className="px-6 py-4" onClick={(e) => e.stopPropagation()}><div className="flex gap-2"><Button variant="outline" onClick={() => navigate(`${docsBasePath}/${d.id}/edit`)} disabled={!canEdit}>Edit</Button><Button variant="ghost" onClick={() => setDeleteTarget(d)} disabled={!canDelete}>Delete</Button></div></td></tr>)}</AdminTable>}
      <Modal isOpen={brandModal} onClose={() => setBrandModal(false)} title="Docs Brand Settings"><div className="space-y-3"><Input label="Brand Name" value={brandSettings.brandName} onChange={(e) => setBrandSettings((p: any) => ({ ...p, brandName: e.target.value }))} /><div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Logo Upload</div><div className="flex flex-wrap items-center gap-2"><label htmlFor="docs-brand-logo-file"><input id="docs-brand-logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => uploadBrandLogo(e.target.files?.[0] || null)} /><span className="inline-flex h-9 cursor-pointer items-center rounded-[5px] border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">{brandUploading ? `Uploading ${brandUploadPct}%` : "Upload Logo"}</span></label>{brandSettings.brandLogoUrl ? <Button variant="ghost" type="button" onClick={() => setBrandSettings((p: any) => ({ ...p, brandLogoUrl: "" }))}>Remove</Button> : null}</div><div className="mt-2 text-[11px] text-slate-500">Allowed: PNG, JPG, WEBP, SVG. Max size: 5MB.</div></div><Input label="Logo URL" value={brandSettings.brandLogoUrl} onChange={(e) => setBrandSettings((p: any) => ({ ...p, brandLogoUrl: e.target.value }))} />{brandSettings.brandLogoUrl ? <div className="rounded-[5px] border border-slate-200 p-3"><img src={brandSettings.brandLogoUrl} alt="Docs brand logo" className="h-14 w-auto object-contain" /></div> : null}<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setBrandModal(false)}>Cancel</Button><Button onClick={saveBrandSettings} disabled={brandSaving || brandUploading}>{brandSaving ? "Saving..." : "Save"}</Button></div></div></Modal>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Doc"><div className="space-y-3"><p className="text-sm text-slate-600">Are you sure you want to delete <span className="font-bold text-slate-900">{deleteTarget?.title}</span>?</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button onClick={confirmDelete}>Delete</Button></div></div></Modal>
      <Modal isOpen={previewLoading || !!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.title || "Doc Preview"} className="max-w-[1400px]">{previewLoading ? <TableSkeleton rows={4} cols={3} /> : previewDoc ? <div className="max-h-[82vh] overflow-auto rounded-[5px] border border-slate-200 bg-white"><MarkdownPreview content={String(previewDoc.content || "")} /></div> : null}</Modal>
    </div>
  );
}
