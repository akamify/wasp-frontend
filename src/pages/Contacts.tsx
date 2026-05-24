import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { ContactsListSkeleton } from "@components/ui/Skeletons";
import { RefreshCcw, Plus, Search, Trash2, Pencil, User, X, Download } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { Badge } from "@components/ui/Badge";
import { useToast } from "@shared/providers/ToastContext";
import { AnimatePresence, motion } from "framer-motion";

type Contact = {
  _id: string;
  name?: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  tags?: string[];
  attributes?: Record<string, string | number | boolean>;
  source?: string;
  lastMessagePreview?: string;
  lastInboundAt?: string;
  lastOutboundAt?: string;
  updatedAt?: string;
};

function joinTags(tags?: string[]) {
  return (tags || []).join(", ");
}

function normalizeTag(tag: string) {
  return tag.replace(/\s+/g, " ").trim();
}

function parseTags(raw: string) {
  if (!raw.trim()) return [];
  const pieces = raw.split(/[,\n;]+/g).map(normalizeTag).filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const tag of pieces) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag.slice(0, 32));
    if (result.length >= 20) break;
  }
  return result;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatAttributes(attributes?: Record<string, string | number | boolean>) {
  if (!attributes || typeof attributes !== "object") return "";
  return Object.entries(attributes)
    .filter(([key]) => String(key || "").trim())
    .map(([key, value]) => `${key}:${String(value ?? "").trim()}`)
    .join("\n");
}

function parseAttributes(raw: string) {
  const out: Record<string, string> = {};
  const lines = String(raw || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const splitAt = line.indexOf(":");
    if (splitAt <= 0) continue;
    const key = line.slice(0, splitAt).trim();
    const value = line.slice(splitAt + 1).trim();
    if (!key || !value) continue;
    out[key] = value;
  }
  return out;
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  company: "",
  tags: "",
  attributes: "",
  notes: "",
};

