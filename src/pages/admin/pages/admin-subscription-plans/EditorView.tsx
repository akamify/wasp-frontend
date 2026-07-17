import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { SuperAdminPlanPreviewCard } from "@pages/admin/components/SuperAdminPlanPreviewCard";
import { useState } from "react";
import { Info, Plus, Trash2, X } from "lucide-react";
import { BADGE_TYPES, BILLING_CYCLES, CARD_COLORS, FEATURE_GROUPS, inr, LIMIT_GROUPS, LIMIT_HELP, PLAN_OPTIONS, PLAN_STATUSES, statusColor, TAX_MODES } from "./shared";

function SelectField({ label, value, onChange, children, disabled }: any) {
  return <div><div className="mb-1 text-xs font-semibold uppercase text-slate-500">{label}</div><select className="w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>{children}</select></div>;
}

function Toggle({ label, checked, onChange, disabled }: any) {
  return <label className="flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />{label}</label>;
}

function Section({ title, children, subtitle }: any) {
  return <div className="rounded-[5px] border border-slate-200 bg-white p-5"><div className="mb-4"><h2 className="text-sm font-black text-slate-900">{title}</h2>{subtitle ? <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p> : null}</div>{children}</div>;
}

function TooltipLabel({ label, help }: { label: string; help?: string }) {
  return <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500">{label}{help ? <span className="group relative inline-flex"><Info size={13} className="cursor-help text-slate-400" /><span className="pointer-events-none absolute left-5 top-1/2 z-20 hidden w-64 -translate-y-1/2 rounded-[5px] border border-slate-200 bg-slate-950 px-3 py-2 text-[11px] font-semibold normal-case leading-5 text-white shadow-xl group-hover:block">{help}</span></span> : null}</div>;
}

function LimitInput({ label, help, value, onChange, disabled }: { label: string; help?: string; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <div><TooltipLabel label={label} help={help} /><input className="w-full rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:bg-slate-50 disabled:text-slate-400" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} disabled={disabled} inputMode="numeric" /></div>;
}

function DisplayFeatureEditor({ title, subtitle, value, onChange, disabled, placeholder }: any) {
  const items = String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const [draft, setDraft] = useState("");
  const commit = () => {
    const clean = draft.trim();
    if (!clean) return;
    const next = Array.from(new Set([...items, clean]));
    onChange(next.join("\n"));
    setDraft("");
  };
  return (
    <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-black uppercase tracking-wide text-slate-600">{title}</div>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">{subtitle}</p>
      <div className="mt-3 flex gap-2">
        <input className="min-w-0 flex-1 rounded-[5px] border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:bg-slate-50" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }} placeholder={placeholder} disabled={disabled} />
        <Button type="button" onClick={commit} disabled={disabled || !draft.trim()}><Plus size={16} />Add</Button>
      </div>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-2 rounded-[5px] border border-slate-200 bg-white px-3 py-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-500">{index + 1}</span>
            <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{item}</span>
            <button type="button" className="rounded-[5px] p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" onClick={() => onChange(items.filter((_, i) => i !== index).join("\n"))} disabled={disabled} aria-label={`Remove ${item}`}><Trash2 size={15} /></button>
          </div>
        )) : <div className="rounded-[5px] border border-dashed border-slate-200 bg-white p-4 text-center text-xs font-semibold text-slate-400">No items added yet.</div>}
      </div>
    </div>
  );
}

