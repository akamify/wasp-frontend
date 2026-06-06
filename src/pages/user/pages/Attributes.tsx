import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { useToast } from "@shared/providers/ToastContext";
import { Plus, Search, X } from "lucide-react";

export type AttributeDefinition = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "date" | "url";
  description?: string;
  defaultValue?: string | number | boolean;
  required: boolean;
  visible: boolean;
  editable: boolean;
  active: boolean;
  usageCount?: number;
};

const EMPTY = {
  key: "", label: "", type: "text" as AttributeDefinition["type"], description: "",
  defaultValue: "", required: false, visible: true, editable: true,
};

function suggestKey(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 50);
}

export default function AttributesPage() {
  const { toast } = useToast();
  const [definitions, setDefinitions] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<AttributeDefinition | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const result = await API.contacts.attributes({ includeInactive: true, includeUsage: true });
      setDefinitions(result.definitions || []);
    } catch (error: any) {
      toast(error?.userMessage || "Failed to load attributes", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return definitions;
    return definitions.filter((definition) => `${definition.label} ${definition.key}`.toLowerCase().includes(normalized));
  }, [definitions, query]);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function startEdit(definition: AttributeDefinition) {
    setEditing(definition);
    setForm({
      key: definition.key, label: definition.label, type: definition.type,
      description: definition.description || "", defaultValue: String(definition.defaultValue ?? ""),
      required: definition.required, visible: definition.visible, editable: definition.editable,
    });
    setOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[a-z][a-z0-9_]{0,49}$/.test(form.key)) return toast("Key must use lowercase snake_case and start with a letter.", "error");
    setSaving(true);
    try {
      if (editing) await API.contacts.updateAttribute(editing.key, form);
      else await API.contacts.createAttribute(form);
      toast(editing ? "Attribute updated" : "Attribute created", "success");
      setOpen(false);
      await load();
    } catch (error: any) {
      toast(error?.userMessage || "Failed to save attribute", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(definition: AttributeDefinition) {
    if (definition.active && !confirm("Existing contact values will remain, but this attribute will no longer be available for new assignments or campaign mapping.")) return;
    try {
      if (definition.active) await API.contacts.archiveAttribute(definition.key);
      else await API.contacts.updateAttribute(definition.key, { active: true });
      await load();
    } catch (error: any) {
      toast(error?.userMessage || "Failed to update attribute", "error");
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Attributes</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-800/60">Create and manage contact attributes used for profile data, segmentation, and campaign personalization.</p>
        </div>
        <Button onClick={startCreate} className="gap-2"><Plus size={17} /> Create Attribute</Button>
      </div>
      <div className="rounded-[5px] border border-ink-900/10 bg-white">
        <div className="border-b border-ink-900/10 p-4">
          <div className="relative max-w-md"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><input className="w-full rounded-[5px] border border-slate-200 py-2.5 pl-10 pr-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search key or label" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{["Label", "Key", "Type", "Default", "Required", "Visible", "Editable", "Usage", "Status", "Actions"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((definition) => <tr key={definition.key}>
                <td className="px-4 py-3 font-black text-slate-900">{definition.label}</td><td className="px-4 py-3 font-mono text-xs">{definition.key}</td><td className="px-4 py-3">{definition.type}</td>
                <td className="max-w-40 truncate px-4 py-3">{String(definition.defaultValue ?? "-")}</td><td className="px-4 py-3">{definition.required ? "Yes" : "No"}</td><td className="px-4 py-3">{definition.visible ? "Yes" : "No"}</td><td className="px-4 py-3">{definition.editable ? "Yes" : "No"}</td><td className="px-4 py-3">{definition.usageCount || 0}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${definition.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{definition.active ? "Active" : "Archived"}</span></td>
                <td className="px-4 py-3"><div className="flex gap-2"><button className="font-bold text-brand-600" onClick={() => startEdit(definition)}>Edit</button><button className="font-bold text-slate-600" onClick={() => toggle(definition)}>{definition.active ? "Archive" : "Enable"}</button></div></td>
              </tr>)}
            </tbody>
          </table>
          {!loading && !filtered.length ? <div className="p-10 text-center text-sm font-semibold text-slate-500">No attributes created yet. Create your first attribute to store structured contact data like city, order ID, payment method, or lead stage.</div> : null}
          {loading ? <div className="p-10 text-center text-sm font-semibold text-slate-500">Loading attributes...</div> : null}
        </div>
      </div>
      {open ? <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <form onSubmit={save} className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-[5px] bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-black">{editing ? "Edit Attribute" : "Create Attribute"}</h2><button type="button" onClick={() => setOpen(false)}><X size={20} /></button></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Label" value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value, key: editing ? current.key : suggestKey(event.target.value) }))} required />
            <Input label="Key" value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value.toLowerCase() }))} disabled={Boolean(editing)} hint="lowercase snake_case, max 50" required />
          </div>
          <label className="mt-4 block text-xs font-black uppercase tracking-widest text-slate-500">Type<select className="mt-2 w-full rounded-[5px] border border-slate-200 px-3 py-2.5 text-sm" value={form.type} disabled={Boolean(editing && (editing.usageCount || 0) > 0)} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as AttributeDefinition["type"] }))}>{["text", "number", "boolean", "date", "url"].map((type) => <option key={type}>{type}</option>)}</select></label>
          <Textarea label="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-4 min-h-20" />
          <Input label="Default value" value={String(form.defaultValue)} onChange={(event) => setForm((current) => ({ ...current, defaultValue: event.target.value }))} className="mt-4" />
          <div className="mt-4 flex flex-wrap gap-5">{(["required", "visible", "editable"] as const).map((field) => <label key={field} className="flex items-center gap-2 text-sm font-bold capitalize"><input type="checkbox" checked={form[field]} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.checked }))} />{field}</label>)}</div>
          <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Attribute"}</Button></div>
        </form>
      </div> : null}
    </div>
  );
}
