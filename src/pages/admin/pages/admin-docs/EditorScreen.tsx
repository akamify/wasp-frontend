import { ArrowDown, ArrowLeft, ArrowUp, X } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { MarkdownPreview } from "./MarkdownPreview";

export function EditorScreen(props: any) {
  const { navigate, saveDoc, saving, editing, canCreate, canEdit, setEditing, slugify, TOOLBAR, setActiveTool, addedBlocks, syncBlocks, liveContent, editorMode, onEditorModeChange, rawContent, onRawContentChange, canUseRaw, availableCategories, pageKeyOptions } = props;
  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= addedBlocks.length) return;
    const next = [...addedBlocks];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    syncBlocks(next);
  };
  return (
    <div className="flex h-[calc(100vh-4px)] flex-col p-2">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <Button onClick={saveDoc} disabled={saving || (!editing?.id && !canCreate) || (!!editing?.id && !canEdit)}>{saving ? "Saving..." : "Save"}</Button>
      </div>
      {!editing ? <TableSkeleton rows={6} cols={4} /> : (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
          <div className="overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-4">
            <div className="space-y-3">
              <Input label="Title" value={editing.title} onChange={(e) => setEditing((p: any) => ({ ...p, title: e.target.value }))} />
              <Input label="Slug" value={editing.slug} onChange={(e) => setEditing((p: any) => ({ ...p, slug: slugify(e.target.value) }))} />
              <Input label="Description" value={editing.description} onChange={(e) => setEditing((p: any) => ({ ...p, description: e.target.value }))} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Select label="Dashboard Page Key" value={editing.pageKey || ""} onChange={(e) => setEditing((p: any) => ({ ...p, pageKey: e.target.value }))}>
                  {(Array.isArray(pageKeyOptions) ? pageKeyOptions : []).map((option: any) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Input label="Target Section ID" value={editing.targetSectionId || ""} onChange={(e) => setEditing((p: any) => ({ ...p, targetSectionId: slugify(e.target.value) }))} />
              </div>
              <Input label="Tags (comma separated)" value={Array.isArray(editing.tags) ? editing.tags.join(", ") : String(editing.tags || "")} onChange={(e) => setEditing((p: any) => ({ ...p, tags: e.target.value }))} />
              <Input label="Keywords (comma separated)" value={Array.isArray(editing.keywords) ? editing.keywords.join(", ") : String(editing.keywords || "")} onChange={(e) => setEditing((p: any) => ({ ...p, keywords: e.target.value }))} />
              <Input label="Audience (comma separated)" value={Array.isArray(editing.audience) ? editing.audience.join(", ") : String(editing.audience || "")} onChange={(e) => setEditing((p: any) => ({ ...p, audience: e.target.value }))} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Select label="Category" value={editing.category || ""} onChange={(e) => setEditing((p: any) => ({ ...p, category: e.target.value }))}>
                    <option value="">Select category</option>
                    {(Array.isArray(availableCategories) ? availableCategories : []).map((cat: string) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>
                <Input label="Sort Order" type="number" min={1} value={String(editing.order ?? 1)} onChange={(e) => setEditing((p: any) => ({ ...p, order: Number(e.target.value || 1) }))} />
                <Select label="Status" value={editing.status} onChange={(e) => setEditing((p: any) => ({ ...p, status: e.target.value }))}><option value="draft">draft</option><option value="published">published</option></Select>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input label="Hero Title" value={editing.hero?.title || ""} onChange={(e) => setEditing((p: any) => ({ ...p, hero: { ...(p?.hero || {}), title: e.target.value } }))} />
                <Input label="Hero Subtitle" value={editing.hero?.subtitle || ""} onChange={(e) => setEditing((p: any) => ({ ...p, hero: { ...(p?.hero || {}), subtitle: e.target.value } }))} />
                <Input label="Hero Icon" value={editing.hero?.icon || ""} onChange={(e) => setEditing((p: any) => ({ ...p, hero: { ...(p?.hero || {}), icon: e.target.value } }))} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input label="Related Article Slugs" value={Array.isArray(editing.relatedArticleSlugs) ? editing.relatedArticleSlugs.join(", ") : String(editing.relatedArticleSlugs || "")} onChange={(e) => setEditing((p: any) => ({ ...p, relatedArticleSlugs: e.target.value }))} />
                <Input label="Reading Time (minutes)" type="number" min={0} value={String(editing.readingTime || 0)} onChange={(e) => setEditing((p: any) => ({ ...p, readingTime: Number(e.target.value || 0) }))} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-[5px] border border-slate-200 px-3 py-3 text-sm font-semibold"><input type="checkbox" checked={!!editing.isPopular} onChange={(e) => setEditing((p: any) => ({ ...p, isPopular: e.target.checked }))} /> Popular</label>
                <label className="flex items-center gap-2 rounded-[5px] border border-slate-200 px-3 py-3 text-sm font-semibold"><input type="checkbox" checked={!!editing.isFeatured} onChange={(e) => setEditing((p: any) => ({ ...p, isFeatured: e.target.checked }))} /> Featured</label>
                <label className="flex items-center gap-2 rounded-[5px] border border-slate-200 px-3 py-3 text-sm font-semibold"><input type="checkbox" checked={!editing.seo?.noIndex} onChange={(e) => setEditing((p: any) => ({ ...p, seo: { ...(p?.seo || {}), noIndex: !e.target.checked } }))} /> Indexable</label>
              </div>
              {canUseRaw ? <div className="rounded-[5px] border border-slate-200 bg-white p-2"><div className="inline-flex rounded-[5px] border border-slate-200 bg-slate-50 p-1"><Button type="button" variant={editorMode === "blocks" ? "primary" : "ghost"} className="h-8 px-3 text-xs" onClick={() => onEditorModeChange("blocks")}>Blocks</Button><Button type="button" variant={editorMode === "raw" ? "primary" : "ghost"} className="h-8 px-3 text-xs" onClick={() => onEditorModeChange("raw")}>Raw</Button></div></div> : null}
              {editorMode === "blocks" ? <><div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Add Blocks</div><div className="mb-3 text-[11px] font-semibold text-slate-500">`On this page` links automatically `Heading` and `Sec` blocks se bante hain. Block order change karoge to public docs order bhi update hoga.</div><div className="flex flex-wrap gap-2">{TOOLBAR.map((b: any) => <Button key={b.label} type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => setActiveTool(b)} disabled={(!editing?.id && !canCreate) || (!!editing?.id && !canEdit)}>{b.label}</Button>)}</div></div><div className="rounded-[5px] border border-slate-200 bg-white p-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Blocks</div><div className="space-y-2">{addedBlocks.map((b: any, idx: number) => <div key={b.id} className="flex items-center justify-between rounded-[5px] border border-slate-200 px-3 py-2 text-xs"><span className="font-black text-slate-900">{idx + 1}. {b.label}</span><div className="flex items-center gap-1"><Button type="button" variant="ghost" className="h-7 px-2" onClick={() => moveBlock(idx, idx - 1)} disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" className="h-7 px-2" onClick={() => moveBlock(idx, idx + 1)} disabled={idx === addedBlocks.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" className="h-7 px-2" onClick={() => syncBlocks(addedBlocks.filter((x: any) => x.id !== b.id))}><X className="h-3.5 w-3.5" /></Button></div></div>)}</div></div></> : <div className="rounded-[5px] border border-slate-200 bg-white p-3"><Textarea label="Raw Content" rows={20} value={rawContent} onChange={(e) => onRawContentChange(e.target.value)} /></div>}
            </div>
          </div>
          <div className="overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-4"><div className="mb-3 border-b border-slate-100 pb-3 text-sm font-black text-slate-900">Live Preview</div><MarkdownPreview content={liveContent} /></div>
        </div>
      )}
    </div>
  );
}