export function EditorView(props: any) {
  const { isCreate, isEdit, isReview, navigate, editor, setEditor, isFreePlan, preview, saving, saveEditor, confirmAction, setConfirmAction, confirmAndRunAction, error, items = [] } = props;
  const title = isCreate ? "Create Plan" : isEdit ? "Edit Plan" : isReview ? "Review Plan" : "View Plan";
  const status = String(editor.status || "in_review");
  const displayFeatures = String(editor.displayFeaturesText || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const unavailableFeatures = String(editor.unavailableFeaturesText || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const addonServices = String(editor.addonServicesText || "").split("\n").map((line) => line.trim()).filter(Boolean);
  const readOnly = !(isCreate || isEdit || isReview);
  const [previewOpen, setPreviewOpen] = useState(false);
  const setFeature = (key: string, value: boolean) => setEditor((s: any) => ({ ...s, features: { ...(s.features || {}), [key]: value } }));
  const setLimit = (key: string, value: string) => setEditor((s: any) => ({ ...s, limits: { ...(s.limits || {}), [key]: value.replace(/[^\d]/g, "") } }));
  const setFreeLimit = (key: string, value: string) => setEditor((s: any) => ({ ...s, freeLimits: { ...(s.freeLimits || {}), [key]: value.replace(/[^\d]/g, "") } }));
  const limitSource = isFreePlan ? editor.freeLimits || {} : editor.limits || {};
  const usedPlanSlugs = new Set((Array.isArray(items) ? items : []).filter((item: any) => item?.id !== editor.id && !item?.deletedAt).map((item: any) => String(item?.slug || "").toLowerCase()).filter(Boolean));
  const selectedPlanSlug = String(editor.slug || "").toLowerCase();
  const selectPlanSlot = (slug: string) => {
    const option = PLAN_OPTIONS.find((item) => item.slug === slug);
    if (!option) return;
    setEditor((s: any) => ({ ...s, name: option.name, slug: option.slug, sortOrder: option.sortOrder }));
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-3xl font-black tracking-tight text-slate-900">{title}</h1><p className="mt-1 text-sm font-medium text-slate-500">Status: <span className={statusColor(status)}>{status}</span></p></div>
        <div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => navigate("/super-admin/subscription-plans")}>Back to Plans</Button>{editor.id ? <Button variant="outline" onClick={() => setPreviewOpen(true)}>Preview</Button> : null}{readOnly && editor.id ? <Button onClick={() => navigate(`/super-admin/subscription-plans/${editor.id}/edit`)}>Edit</Button> : null}{editor.id ? <Button onClick={() => setConfirmAction({ id: editor.id, action: "publish", name: editor.name || "this plan" })}>Publish</Button> : null}{editor.id ? <Button variant="ghost" onClick={() => setConfirmAction({ id: editor.id, action: "disable", name: editor.name || "this plan" })}>Disable</Button> : null}{editor.id ? <Button variant="danger" onClick={() => setConfirmAction({ id: editor.id, action: "delete", name: editor.name || "this plan" })}>Delete</Button> : null}</div>
      </div>
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="grid grid-cols-1 items-start gap-6">
        <div className="space-y-5">
          <Section title="General" subtitle="Plan identity, publish state, visibility, and card styling.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {!isFreePlan ? (
                <SelectField label="Plan Name" value={selectedPlanSlug} onChange={selectPlanSlot} disabled={readOnly || isEdit || isReview}>
                  <option value="">Select plan</option>
                  {PLAN_OPTIONS.map((item) => <option key={item.slug} value={item.slug} disabled={usedPlanSlugs.has(item.slug)}>{item.name}{usedPlanSlugs.has(item.slug) ? " (already created)" : ""}</option>)}
                </SelectField>
              ) : <Input label="Plan Name" value={editor.name} onChange={(e) => setEditor((s: any) => ({ ...s, name: e.target.value }))} disabled={readOnly} />}
              <Input label="Slug" value={editor.slug} onChange={(e) => setEditor((s: any) => ({ ...s, slug: e.target.value }))} disabled />
              <div className="md:col-span-2"><Textarea label="Description" value={editor.description} onChange={(e) => setEditor((s: any) => ({ ...s, description: e.target.value }))} disabled={readOnly} /></div>
              {!isFreePlan ? <SelectField label="Status" value={editor.status} onChange={(value: string) => setEditor((s: any) => ({ ...s, status: value }))} disabled={readOnly}>{PLAN_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField> : null}
              <SelectField label="Sort Order" value={String(editor.sortOrder || 1)} onChange={(value: string) => setEditor((s: any) => ({ ...s, sortOrder: Number(value || 1) }))} disabled={readOnly}>{[1, 2, 3, 4, 5].map((item) => <option key={item} value={item}>{item}</option>)}</SelectField>
              {!isFreePlan ? <><Input label="Badge Text" value={editor.badgeText} onChange={(e) => setEditor((s: any) => ({ ...s, badgeText: e.target.value }))} disabled={readOnly} /><SelectField label="Badge Type" value={editor.badgeType} onChange={(value: string) => setEditor((s: any) => ({ ...s, badgeType: value }))} disabled={readOnly}>{BADGE_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField><SelectField label="Card Color" value={editor.cardColor} onChange={(value: string) => setEditor((s: any) => ({ ...s, cardColor: value }))} disabled={readOnly}>{CARD_COLORS.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField><Input label="Icon" value={editor.icon} maxLength={8} onChange={(e) => setEditor((s: any) => ({ ...s, icon: e.target.value }))} disabled={readOnly} /></> : null}
              {!isFreePlan ? <div className="md:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-3"><Toggle label="Recommended" checked={editor.recommended} onChange={(value: boolean) => setEditor((s: any) => ({ ...s, recommended: value }))} disabled={readOnly} /><Toggle label="Public Visible" checked={editor.publicVisible} onChange={(value: boolean) => setEditor((s: any) => ({ ...s, publicVisible: value }))} disabled={readOnly} /><Toggle label="Purchasable" checked={editor.purchasable} onChange={(value: boolean) => setEditor((s: any) => ({ ...s, purchasable: value }))} disabled={readOnly} /></div> : null}
            </div>
          </Section>

          {!isFreePlan ? <Section title="Pricing" subtitle="Validated by backend: duplicate slug, GST, negative values, and discount > original.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Original Price (Rupees)" value={editor.originalPriceRupees} onChange={(e) => setEditor((s: any) => ({ ...s, originalPriceRupees: e.target.value.replace(/[^\d.]/g, "") }))} disabled={readOnly} />
              <Input label="Discounted Price (Rupees)" value={editor.discountedPriceRupees} onChange={(e) => setEditor((s: any) => ({ ...s, discountedPriceRupees: e.target.value.replace(/[^\d.]/g, "") }))} disabled={readOnly} />
              <SelectField label="Billing Cycle" value={editor.billingCycle} onChange={(value: string) => setEditor((s: any) => ({ ...s, billingCycle: value }))} disabled={readOnly}>{BILLING_CYCLES.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField>
              <Input label="GST Percent" value={editor.gstPercent} onChange={(e) => setEditor((s: any) => ({ ...s, gstPercent: e.target.value.replace(/[^\d.]/g, "") }))} disabled={readOnly} />
              <SelectField label="Tax Mode" value={editor.taxMode} onChange={(value: string) => setEditor((s: any) => ({ ...s, taxMode: value }))} disabled={readOnly}>{TAX_MODES.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField>
              <Input label="Button Text" value={editor.buttonText} onChange={(e) => setEditor((s: any) => ({ ...s, buttonText: e.target.value }))} disabled={readOnly} />
              <div className="md:col-span-2 grid grid-cols-1 gap-2 md:grid-cols-2"><Toggle label="Enable Trial" checked={editor.trial?.enabled} onChange={(value: boolean) => setEditor((s: any) => ({ ...s, trial: { ...(s.trial || {}), enabled: value } }))} disabled={readOnly} /><Input label="Trial Days" value={editor.trial?.days || ""} onChange={(e) => setEditor((s: any) => ({ ...s, trial: { ...(s.trial || {}), days: e.target.value.replace(/[^\d]/g, "") } }))} disabled={readOnly} /></div>
            </div>
          </Section> : null}

          {!isFreePlan ? <Section title="Features" subtitle="Boolean access flags grouped by product area. Backend uses these as source of truth.">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{FEATURE_GROUPS.map((group) => <div key={group.title} className="rounded-[5px] border border-slate-200 p-3"><div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{group.title}</div><div className="grid grid-cols-1 gap-2">{group.items.map(([key, label]) => <Toggle key={key} label={label} checked={editor.features?.[key]} onChange={(value: boolean) => setFeature(key, value)} disabled={readOnly} />)}</div></div>)}</div>
          </Section> : null}

          <Section title={isFreePlan ? "Free Plan Limits" : "Limits"} subtitle="Use 0 to block a capability. Higher plans can set exact numeric caps.">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{LIMIT_GROUPS.map((group) => <div key={group.title} className="rounded-[5px] border border-slate-200 p-3"><div className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">{group.title}</div><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{group.items.map(([key, label]) => <LimitInput key={key} label={label} help={LIMIT_HELP[key]} value={String(limitSource?.[key] ?? "")} onChange={(value) => isFreePlan ? setFreeLimit(key, value) : setLimit(key, value)} disabled={readOnly} />)}</div></div>)}</div>
          </Section>

          {!isFreePlan ? <Section title="Display Features" subtitle="Add each pricing-card line one by one. These are marketing display lines, separate from backend feature flags.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><DisplayFeatureEditor title="Included Features" subtitle="Shown with check icon on pricing card." value={editor.displayFeaturesText} onChange={(value: string) => setEditor((s: any) => ({ ...s, displayFeaturesText: value }))} placeholder="e.g. Campaign Scheduler" disabled={readOnly} /><DisplayFeatureEditor title="Not Included" subtitle="Shown as unavailable/disabled on pricing card." value={editor.unavailableFeaturesText} onChange={(value: string) => setEditor((s: any) => ({ ...s, unavailableFeaturesText: value }))} placeholder="e.g. Number Masking" disabled={readOnly} /></div>
          </Section> : null}

          {!isFreePlan ? <Section title="Add-on Services" subtitle="Optional services that can be sold or shown separately from included plan features.">
            <DisplayFeatureEditor title="Add-on Services" subtitle="Shown as extra purchasable/support services in preview/pricing card." value={editor.addonServicesText} onChange={(value: string) => setEditor((s: any) => ({ ...s, addonServicesText: value }))} placeholder="e.g. Turbo onboarding support" disabled={readOnly} />
          </Section> : null}

          <Section title="Review">
            <Textarea label="Review Note" value={editor.reviewNote} onChange={(e) => setEditor((s: any) => ({ ...s, reviewNote: e.target.value }))} disabled={readOnly} />
            {preview && !isFreePlan ? <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3"><div className="rounded-[5px] border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-[10px] font-semibold uppercase text-slate-500">Original</div><div className="text-sm font-black">{inr(preview.originalPricePaise)}</div></div><div className="rounded-[5px] border border-slate-200 bg-slate-50 px-3 py-2"><div className="text-[10px] font-semibold uppercase text-slate-500">Discounted</div><div className="text-sm font-black">{inr(preview.discountedPricePaise)}</div></div><div className="rounded-[5px] border border-emerald-200 bg-emerald-50 px-3 py-2"><div className="text-[10px] font-semibold uppercase text-emerald-700">Payable</div><div className="text-sm font-black text-emerald-800">{inr(preview.payableAmountPaise)}</div></div></div> : null}
          </Section>

          {!readOnly ? <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-slate-200 bg-white/95 py-4 backdrop-blur"><Button variant="ghost" onClick={() => navigate("/super-admin/subscription-plans")}>Cancel</Button><Button onClick={() => void saveEditor()} disabled={saving || !editor.name}>{saving ? "Saving..." : (isFreePlan ? "Save Free Plan" : "Save Plan")}</Button></div> : null}
        </div>
      </div>
      {previewOpen ? <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm" onClick={() => setPreviewOpen(false)}><div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-black text-slate-900">Plan Preview</h3><p className="text-xs font-semibold text-slate-500">Customer-facing plan card</p></div><button type="button" className="rounded-[5px] p-2 text-slate-500 hover:bg-slate-100" onClick={() => setPreviewOpen(false)}><X size={18} /></button></div><SuperAdminPlanPreviewCard name={editor.name} description={editor.description} discountedPriceRupees={isFreePlan ? "0" : editor.discountedPriceRupees} recommended={editor.recommended} badgeText={editor.badgeText} badgeType={editor.badgeType} cardColor={editor.cardColor} icon={editor.icon} billingCycle={editor.billingCycle} buttonText={editor.buttonText} discountAmountPaise={Number(preview?.discountAmountPaise || 0)} displayFeatures={displayFeatures} unavailableFeatures={unavailableFeatures} addonServices={addonServices} limits={limitSource} /></div></div> : null}
      {confirmAction ? <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[5px] border border-slate-200 bg-white p-5 shadow-2xl"><h3 className="text-lg font-black text-slate-900">{confirmAction.action === "publish" ? "Confirm Publish" : confirmAction.action === "delete" ? "Confirm Delete" : "Confirm Disable"}</h3><p className="mt-2 text-sm font-semibold text-slate-600">{confirmAction.action === "publish" ? `Are you sure you want to publish \"${confirmAction.name}\"?` : confirmAction.action === "delete" ? `Delete \"${confirmAction.name}\"? This hides it from all lists and pricing pages.` : `Are you sure you want to disable \"${confirmAction.name}\"?`}</p><div className="mt-4 flex justify-end gap-2"><Button variant="ghost" onClick={() => setConfirmAction(null)}>Cancel</Button><Button variant={confirmAction.action === "delete" ? "danger" : "primary"} onClick={() => void confirmAndRunAction()}>{confirmAction.action === "publish" ? "Yes, Publish" : confirmAction.action === "delete" ? "Yes, Delete" : "Yes, Disable"}</Button></div></div></div> : null}
    </div>
  );
}
