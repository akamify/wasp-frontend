import { useEffect, useRef, useState } from "react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { Braces, RefreshCcw, Plus } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { useToast } from "@shared/providers/ToastContext";
import { ContactFormModal } from "./contacts/ContactFormModal";
import { ContactsTableCard } from "./contacts/ContactsTableCard";
import {
  EMPTY_FORM,
  joinTags,
  parseTags,
  type Contact,
} from "./contacts/contacts.utils";
import type { AttributeDefinition } from "./Attributes";

export default function ContactsPage() {
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const [contacts, setContacts] = useState<Contact[]>([]);
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
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "has-tags" | "has-company" | "recent-activity">("all");
  const [sort, setSort] = useState<"name" | "company" | "tags" | "recent" | "oldest">("recent");

  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = contacts.length > 0 && contacts.every((c) => multiSelected[c._id]);
  const someSelected = contacts.some((c) => multiSelected[c._id]);
  const selectedCount = Object.values(multiSelected).filter(Boolean).length;

  async function load() {
    const isFirst = isInitialLoad.current;
    if (isFirst) setLoading(true);
    setSyncing(true);
    try {
      const [res, attributesResult] = await Promise.all([
        API.contacts.list({ page, limit: pageSize, search: search || undefined }),
        API.contacts.attributes({ includeInactive: true }),
      ]);
      setContacts(res.contacts || []);
      setDefinitions(attributesResult.definitions || []);
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

  const processedContacts = contacts
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
      setMultiSelected({});
      toast(`${selectedIds.length} contacts deleted.`, "success");
    } catch {
      toast("Bulk delete failed", "error");
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

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Audience</h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-ink-800/60">Manage your customer records and chats</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={load} disabled={loading || syncing} className="h-10 gap-2 border border-ink-900/10 bg-white">
            <RefreshCcw size={16} className={cn(syncing && "animate-spin")} /> {syncing ? "Syncing..." : "Refresh"}
          </Button>
          <Button onClick={resetForm} className="h-10 gap-2"><Plus size={18} /> New Contact</Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <div className="flex items-start gap-3 rounded-[10px] border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm font-semibold leading-6 text-brand-900">
        <Braces size={18} className="mt-0.5 shrink-0 text-brand-600" />
        <span>Use contact fields like <span className="font-mono">$name</span> and attributes like <span className="font-mono">${definitions.find((definition) => definition.active && definition.visible)?.key || "city"}</span> for campaign personalization.</span>
      </div>

      <ContactsTableCard
        loading={loading}
        syncing={syncing}
        saving={saving}
        search={search}
        filter={filter}
        sort={sort}
        contacts={contacts}
        definitions={definitions.filter((definition) => definition.active && definition.visible)}
        processedContacts={processedContacts}
        page={page}
        totalPages={totalPages}
        total={total}
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
          if (checked) contacts.forEach((c) => (next[c._id] = true));
          setMultiSelected(next);
        }}
        onToggleOne={(id) => setMultiSelected((p) => ({ ...p, [id]: !p[id] }))}
        onEdit={fillForm}
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
    </div>
  );
}

