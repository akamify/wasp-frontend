import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { FilterBuilder } from "@modules/audiences/components/FilterBuilder";
import { DEFAULT_AUDIENCE_GROUP } from "@modules/audiences/constants";
import type { Audience, AudienceFieldDefinition, AudienceGroup, SavedFilter } from "@modules/audiences/types";
import { useToast } from "@shared/providers/ToastContext";
import { Input } from "@shared/ui/Input";
import { Modal } from "@shared/ui/Modal";
import { Select } from "@shared/ui/Select";
import { Textarea } from "@shared/ui/Textarea";
import { Copy, Megaphone, PlayCircle, Plus, Trash2 } from "lucide-react";

type PreviewContact = {
  _id: string;
  name?: string;
  phone: string;
  company?: string;
  tags?: string[];
};

function cloneTree<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default function AudiencesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [fieldCatalog, setFieldCatalog] = useState<AudienceFieldDefinition[]>([]);
  const [filterTree, setFilterTree] = useState<AudienceGroup>(cloneTree(DEFAULT_AUDIENCE_GROUP));
  const [previewContacts, setPreviewContacts] = useState<PreviewContact[]>([]);
  const [previewCount, setPreviewCount] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState<Record<string, boolean>>({});
  const [saveMode, setSaveMode] = useState<"audience" | "filter">("audience");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveType, setSaveType] = useState<"dynamic" | "static">("dynamic");
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [audiencesResult, filtersResult] = await Promise.all([API.audiences.list(), API.savedFilters.list()]);
      setAudiences(Array.isArray(audiencesResult?.audiences) ? audiencesResult.audiences : []);
      setSavedFilters(Array.isArray(filtersResult?.savedFilters) ? filtersResult.savedFilters : []);
      setFieldCatalog(Array.isArray(audiencesResult?.fieldCatalog) ? audiencesResult.fieldCatalog : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load audiences");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!fieldCatalog.length) return;
    const handle = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const preview = await API.contacts.filterPreview({ filterTree, page: 1, limit: 25 });
        setPreviewContacts(Array.isArray(preview?.contacts) ? preview.contacts : []);
        setPreviewCount(Number(preview?.total || 0));
      } catch (e: any) {
        toast(e?.response?.data?.message || "Failed to preview contacts", "error");
      } finally {
        setPreviewLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [filterTree, fieldCatalog, toast]);

  const selectedContactIds = useMemo(() => Object.keys(selectedContacts).filter((id) => selectedContacts[id]), [selectedContacts]);

  async function saveCurrentDefinition() {
    setSaving(true);
    try {
      if (saveMode === "filter") {
        const result = await API.savedFilters.create({
          name: saveName,
          description: saveDescription,
          filterTree,
        });
        setSavedFilters((curr) => [result.savedFilter, ...curr]);
        toast("Saved filter created.", "success");
      } else {
        const payload = saveType === "dynamic"
          ? { name: saveName, description: saveDescription, type: "dynamic", filterTree }
          : { name: saveName, description: saveDescription, type: "static", contactIds: selectedContactIds };
        const result = await API.audiences.create(payload);
        setAudiences((curr) => [result.audience, ...curr]);
        toast("Audience created.", "success");
      }
      setSaveModalOpen(false);
      setSaveName("");
      setSaveDescription("");
      setSaveType("dynamic");
      setSaveMode("audience");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAudience(id: string) {
    if (!confirm("Delete this audience?")) return;
    try {
      await API.audiences.remove(id);
      setAudiences((curr) => curr.filter((item) => item._id !== id));
      toast("Audience deleted.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to delete audience", "error");
    }
  }

  async function deleteSavedFilter(id: string) {
    if (!confirm("Delete this saved filter?")) return;
    try {
      await API.savedFilters.remove(id);
      setSavedFilters((curr) => curr.filter((item) => item._id !== id));
      toast("Saved filter deleted.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to delete saved filter", "error");
    }
  }

  return (
    <div className="space-y-5 p-2 md:p-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="p-2">
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Audience Manager</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-ink-800/60">Dynamic audiences, static lists, and reusable filter shortcuts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={load} disabled={loading} className="h-10 border border-ink-900/10 bg-white">Refresh</Button>
          <Button onClick={() => setSaveModalOpen(true)} className="h-10 gap-2"><Plus size={16} /> Save Audience</Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_420px]">
        <div className="space-y-5">
          <FilterBuilder value={filterTree} fieldCatalog={fieldCatalog} matchCount={previewCount} loading={previewLoading} onChange={setFilterTree} />

          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-ink-800/45">Preview</div>
                <div className="mt-1 text-2xl font-black text-ink-900">Matching contacts</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="border border-ink-900/10 bg-white" onClick={() => navigate("/app/contacts")}>Open Contacts</Button>
                <Button variant="ghost" className="border border-ink-900/10 bg-white" onClick={() => setSaveModalOpen(true)}>Save Current</Button>
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[5px] border border-ink-900/10">
              <table className="w-full min-w-[640px]">
                <thead className="bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-ink-800/45">
                  <tr>
                    <th className="px-4 py-3">Pick</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/5 bg-white">
                  {previewContacts.map((contact) => (
                    <tr key={contact._id}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={!!selectedContacts[contact._id]}
                          onChange={() => setSelectedContacts((curr) => ({ ...curr, [contact._id]: !curr[contact._id] }))}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-black text-ink-900">{contact.name || contact.phone}</div>
                        <div className="text-xs text-ink-800/60">{contact.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-ink-800/70">{contact.company || "-"}</td>
                      <td className="px-4 py-3 text-xs text-ink-800/60">{Array.isArray(contact.tags) && contact.tags.length ? contact.tags.join(", ") : "-"}</td>
                    </tr>
                  ))}
                  {!previewContacts.length ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-800/60">
                        No matching contacts yet. Add a few rules to start building a segment.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-ink-800/45">Saved Filters</div>
            <div className="mt-1 text-2xl font-black text-ink-900">Reusable shortcuts</div>
            <div className="mt-4 space-y-3">
              {savedFilters.map((filter) => (
                <div key={filter._id} className="rounded-[5px] border border-ink-900/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-ink-900">{filter.name}</div>
                      <div className="mt-1 text-xs text-ink-800/60">{filter.description || "No description"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" className="h-9 w-9 p-0" onClick={() => setFilterTree(cloneTree(filter.filterTree))}>
                        <Copy size={14} />
                      </Button>
                      <Button type="button" variant="ghost" className="h-9 w-9 p-0 text-rose-600" onClick={() => deleteSavedFilter(filter._id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!savedFilters.length ? <div className="rounded-[5px] border border-dashed border-ink-900/15 bg-slate-50 p-4 text-sm text-ink-800/65">No saved filters yet.</div> : null}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-ink-800/45">Audiences</div>
            <div className="mt-1 text-2xl font-black text-ink-900">Static lists and live segments</div>
            <div className="mt-4 space-y-3">
              {audiences.map((audience) => (
                <div key={audience._id} className="rounded-[5px] border border-ink-900/10 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-black text-ink-900">{audience.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-widest text-ink-800/45">{audience.type} · {Number(audience.contactCount || 0).toLocaleString()} contacts</div>
                      <div className="mt-2 text-xs text-ink-800/60">{audience.description || "No description"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" className="h-9 w-9 p-0" onClick={() => navigate("/app/send")}>
                        <Megaphone size={14} />
                      </Button>
                      <Button type="button" variant="ghost" className="h-9 w-9 p-0" onClick={() => navigate("/app/automation")}>
                        <PlayCircle size={14} />
                      </Button>
                      <Button type="button" variant="ghost" className="h-9 w-9 p-0 text-rose-600" onClick={() => deleteAudience(audience._id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!audiences.length ? <div className="rounded-[5px] border border-dashed border-ink-900/15 bg-slate-50 p-4 text-sm text-ink-800/65">No audiences yet.</div> : null}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={saveModalOpen} onClose={() => !saving && setSaveModalOpen(false)} title="Save Current Definition" className="max-w-xl">
        <div className="space-y-4">
          <Select label="Save as" value={saveMode} onChange={(event) => setSaveMode(event.target.value as "audience" | "filter")}>
            <option value="audience">Audience</option>
            <option value="filter">Saved Filter</option>
          </Select>
          {saveMode === "audience" ? (
            <Select label="Audience type" value={saveType} onChange={(event) => setSaveType(event.target.value as "dynamic" | "static")}>
              <option value="dynamic">Dynamic Audience</option>
              <option value="static">Static List</option>
            </Select>
          ) : null}
          <Input label="Name" value={saveName} onChange={(event) => setSaveName(event.target.value)} maxLength={120} placeholder="Hot leads - Delhi" />
          <Textarea label="Description" value={saveDescription} onChange={(event) => setSaveDescription(event.target.value)} maxLength={500} placeholder="Optional notes for your team." />
          {saveMode === "audience" && saveType === "static" ? (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-4 text-sm text-ink-800/65">
              Static audiences use the contacts you selected in the preview table. Selected right now: <span className="font-black text-ink-900">{selectedContactIds.length}</span>
            </div>
          ) : (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-4 text-sm text-ink-800/65">
              Dynamic audiences store the filter tree and refresh automatically as contact data changes. Current live count: <span className="font-black text-ink-900">{previewCount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSaveModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              onClick={saveCurrentDefinition}
              disabled={saving || !saveName.trim() || (saveMode === "audience" && saveType === "static" && !selectedContactIds.length)}
            >
              {saving ? "Saving..." : saveMode === "filter" ? "Save Filter" : "Save Audience"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
