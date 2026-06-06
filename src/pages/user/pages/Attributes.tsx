import { useEffect, useMemo, useState } from "react";
import { Braces, Plus, RefreshCcw, Search } from "lucide-react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { useToast } from "@shared/providers/ToastContext";
import { AttributeModal } from "./attributes/AttributeModal";
import { AttributesSkeleton } from "./attributes/AttributesSkeleton";

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

const EMPTY_FORM = { key: "", label: "", defaultValue: "" };

export default function AttributesPage() {
  const { toast } = useToast();
  const [definitions, setDefinitions] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<AttributeDefinition | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const result = await API.contacts.attributes({ includeInactive: true, includeUsage: true });
      setDefinitions(result.definitions || []);
    } catch (error: any) {
      setLoadError(error?.userMessage || "Failed to load attributes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase().replace(/^\$/, "");
    if (!normalized) return definitions;
    return definitions.filter((definition) => `${definition.label} ${definition.key}`.toLowerCase().includes(normalized));
  }, [definitions, query]);

  function startCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function startEdit(definition: AttributeDefinition) {
    setEditing(definition);
    setForm({ key: definition.key, label: definition.label, defaultValue: String(definition.defaultValue ?? "") });
    setOpen(true);
  }

  async function save() {
    if (!form.label.trim() || !/^[a-z][a-z0-9_]{0,49}$/.test(form.key)) return;
    setSaving(true);
    try {
      if (editing) {
        await API.contacts.updateAttribute(editing.key, {
          label: form.label.trim(),
          defaultValue: form.defaultValue,
        });
      } else {
        await API.contacts.createAttribute({
          label: form.label.trim(),
          key: form.key,
          type: "text",
          defaultValue: form.defaultValue,
          required: false,
          visible: true,
          editable: true,
          active: true,
        });
      }
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
    if (definition.active && !confirm("Archive this attribute? Existing contact values will remain, but this attribute will not be available for new assignments.")) return;
    try {
      if (definition.active) await API.contacts.archiveAttribute(definition.key);
      else await API.contacts.updateAttribute(definition.key, { active: true });
      toast(definition.active ? "Attribute archived" : "Attribute enabled", "success");
      await load();
    } catch (error: any) {
      toast(error?.userMessage || "Failed to update attribute", "error");
    }
  }

  if (loading) return <div className="p-4 md:p-8"><AttributesSkeleton /></div>;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Attributes</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-800/60">Manage reusable contact fields for segmentation and campaign personalization.</p>
        </div>
        <Button onClick={startCreate} className="h-11 gap-2"><Plus size={17} /> Create Attribute</Button>
      </div>

      <div className="flex items-start gap-4 rounded-[12px] border border-brand-100 bg-brand-50/70 p-4 text-brand-900">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm"><Braces size={19} /></div>
        <p className="pt-1 text-sm font-semibold leading-6">
          Attributes are contact fields like <span className="font-mono">$city</span> or <span className="font-mono">$last_order_id</span>. Assign values in contact profiles and use them in campaigns.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-[12px] border border-rose-200 bg-rose-50 p-8 text-center">
          <div className="font-black text-rose-900">Attributes could not be loaded</div>
          <div className="mt-1 text-sm font-semibold text-rose-700">{loadError}</div>
          <Button variant="outline" className="mt-5 gap-2" onClick={load}><RefreshCcw size={15} /> Retry</Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[5px] border border-ink-900/10 bg-white shadow-sm">
          <div className="border-b border-ink-900/10 p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input className="h-11 w-full rounded-[5px] border border-slate-200 py-2.5 pl-10 pr-3 text-sm font-semibold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or variable" />
            </div>
          </div>

          {definitions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Braces size={28} /></div>
              <h2 className="mt-5 text-xl font-black text-slate-900">No attributes yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">Create your first attribute to store contact details like city, order ID, or payment method.</p>
              <Button onClick={startCreate} className="mt-6 gap-2"><Plus size={16} /> Create Attribute</Button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <tr>{["Name", "Variable", "Default Value", "Usage", "Status", "Actions"].map((heading) => <th key={heading} className="px-5 py-3.5">{heading}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((definition) => <AttributeRow key={definition.key} definition={definition} onEdit={startEdit} onToggle={toggle} />)}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 p-4 md:hidden">
                {filtered.map((definition) => <AttributeCard key={definition.key} definition={definition} onEdit={startEdit} onToggle={toggle} />)}
              </div>
              {!filtered.length ? <div className="px-6 py-12 text-center text-sm font-semibold text-slate-500">No attributes match your search.</div> : null}
            </>
          )}
        </div>
      )}

      <AttributeModal editing={Boolean(editing)} form={form} open={open} saving={saving} onChange={setForm} onClose={() => setOpen(false)} onSubmit={save} />
    </div>
  );
}

function AttributeRow({ definition, onEdit, onToggle }: AttributeItemProps) {
  return (
    <tr>
      <td className="px-5 py-4 font-black text-slate-900">{definition.label}</td>
      <td className="px-5 py-4 font-mono text-sm font-bold text-brand-700">${definition.key}</td>
      <td className="max-w-48 truncate px-5 py-4 font-semibold text-slate-600">{displayDefault(definition.defaultValue)}</td>
      <td className="px-5 py-4 font-bold text-slate-700">{definition.usageCount || 0}</td>
      <td className="px-5 py-4"><Status active={definition.active} /></td>
      <td className="px-5 py-4"><Actions definition={definition} onEdit={onEdit} onToggle={onToggle} /></td>
    </tr>
  );
}

function AttributeCard({ definition, onEdit, onToggle }: AttributeItemProps) {
  return (
    <div className="rounded-[12px] border border-slate-100 p-4">
      <div className="flex items-start justify-between gap-3"><div><div className="font-black text-slate-900">{definition.label}</div><div className="mt-1 font-mono text-sm font-bold text-brand-700">${definition.key}</div></div><Status active={definition.active} /></div>
      <div className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">Default Value</div>
      <div className="mt-1 text-sm font-semibold text-slate-700">{displayDefault(definition.defaultValue)}</div>
      <div className="mt-4 flex items-center justify-between"><span className="text-xs font-bold text-slate-500">{definition.usageCount || 0} contacts</span><Actions definition={definition} onEdit={onEdit} onToggle={onToggle} /></div>
    </div>
  );
}

type AttributeItemProps = { definition: AttributeDefinition; onEdit: (definition: AttributeDefinition) => void; onToggle: (definition: AttributeDefinition) => void };

function Status({ active }: { active: boolean }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Active" : "Archived"}</span>;
}

function Actions({ definition, onEdit, onToggle }: AttributeItemProps) {
  return <div className="flex items-center gap-3"><button className="text-sm font-bold text-brand-600" onClick={() => onEdit(definition)}>Edit</button><button className="text-sm font-bold text-slate-600" onClick={() => onToggle(definition)}>{definition.active ? "Archive" : "Enable"}</button></div>;
}

function displayDefault(value: AttributeDefinition["defaultValue"]) {
  return value === undefined || value === null || value === "" ? "Not set" : String(value);
}