export default function ContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 25;
  const [form, setForm] = useState(EMPTY_FORM);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "has-tags" | "has-company" | "recent-activity">("all");
  const [sort, setSort] = useState<"name" | "company" | "tags" | "recent" | "oldest">("recent");
  const isInitialLoad = useRef(true);
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  async function load() {
    const isFirst = isInitialLoad.current;
    if (isFirst) setLoading(true);
    setSyncing(true);
    try {
      const res = await API.contacts.list({ page, limit: pageSize, search: search || undefined });
      setContacts(res.contacts || []);
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

  // Auto-scroll table into view when page changes
  useEffect(() => {
    if (tableRef.current && page > 1) {
      tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [page]);



  function resetForm() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function fillForm(contact: Contact) {
    setSelectedId(contact._id);
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      company: contact.company || "",
      tags: joinTags(contact.tags),
      attributes: formatAttributes(contact.attributes),
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
      attributes: parseAttributes(form.attributes),
      notes: form.notes,
    };

    try {
      if (selectedId) {
        const res = await API.contacts.update(selectedId, payload);
        setContacts((current) =>
          current.map((contact) => (contact._id === selectedId ? res.contact : contact))
        );
        toast("Contact updated successfully.", "success");
        setIsModalOpen(false);
      } else {
        const res = await API.contacts.create(payload);
        setContacts((current) => [res.contact, ...current]);
        toast("Contact created successfully.", "success");
        setIsModalOpen(false);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save contact");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDelete() {
    const selectedIds = Object.keys(multiSelected).filter(id => multiSelected[id]);
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} contacts?`)) return;

    setSaving(true);
    try {
      await Promise.all(selectedIds.map(id => API.contacts.remove(id)));
      setContacts(curr => curr.filter(c => !multiSelected[c._id]));
      setMultiSelected({});
      toast(`${selectedIds.length} contacts deleted.`, "success");
    } catch (e: any) {
      toast("Bulk delete failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function exportSelectedCsv() {
    const selectedIds = Object.keys(multiSelected).filter((id) => multiSelected[id]);
    if (!selectedIds.length) {
      toast("Select contacts to export.", "error");
      return;
    }
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

  async function deleteContact(contact: Contact) {
    if (!confirm(`Delete ${contact.name || contact.phone}?`)) return;
    setSaving(true);
    try {
      await API.contacts.remove(contact._id);
      setContacts((current) => current.filter((item) => item._id !== contact._id));
      setMultiSelected((current) => {
        const next = { ...current };
        delete next[contact._id];
        return next;
      });
      setTotal((current) => Math.max(0, current - 1));
      toast("Contact deleted.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to delete contact", "error");
    } finally {
      setSaving(false);
    }
  }

  const allSelected = contacts.length > 0 && contacts.every(c => multiSelected[c._id]);
  const someSelected = contacts.some(c => multiSelected[c._id]);
  const selectedCount = Object.values(multiSelected).filter(Boolean).length;


  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (page !== 1) {
      setPage(1);
      return;
    }
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Filter and sort contacts
  const processedContacts = contacts.filter((c) => {
    if (filter === "has-tags") return c.tags && c.tags.length > 0;
    if (filter === "has-company") return c.company && c.company.trim();
    if (filter === "recent-activity") return c.lastInboundAt || c.lastOutboundAt;
    return true;
  }).sort((a, b) => {
    if (sort === "name") return (a.name || a.phone).localeCompare(b.name || b.phone);
    if (sort === "company") return (a.company || "").localeCompare(b.company || "");
    if (sort === "tags") return (a.tags?.length || 0) - (b.tags?.length || 0);
    if (sort === "recent") return new Date(b.lastInboundAt || b.lastOutboundAt || 0).getTime() - new Date(a.lastInboundAt || a.lastOutboundAt || 0).getTime();
    if (sort === "oldest") return new Date(a.lastInboundAt || a.lastOutboundAt || 0).getTime() - new Date(b.lastInboundAt || b.lastOutboundAt || 0).getTime();
    return 0;
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Audience</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Manage your customer records and chats</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={load} disabled={loading || syncing} className="h-10 border border-ink-900/10 bg-white gap-2">
            <RefreshCcw size={16} className={cn(syncing && "animate-spin")} />
            {syncing ? "Syncing..." : "Refresh"}
          </Button>
          <Button onClick={resetForm} className="h-10 gap-2">
            <Plus size={18} /> New Contact
          </Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      <Card className="p-0 border-ink-900/5 shadow-xl shadow-ink-900/5 overflow-hidden">
        <div className="border-b border-ink-900/5 bg-slate-50/50 p-4 md:p-6">
          <form className="flex items-center gap-3" onSubmit={runSearch}>
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/40" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone or company..."
                className="w-full h-12 pl-11 pr-4 rounded-[5px] border border-ink-900/10 bg-white text-sm font-semibold placeholder:text-ink-800/30 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <Button type="submit" className="h-12 px-8">Search</Button>
          </form>
          <div className="flex items-start flex-col flex-row  gap-3 mt-4">
            <div className="flex items-center gap-1 m-1 p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
              {(["all", "has-tags", "has-company", "recent-activity"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${filter === f
                    ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                    : "text-ink-800/40 hover:text-ink-900"
                    }`}
                >
                  {f === "has-tags" ? "Tags" : f === "has-company" ? "Company" : f === "recent-activity" ? "Active" : "All"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 m-1 p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
              {(["name", "recent", "oldest"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${sort === s
                    ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                    : "text-ink-800/40 hover:text-ink-900"
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {someSelected && (
          <div className="bg-brand-50 border-y border-brand-100 px-6 py-3 flex items-center justify-between">
            <div className="text-sm font-bold text-brand-700">
              {selectedCount} contacts selected
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={exportSelectedCsv} disabled={saving} className="h-8 gap-1.5">
                <Download size={14} /> Export CSV
              </Button>
              <Button size="sm" variant="danger" onClick={bulkDelete} disabled={saving} className="h-8 gap-1.5">
                <Trash2 size={14} /> Delete Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMultiSelected({})} className="h-8">Cancel</Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full min-w-[1300px] border-collapse">
            <thead>
              <tr className="border-b border-ink-900/5 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-ink-800/40">
                <th className="w-12 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      const next: Record<string, boolean> = {};
                      if (e.target.checked) contacts.forEach(c => next[c._id] = true);
                      setMultiSelected(next);
                    }}
                    className="rounded-[3px] border-ink-900/20"
                  />
                </th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
                <th className="px-6 py-4">Attributes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8">
                    <ContactsListSkeleton rows={8} />
                  </td>
                </tr>
              ) : processedContacts.length ? (
                processedContacts.map((contact) => (
                  <tr
                    key={contact._id}
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/conversations/${encodeURIComponent(contact.phone)}`)}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={!!multiSelected[contact._id]}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => setMultiSelected(p => ({ ...p, [contact._id]: !p[contact._id] }))}
                        className="rounded-[3px] border-ink-900/20"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-black text-sm">
                          {contact.name ? contact.name[0].toUpperCase() : <User size={18} />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-ink-900 truncate max-w-[200px]">{contact.name || contact.phone}</div>
                          <div className="text-xs text-ink-800/60 font-medium">{contact.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-ink-800/70">
                      {contact.company || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                        {contact.tags?.slice(0, 3).map((tag, i) => (
                          <Badge key={i} tone="neutral" className="bg-white border border-ink-900/5 text-[10px] py-0.5 px-2">
                            {tag}
                          </Badge>
                        ))}
                        {(contact.tags?.length || 0) > 3 && (
                          <span className="text-[10px] font-bold text-ink-800/30">+{contact.tags!.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-semibold text-ink-800/60">
                        {contact.lastInboundAt ? formatDate(contact.lastInboundAt) : "No activity"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            fillForm(contact);
                          }}
                          className="h-10 w-10 p-0 transition-opacity"
                        >
                          <Pencil size={14} />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contact.attributes && Object.keys(contact.attributes).length ? (
                        <div className="flex flex-wrap gap-1.5 max-w-[320px]">
                          {Object.entries(contact.attributes)
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <Badge key={key} tone="neutral" className="bg-white border border-ink-900/5 text-[10px] py-0.5 px-2">
                                {key}:{String(value)}
                              </Badge>
                            ))}
                          {Object.keys(contact.attributes).length > 3 ? (
                            <span className="text-[10px] font-bold text-ink-800/30">+{Object.keys(contact.attributes).length - 3}</span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-ink-800/50">-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-ink-800/20 mb-4">
                      <User size={32} />
                    </div>
                    <div className="text-sm font-bold text-ink-900">No contacts found</div>
                    <div className="text-xs font-semibold text-ink-800/50 mt-1">Try adjusting your search or add a new contact.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/5 bg-slate-50/50 px-4 py-3 md:px-6">
          <div className="text-xs font-bold uppercase tracking-widest text-ink-800/40">
            Page {page} of {totalPages} · {total} contacts
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page <= 1 || loading || syncing}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="h-9"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page >= totalPages || loading || syncing}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="h-9"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {createPortal(
        <AnimatePresence>
          {isModalOpen ? (
            <motion.div
              className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setIsModalOpen(false);
              }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md overflow-hidden rounded-[5px] border border-slate-100 bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">
                    {selectedId ? "Edit Contact" : "Add New Contact"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-[5px] p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form className="max-h-[75vh] space-y-4 overflow-y-auto p-6 custom-scrollbar" onSubmit={saveContact}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                    <Input
                      label="Phone Number"
                      value={form.phone}
                      onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                      placeholder="919999999999"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Email Address"
                      value={form.email}
                      onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                    <Input
                      label="Company"
                      value={form.company}
                      onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <Input
                    label="Tags"
                    value={form.tags}
                    onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))}
                    placeholder="vip, new-lead, search-campaign"
                    hint="Comma separated tags"
                  />
                  <Textarea
                    label="Attributes"
                    value={form.attributes}
                    onChange={(e) => setForm((current) => ({ ...current, attributes: e.target.value }))}
                    placeholder={"city: Delhi\nplan: premium\nsource: website"}
                    hint="One per line in key:value format"
                    className="min-h-[90px]"
                  />
                  <Textarea
                    label="Private Notes"
                    value={form.notes}
                    onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))}
                    placeholder="Add context about this customer..."
                    className="min-h-[100px]"
                  />

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={saving} className="px-8">
                      {saving ? "Saving..." : selectedId ? "Update Contact" : "Create Contact"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
