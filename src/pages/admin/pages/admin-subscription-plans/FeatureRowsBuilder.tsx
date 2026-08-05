import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";

export function FeatureRowsBuilder({ editor, setEditor, readOnly, isFreePlan, availableFunctionalityKeys, availableLimitKeys }: any) {
  return (
    <div className="space-y-3">
      {editor.featureRows.map((row: any, idx: number) => (
        <div key={idx} className="border border-slate-100 rounded-[5px] p-3 space-y-3">
          <Input label="Label" value={row.label} onChange={(e) => setEditor((s: any) => { const next = [...s.featureRows]; next[idx] = { ...next[idx], label: e.target.value }; return { ...s, featureRows: next }; })} disabled={readOnly} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div><div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Type</div><select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.type} onChange={(e) => setEditor((s: any) => { const nextType = e.target.value as "text" | "functionality" | "limit"; const next = [...s.featureRows]; next[idx] = { ...next[idx], type: nextType, functionalityKey: nextType === "functionality" ? next[idx].functionalityKey : "", limitKey: nextType === "limit" ? next[idx].limitKey : "", value: nextType === "limit" ? next[idx].value : "", unlimited: nextType === "limit" ? next[idx].unlimited : false }; return { ...s, featureRows: next }; })} disabled={readOnly}><option value="text">text</option><option value="functionality">functionality</option><option value="limit">limit</option></select></div>
            <div>{row.type === "functionality" ? <><div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Functionality</div><select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.functionalityKey} onChange={(e) => setEditor((s: any) => { const next = [...s.featureRows]; next[idx] = { ...next[idx], functionalityKey: e.target.value }; return { ...s, featureRows: next }; })} disabled={readOnly}><option value="">Select functionality</option>{availableFunctionalityKeys(idx).map((k: string) => <option key={k} value={k}>{k}</option>)}</select></> : row.type === "limit" ? <><div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Limit Key</div><select className="w-full rounded-[5px] border border-slate-200 px-2 py-2" value={row.limitKey} onChange={(e) => setEditor((s: any) => { const next = [...s.featureRows]; next[idx] = { ...next[idx], limitKey: e.target.value }; return { ...s, featureRows: next }; })} disabled={readOnly}><option value="">Select limit</option>{availableLimitKeys(idx).map((k: string) => <option key={k} value={k}>{k}</option>)}</select></> : <div className="h-full flex items-end"><div className="text-xs font-semibold text-slate-400">Text row: no mapping required</div></div>}</div>
            <div>{row.type === "limit" ? <Input label="Value" value={row.value} onChange={(e) => setEditor((s: any) => { const next = [...s.featureRows]; next[idx] = { ...next[idx], value: e.target.value.replace(/[^\d]/g, "") }; return { ...s, featureRows: next }; })} disabled={readOnly || row.unlimited} /> : null}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 items-end"><div />
            <div className="inline-flex items-center gap-4 pb-2 text-xs font-semibold text-slate-700"><label className="inline-flex items-center gap-2"><input type="radio" name={`feature-row-included-${idx}`} checked={row.included === true} onChange={() => setEditor((s: any) => { const next = [...s.featureRows]; next[idx] = { ...next[idx], included: true }; return { ...s, featureRows: next }; })} disabled={readOnly} />included</label><label className="inline-flex items-center gap-2"><input type="radio" name={`feature-row-included-${idx}`} checked={row.included === false} onChange={() => setEditor((s: any) => { const next = [...s.featureRows]; next[idx] = { ...next[idx], included: false }; return { ...s, featureRows: next }; })} disabled={readOnly} />excluded</label></div>
            <label className={`text-xs font-semibold inline-flex items-center gap-2 pb-2 ${row.type === "limit" ? "text-slate-700" : "text-slate-400"}`}><input type="checkbox" checked={row.unlimited} onChange={(e) => setEditor((s: any) => { const next = [...s.featureRows]; next[idx] = { ...next[idx], unlimited: e.target.checked }; return { ...s, featureRows: next }; })} disabled={readOnly || row.type !== "limit"} />unlimited</label>
            <div className="pb-1">{!readOnly ? <Button variant="outline" onClick={() => setEditor((s: any) => ({ ...s, featureRows: s.featureRows.filter((_: any, i: number) => i !== idx) }))}>Remove</Button> : null}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
