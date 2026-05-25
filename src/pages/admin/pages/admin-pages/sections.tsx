import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";

export function PagesListPanel({ filtered, selectedSlug, setSelectedSlug }: any) {
  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-white p-4">
      <div className="text-xs font-extrabold uppercase tracking-widest text-ink-900/60">Pages</div>
      <div className="mt-3 grid gap-2">
        {filtered.map((p: any) => (
          <button key={p.slug} onClick={() => setSelectedSlug(p.slug)} className={"flex w-full items-center justify-between rounded-[5px] border px-3 py-2 text-left text-sm font-semibold transition-colors " + (p.slug === selectedSlug ? "border-brand-300/40 bg-brand-50 text-ink-900" : "border-ink-900/10 bg-white text-ink-900/70 hover:bg-ink-900/5")}>
            <span className="truncate">{p.slug}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-900/40">{(p.updatedAt && new Date(p.updatedAt).toLocaleDateString()) || ""}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HelpEditor({ contacts, faqs, updateData }: any) {
  return (<>
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-3 text-xs font-semibold text-ink-900/60">Help Center uses `contacts[]` and `faqs[]`.</div>
    <div className="grid gap-3"><div className="flex items-center justify-between"><div className="text-xs font-extrabold uppercase tracking-widest text-ink-900/60">Contacts</div><Button type="button" variant="secondary" onClick={() => updateData({ contacts: [...contacts, { label: "", value: "" }] })}>Add</Button></div>{contacts.map((c: any, idx: number) => <div key={idx} className="grid gap-3 md:grid-cols-2"><Input label="Label" value={String(c?.label || "")} onChange={(e) => { const next = [...contacts]; next[idx] = { ...(next[idx] || {}), label: e.target.value }; updateData({ contacts: next }); }} /><div className="flex items-end gap-2"><Input label="Value" value={String(c?.value || "")} onChange={(e) => { const next = [...contacts]; next[idx] = { ...(next[idx] || {}), value: e.target.value }; updateData({ contacts: next }); }} /><Button type="button" variant="ghost" onClick={() => updateData({ contacts: contacts.filter((_: any, i: number) => i !== idx) })}>Remove</Button></div></div>)}</div>
    <div className="grid gap-3"><div className="flex items-center justify-between"><div className="text-xs font-extrabold uppercase tracking-widest text-ink-900/60">FAQs</div><Button type="button" variant="secondary" onClick={() => updateData({ faqs: [...faqs, { q: "", a: "" }] })}>Add</Button></div>{faqs.map((f: any, idx: number) => <div key={idx} className="grid gap-3"><Input label="Question" value={String(f?.q || "")} onChange={(e) => { const next = [...faqs]; next[idx] = { ...(next[idx] || {}), q: e.target.value }; updateData({ faqs: next }); }} /><div className="flex items-end gap-2"><Textarea label="Answer" value={String(f?.a || "")} onChange={(e) => { const next = [...faqs]; next[idx] = { ...(next[idx] || {}), a: e.target.value }; updateData({ faqs: next }); }} rows={3} /><Button type="button" variant="ghost" onClick={() => updateData({ faqs: faqs.filter((_: any, i: number) => i !== idx) })}>Remove</Button></div></div>)}</div>
  </>);
}

export function CareersEditor({ data, departmentsText, noticePeriodsText, modesOfWorkText, splitLines, updateData }: any) {
  return (<>
    <Textarea label="Intro (Markdown/text)" value={String(data?.introMarkdown || "")} onChange={(e) => updateData({ introMarkdown: e.target.value })} rows={6} />
    <Textarea label="Departments (one per line)" value={departmentsText} onChange={(e) => updateData({ departments: splitLines(e.target.value) })} rows={6} />
    <Textarea label="Notice Periods (one per line)" value={noticePeriodsText} onChange={(e) => updateData({ noticePeriods: splitLines(e.target.value) })} rows={6} />
    <Textarea label="Modes of Work (one per line)" value={modesOfWorkText} onChange={(e) => updateData({ modesOfWork: splitLines(e.target.value) })} rows={6} />
  </>);
}

export function BrandModal({ brandModalOpen, setBrandModalOpen, brandLoading, brandSettings, setBrandSettings, user, brandUploading, brandUploadPct, onUploadBrandLogo, onSaveBrand, brandSaving }: any) {
  return (
    <Modal isOpen={brandModalOpen} onClose={() => setBrandModalOpen(false)} title="Edit Platform Brand">
      {brandLoading ? <div className="text-sm text-slate-500">Loading brand settings...</div> : <div className="space-y-3">
        <Input label="Brand Name" value={brandSettings.brandName} onChange={(e) => setBrandSettings((p: any) => ({ ...p, brandName: e.target.value }))} disabled={user?.role !== "super_admin"} />
        <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3"><div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Logo Upload</div><div className="flex flex-wrap items-center gap-2"><label htmlFor="platform-brand-logo-file"><input id="platform-brand-logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" disabled={user?.role !== "super_admin" || brandUploading} onChange={(e) => onUploadBrandLogo(e.target.files?.[0] || null)} /><span className="inline-flex h-9 cursor-pointer items-center rounded-[5px] border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100">{brandUploading ? `Uploading ${brandUploadPct}%` : "Upload Logo"}</span></label>{brandSettings.brandLogoUrl ? <Button variant="ghost" type="button" onClick={() => setBrandSettings((p: any) => ({ ...p, brandLogoUrl: "" }))} disabled={user?.role !== "super_admin"}>Remove</Button> : null}</div><div className="mt-2 text-[11px] text-slate-500">Allowed: PNG, JPG, WEBP, SVG. Max size: 5MB.</div></div>
        <Input label="Logo URL (fallback)" value={brandSettings.brandLogoUrl} onChange={(e) => setBrandSettings((p: any) => ({ ...p, brandLogoUrl: e.target.value }))} disabled={user?.role !== "super_admin"} />
        {brandSettings.brandLogoUrl ? <div className="rounded-[5px] border border-slate-200 p-3"><img src={brandSettings.brandLogoUrl} alt="Platform brand logo" className="h-14 w-auto object-contain" /></div> : null}
        {user?.role !== "super_admin" ? <Alert variant="warning">Only super admin can update platform brand.</Alert> : null}
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setBrandModalOpen(false)}>Cancel</Button><Button type="button" onClick={onSaveBrand} disabled={user?.role !== "super_admin" || brandSaving || brandUploading}>{brandSaving ? "Saving..." : "Save"}</Button></div>
      </div>}
    </Modal>
  );
}
