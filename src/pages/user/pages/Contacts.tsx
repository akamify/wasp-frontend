import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { Braces, RefreshCcw, Plus, Upload, Layers3 } from "lucide-react";
import { Input } from "@shared/ui/Input";
import { Modal } from "@shared/ui/Modal";
import { Textarea } from "@shared/ui/Textarea";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";
import { FilterBuilder } from "@modules/audiences/components/FilterBuilder";
import { DEFAULT_AUDIENCE_GROUP } from "@modules/audiences/constants";
import type { AudienceFieldDefinition, AudienceGroup } from "@modules/audiences/types";
import { Select } from "@shared/ui/Select";
import { ContactFormModal } from "./contacts/ContactFormModal";
import { ContactsTableCard } from "./contacts/ContactsTableCard";
import { ContactAnalyticsModal } from "./contacts/ContactAnalyticsModal";
import {
  ContactImportModal,
  parseCsvText,
  type ImportContactRow,
} from "./contacts/ContactImportModal";
import {
  EMPTY_FORM,
  joinTags,
  parseTags,
  type Contact,
} from "./contacts/contacts.utils";
import type { AttributeDefinition } from "./Attributes";

export default function ContactsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const tableRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [advancedContacts, setAdvancedContacts] = useState<Contact[]>([]);
  const [fieldCatalog, setFieldCatalog] = useState<AudienceFieldDefinition[]>([]);
  const [filterTree, setFilterTree] = useState<AudienceGroup>(DEFAULT_AUDIENCE_GROUP);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [definitions, setDefinitions] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [contactAnalytics, setContactAnalytics] = useState<any | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<Record<string, string>[]>([]);
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "has-tags" | "has-company" | "recent-activity">("all");
  const [sort, setSort] = useState<"name" | "company" | "tags" | "recent" | "oldest">("recent");
  const [saveAudienceOpen, setSaveAudienceOpen] = useState(false);
  const [saveAudienceMode, setSaveAudienceMode] = useState<"dynamic" | "static">("dynamic");
  const [saveAudienceName, setSaveAudienceName] = useState("");
  const [saveAudienceDescription, setSaveAudienceDescription] = useState("");
  const [saveAudienceBusy, setSaveAudienceBusy] = useState(false);

  const pageSize = 25;
  const hasAdvancedFilters = filterTree.conditions.length > 0;
  const displayedContacts = hasAdvancedFilters ? advancedContacts : contacts;
  const displayedTotal = hasAdvancedFilters ? previewTotal : total;
  const totalPages = Math.max(1, Math.ceil(displayedTotal / pageSize));
  const allSelected = displayedContacts.length > 0 && displayedContacts.every((c) => multiSelected[c._id]);
  const someSelected = displayedContacts.some((c) => multiSelected[c._id]);
  const selectedCount = Object.values(multiSelected).filter(Boolean).length;

  async function load() {
    const isFirst = isInitialLoad.current;
    if (isFirst) setLoading(true);
    setSyncing(true);
    try {
      const [res, attributesResult, savedFiltersResult] = await Promise.all([
        API.contacts.list({ page, limit: pageSize, search: search || undefined }),
        API.contacts.attributes({ includeInactive: true }),
        API.savedFilters.list(),
      ]);
      setContacts(res.contacts || []);
      setDefinitions(attributesResult.definitions || []);
      setFieldCatalog(Array.isArray(savedFiltersResult?.fieldCatalog) ? savedFiltersResult.fieldCatalog : []);
      setTotal(Number(res.total || 0));
      if (!isFirst) toast("Contacts refreshed", "success");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  useEffect(() => {
    if (tableRef.current && page > 1) tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page]);

  useEffect(() => {
    if (!fieldCatalog.length || !hasAdvancedFilters) {
      setAdvancedContacts([]);
      setPreviewTotal(0);
      return;
    }
    const handle = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const preview = await API.contacts.filterPreview({ filterTree, page, limit: pageSize });
        setAdvancedContacts(preview.contacts || []);
        setPreviewTotal(Number(preview.total || 0));
      } catch (e: any) {
        toast(e?.response?.data?.message || "Failed to preview contacts", "error");
      } finally {
        setPreviewLoading(false);
      }
    }, 350);
    return () => window.clearTimeout(handle);
  }, [fieldCatalog, hasAdvancedFilters, filterTree, page, toast]);

  const processedContacts = displayedContacts
    .filter((c) => {
      if (filter === "has-tags") return c.tags && c.tags.length > 0;
      if (filter === "has-company") return c.company && c.company.trim();
      if (filter === "recent-activity") return c.lastInboundAt || c.lastOutboundAt;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return (a.name || a.phone).localeCompare(b.name || b.phone);
      if (sort === "company") return (a.company || "").localeCompare(b.company || "");
      if (sort === "tags") return (a.tags?.length || 0) - (b.tags?.length || 0);
      if (sort === "recent") return new Date(b.lastInboundAt || b.lastOutboundAt || 0).getTime() - new Date(a.lastInboundAt || a.lastOutboundAt || 0).getTime();
      if (sort === "oldest") return new Date(a.lastInboundAt || a.lastOutboundAt || 0).getTime() - new Date(b.lastInboundAt || b.lastOutboundAt || 0).getTime();
      return 0;
    });

  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function fillForm(contact: Contact) {
    const activeKeys = new Set(definitions.filter((definition) => definition.active).map((definition) => definition.key));
    const allAttributes = contact.attributes || {};
    setSelectedId(contact._id);
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      company: contact.company || "",
      tags: joinTags(contact.tags),
      attributes: Object.fromEntries(Object.entries(allAttributes).filter(([key]) => activeKeys.has(key))),
      legacyAttributes: Object.fromEntries(Object.entries(allAttributes).filter(([key]) => !activeKeys.has(key))),
      notes: contact.notes || "",
    });
    setIsModalOpen(true);
  }

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      company: form.company,
      tags: parseTags(form.tags),
      attributes: form.attributes,
      notes: form.notes,
    };

    try {
      if (selectedId) {
        const res = await API.contacts.update(selectedId, payload);
        setContacts((curr) => curr.map((c) => (c._id === selectedId ? res.contact : c)));
        toast("Contact updated successfully.", "success");
      } else {
        const res = await API.contacts.create(payload);
        setContacts((curr) => [res.contact, ...curr]);
        toast("Contact created successfully.", "success");
      }
      setIsModalOpen(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDelete() {
    const selectedIds = Object.keys(multiSelected).filter((id) => multiSelected[id]);
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} contacts?`)) return;

    setSaving(true);
    try {
      await Promise.all(selectedIds.map((id) => API.contacts.remove(id)));
      setContacts((curr) => curr.filter((c) => !multiSelected[c._id]));
      setAdvancedContacts((curr) => curr.filter((c) => !multiSelected[c._id]));
      setMultiSelected({});
      toast(`${selectedIds.length} contacts deleted.`, "success");
    } catch {
      toast("Bulk delete failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleImportFile(file?: File | null) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast("Please select a CSV file.", "error");
      return;
    }
    try {
      const parsed = parseCsvText(await file.text());
      if (!parsed.headers.length || !parsed.rows.length) {
        toast("CSV file has no contacts to import.", "error");
        return;
      }
      setImportFileName(file.name);
      setImportHeaders(parsed.headers);
      setImportRows(parsed.rows);
      setImportModalOpen(true);
    } catch {
      toast("Could not parse CSV file.", "error");
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function saveImportedContacts(payload: {
    rows: ImportContactRow[];
    options: { duplicateStrategy: "skip" | "update" | "merge" };
  }) {
    setSaving(true);
    try {
      const res = await API.contacts.importCsv(payload);
      const summary = res.summary || {};
      setImportModalOpen(false);
      toast(
        `Imported contacts: ${summary.created || 0} created, ${summary.updated || 0} updated, ${summary.skipped || 0} skipped.`,
        "success",
      );
      await load();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Contacts import failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function exportSelectedCsv() {
    const selectedIds = Object.keys(multiSelected).filter((id) => multiSelected[id]);
    if (!selectedIds.length) return toast("Select contacts to export.", "error");
    setSaving(true);
    try {
      const response = await API.contacts.exportCsv(selectedIds);
      const blob = response?.data instanceof Blob ? response.data : new Blob([response?.data || ""], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `contacts-export-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast(`Exported ${selectedIds.length} contacts.`, "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Contacts export failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (page !== 1) return setPage(1);
    await load();
  }

  async function saveAudienceDefinition(e: React.FormEvent) {
    e.preventDefault();
    const contactIds = Object.keys(multiSelected).filter((id) => multiSelected[id]);
    if (saveAudienceMode === "static" && !contactIds.length) {
      return toast("Select contacts first for a static audience.", "error");
    }
    setSaveAudienceBusy(true);
    try {
      await API.audiences.create(
        saveAudienceMode === "dynamic"
          ? { name: saveAudienceName, description: saveAudienceDescription, type: "dynamic", filterTree }
          : { name: saveAudienceName, description: saveAudienceDescription, type: "static", contactIds }
      );
      toast("Audience saved.", "success");
      setSaveAudienceOpen(false);
      setSaveAudienceName("");
      setSaveAudienceDescription("");
      setSaveAudienceMode("dynamic");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to save audience", "error");
    } finally {
      setSaveAudienceBusy(false);
    }
  }

  async function openAnalytics(contact: Contact) {
    setAnalyticsOpen(true);
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    setContactAnalytics(null);
    try {
      const result = await API.analytics.customer(contact._id);
      setContactAnalytics(result || null);
    } catch (e: any) {
      setAnalyticsError(e?.response?.data?.message || "Failed to load customer analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  return (
    <div className="space-y-5 p-2 md:p-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="p-2">
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Audience</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-ink-800/60">Manage your customer records, live filters, and saved segments</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => handleImportFile(event.target.files?.[0])}
          />
          <Button
            variant="ghost"
            onClick={() => importInputRef.current?.click()}
            disabled={saving}
            className="h-10 gap-2 border border-ink-900/10 bg-white"
          >
            <Upload size={16} /> Import Contacts
          </Button>
          <Button variant="ghost" onClick={load} disabled={loading || syncing} className="h-10 gap-2 border border-ink-900/10 bg-white">
            <RefreshCcw size={16} className={cn(syncing && "animate-spin")} /> {syncing ? "Syncing..." : "Refresh"}
          </Button>
          <Button onClick={resetForm} className="h-10 gap-2"><Plus size={18} /> New Contact</Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <FilterBuilder value={filterTree} fieldCatalog={fieldCatalog} matchCount={displayedTotal} loading={previewLoading} onChange={setFilterTree} />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => navigate("/app/audiences")} className="h-10 gap-2 border border-ink-900/10 bg-white">
          <Layers3 size={16} /> Open Audience Manager
        </Button>
        <Button onClick={() => setSaveAudienceOpen(true)} className="h-10 gap-2">
          <Layers3 size={16} /> Save Audience
        </Button>
      </div>

      <ContactsTableCard
        loading={loading || previewLoading}
        syncing={syncing}
        saving={saving}
        search={search}
        filter={filter}
        sort={sort}
        contacts={displayedContacts}
        definitions={definitions.filter((definition) => definition.active && definition.visible)}
        processedContacts={processedContacts}
        page={page}
        totalPages={totalPages}
        total={displayedTotal}
        allSelected={allSelected}
        someSelected={someSelected}
        selectedCount={selectedCount}
        multiSelected={multiSelected}
        tableRef={tableRef}
        onSearchChange={setSearch}
        onSearchSubmit={runSearch}
        onFilterChange={setFilter}
        onSortChange={setSort}
        onToggleAll={(checked) => {
          const next: Record<string, boolean> = {};
          if (checked) displayedContacts.forEach((c) => (next[c._id] = true));
          setMultiSelected(next);
        }}
        onToggleOne={(id) => setMultiSelected((p) => ({ ...p, [id]: !p[id] }))}
        onEdit={fillForm}
        onAnalytics={openAnalytics}
        onExportSelected={exportSelectedCsv}
        onBulkDelete={bulkDelete}
        onClearSelected={() => setMultiSelected({})}
        onPagePrev={() => setPage((curr) => Math.max(1, curr - 1))}
        onPageNext={() => setPage((curr) => Math.min(totalPages, curr + 1))}
      />

      <ContactFormModal
        open={isModalOpen}
        selectedId={selectedId}
        form={form}
        saving={saving}
        definitions={definitions.filter((definition) => definition.active && definition.visible)}
        onClose={() => setIsModalOpen(false)}
        onSubmit={saveContact}
        onChange={(updater) => setForm((curr) => updater(curr))}
      />

      <ContactAnalyticsModal
        open={analyticsOpen}
        loading={analyticsLoading}
        error={analyticsError}
        data={contactAnalytics}
        onClose={() => {
          setAnalyticsOpen(false);
          setAnalyticsError(null);
          setContactAnalytics(null);
        }}
      />

      <ContactImportModal
        open={importModalOpen}
        fileName={importFileName}
        headers={importHeaders}
        rows={importRows}
        definitions={definitions}
        saving={saving}
        onClose={() => setImportModalOpen(false)}
        onImport={saveImportedContacts}
      />

      <Modal
        open={saveAudienceOpen}
        onClose={() => {
          if (saveAudienceBusy) return;
          setSaveAudienceOpen(false);
          setSaveAudienceName("");
          setSaveAudienceDescription("");
          setSaveAudienceMode("dynamic");
        }}
        title="Save Audience"
        className="max-w-xl"
      >
        <form onSubmit={saveAudienceDefinition} className="space-y-4">
          <Select label="Audience type" value={saveAudienceMode} onChange={(event) => setSaveAudienceMode(event.target.value as "dynamic" | "static")}>
            <option value="dynamic">Dynamic Audience</option>
            <option value="static">Static List</option>
          </Select>
          <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-4">
            <div className="text-sm font-black text-ink-900">
              {saveAudienceMode === "dynamic" ? `${displayedTotal.toLocaleString()} live matches` : `${selectedCount.toLocaleString()} contacts selected`}
            </div>
            <div className="mt-1 text-xs text-ink-800/60">
              {saveAudienceMode === "dynamic"
                ? "Dynamic audiences store the filter rules and refresh automatically when contact data changes."
                : "Static lists store the currently selected contacts only."}
            </div>
          </div>
          <Input
            label="Audience name"
            value={saveAudienceName}
            onChange={(event) => setSaveAudienceName(event.target.value)}
            placeholder="VIP customers - July"
            maxLength={120}
            required
          />
          <Textarea
            label="Description"
            value={saveAudienceDescription}
            onChange={(event) => setSaveAudienceDescription(event.target.value)}
            placeholder="Optional notes about this audience."
            maxLength={500}
          />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSaveAudienceOpen(false);
                setSaveAudienceName("");
                setSaveAudienceDescription("");
                setSaveAudienceMode("dynamic");
              }}
              disabled={saveAudienceBusy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveAudienceBusy || !saveAudienceName.trim() || (saveAudienceMode === "static" && !selectedCount)}>
              {saveAudienceBusy ? "Saving..." : "Save audience"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
