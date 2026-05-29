import { ArrowLeft, X } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { MarkdownPreview } from "./MarkdownPreview";

export function EditorScreen(props: any) {
  const { navigate, saveDoc, saving, editing, canCreate, canEdit, setEditing, slugify, TOOLBAR, setActiveTool, addedBlocks, syncBlocks, liveContent, editorMode, onEditorModeChange, rawContent, onRawContentChange, canUseRaw, availableCategories } = props;
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
              <Input label="Keywords (comma separated)" value={Array.isArray(editing.keywords) ? editing.keywords.join(", ") : String(editing.keywords || "")} onChange={(e) => setEditing((p: any) => ({ ...p, keywords: e.target.value }))} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <Input label="Category" list="docs-category-options" value={editing.category || ""} onChange={(e) => setEditing((p: any) => ({ ...p, category: e.target.value }))} />
                  <datalist id="docs-category-options">
                    {(Array.isArray(availableCategories) ? availableCategories : []).map((cat: string) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <Input label="Sort Order" type="number" min={0} value={String(editing.order ?? 0)} onChange={(e) => setEditing((p: any) => ({ ...p, order: Number(e.target.value || 0) }))} />
                <Select label="Status" value={editing.status} onChange={(e) => setEditing((p: any) => ({ ...p, status: e.target.value }))}><option value="draft">draft</option><option value="published">published</option></Select>
              </div>
              {canUseRaw ? <div className="rounded-[5px] border border-slate-200 bg-white p-2"><div className="inline-flex rounded-[5px] border border-slate-200 bg-slate-50 p-1"><Button type="button" variant={editorMode === "blocks" ? "primary" : "ghost"} className="h-8 px-3 text-xs" onClick={() => onEditorModeChange("blocks")}>Blocks</Button><Button type="button" variant={editorMode === "raw" ? "primary" : "ghost"} className="h-8 px-3 text-xs" onClick={() => onEditorModeChange("raw")}>Raw</Button></div></div> : null}
              {editorMode === "blocks" ? <><div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Add Blocks</div><div className="flex flex-wrap gap-2">{TOOLBAR.map((b: any) => <Button key={b.label} type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => setActiveTool(b)} disabled={(!editing?.id && !canCreate) || (!!editing?.id && !canEdit)}>{b.label}</Button>)}</div></div><div className="rounded-[5px] border border-slate-200 bg-white p-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Blocks</div><div className="space-y-2">{addedBlocks.map((b: any, idx: number) => <div key={b.id} className="flex items-center justify-between rounded-[5px] border border-slate-200 px-3 py-2 text-xs"><span className="font-black text-slate-900">{idx + 1}. {b.label}</span><Button type="button" variant="ghost" className="h-7 px-2" onClick={() => syncBlocks(addedBlocks.filter((x: any) => x.id !== b.id))}><X className="h-3.5 w-3.5" /></Button></div>)}</div></div></> : <div className="rounded-[5px] border border-slate-200 bg-white p-3"><Textarea label="Raw Content" rows={20} value={rawContent} onChange={(e) => onRawContentChange(e.target.value)} /></div>}
            </div>
          </div>
          <div className="overflow-y-auto rounded-[5px] border border-slate-200 bg-white p-4"><div className="mb-3 border-b border-slate-100 pb-3 text-sm font-black text-slate-900">Live Preview</div><MarkdownPreview content={liveContent} /></div>
        </div>
      )}
    </div>
  );
}
