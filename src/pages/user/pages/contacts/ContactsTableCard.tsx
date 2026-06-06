import { useNavigate } from "react-router-dom";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { ContactsListSkeleton } from "@components/ui/Skeletons";
import { Download, Pencil, Search, Trash2, User } from "lucide-react";
import { formatDate, type Contact } from "./contacts.utils";
import type { AttributeDefinition } from "../Attributes";

type Props = {
  loading: boolean;
  syncing: boolean;
  saving: boolean;
  search: string;
  filter: "all" | "has-tags" | "has-company" | "recent-activity";
  sort: "name" | "company" | "tags" | "recent" | "oldest";
  contacts: Contact[];
  definitions: AttributeDefinition[];
  processedContacts: Contact[];
  page: number;
  totalPages: number;
  total: number;
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
  multiSelected: Record<string, boolean>;
  tableRef: React.RefObject<HTMLDivElement | null>;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFilterChange: (f: "all" | "has-tags" | "has-company" | "recent-activity") => void;
  onSortChange: (s: "name" | "company" | "tags" | "recent" | "oldest") => void;
  onToggleAll: (checked: boolean) => void;
  onToggleOne: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onExportSelected: () => void;
  onBulkDelete: () => void;
  onClearSelected: () => void;
  onPagePrev: () => void;
  onPageNext: () => void;
};

export function ContactsTableCard(props: Props) {
  const navigate = useNavigate();
  const {
    loading, syncing, saving, search, filter, sort, contacts, definitions, processedContacts, page, totalPages, total,
    allSelected, someSelected, selectedCount, multiSelected, tableRef,
    onSearchChange, onSearchSubmit, onFilterChange, onSortChange,
    onToggleAll, onToggleOne, onEdit, onExportSelected, onBulkDelete, onClearSelected, onPagePrev, onPageNext,
  } = props;

  return (
    <Card className="overflow-hidden border-ink-900/5 p-0 shadow-xl shadow-ink-900/5">
      <div className="border-b border-ink-900/5 bg-slate-50/50 p-4 md:p-6">
        <form className="flex items-center gap-3" onSubmit={onSearchSubmit}>
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/40" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, phone or company..."
              className="h-12 w-full rounded-[5px] border border-ink-900/10 bg-white pl-11 pr-4 text-sm font-semibold placeholder:text-ink-800/30 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <Button type="submit" className="h-12 px-8">Search</Button>
        </form>

        <div className="mt-4 flex flex-row items-start gap-3">
          <div className="m-1 flex items-center gap-1 rounded-[5px] border border-ink-900/5 bg-slate-50 p-1">
            {(["all", "has-tags", "has-company", "recent-activity"] as const).map((f) => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5" : "text-ink-800/40 hover:text-ink-900"}`}
              >
                {f === "has-tags" ? "Tags" : f === "has-company" ? "Company" : f === "recent-activity" ? "Active" : "All"}
              </button>
            ))}
          </div>

          <div className="m-1 flex items-center gap-1 rounded-[5px] border border-ink-900/5 bg-slate-50 p-1">
            {(["name", "recent", "oldest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onSortChange(s)}
                className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${sort === s ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5" : "text-ink-800/40 hover:text-ink-900"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {someSelected ? (
        <div className="flex items-center justify-between border-y border-brand-100 bg-brand-50 px-6 py-3">
          <div className="text-sm font-bold text-brand-700">{selectedCount} contacts selected</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onExportSelected} disabled={saving} className="h-8 gap-1.5"><Download size={14} /> Export CSV</Button>
            <Button size="sm" variant="danger" onClick={onBulkDelete} disabled={saving} className="h-8 gap-1.5"><Trash2 size={14} /> Delete Selected</Button>
            <Button size="sm" variant="ghost" onClick={onClearSelected} className="h-8">Cancel</Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto" ref={tableRef}>
        <table className="min-w-[1300px] w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-900/5 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wider text-ink-800/40">
              <th className="w-12 px-6 py-4">
                <input type="checkbox" checked={allSelected} onChange={(e) => onToggleAll(e.target.checked)} className="rounded-[3px] border-ink-900/20" />
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
              <tr><td colSpan={7} className="p-8"><ContactsListSkeleton rows={8} /></td></tr>
            ) : processedContacts.length ? (
              processedContacts.map((contact) => (
                <tr key={contact._id} className="group cursor-pointer transition-colors hover:bg-slate-50/50" onClick={() => navigate(`/app/conversations/${encodeURIComponent(contact.phone)}`)}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={!!multiSelected[contact._id]}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleOne(contact._id)}
                      className="rounded-[3px] border-ink-900/20"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-black text-brand-600">{contact.name ? contact.name[0].toUpperCase() : <User size={18} />}</div>
                      <div className="min-w-0">
                        <div className="max-w-[200px] truncate text-sm font-bold text-ink-900">{contact.name || contact.phone}</div>
                        <div className="text-xs font-medium text-ink-800/60">{contact.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-ink-800/70">{contact.company || "-"}</td>
                  <td className="px-6 py-4">
                    <div className="flex max-w-[300px] flex-wrap gap-1.5">
                      {contact.tags?.slice(0, 3).map((tag, i) => <Badge key={i} tone="neutral" className="border border-ink-900/5 bg-white px-2 py-0.5 text-[10px]">{tag}</Badge>)}
                      {(contact.tags?.length || 0) > 3 ? <span className="text-[10px] font-bold text-ink-800/30">+{contact.tags!.length - 3}</span> : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-ink-800/60">{contact.lastInboundAt ? formatDate(contact.lastInboundAt) : "No activity"}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(contact);
                        }}
                        className="h-10 w-10 p-0 transition-opacity"
                      >
                        <Pencil size={14} />
                      </Button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {contact.attributes && Object.keys(contact.attributes).length ? (
                      <div className="flex max-w-[320px] flex-wrap gap-1.5">
                        {getDisplayAttributes(contact, definitions).slice(0, 3).map(({ key, label, value }) => <Badge key={key} tone="neutral" className="border border-ink-900/5 bg-white px-2 py-0.5 text-[10px]">{label}: {String(value)}</Badge>)}
                        {Object.keys(contact.attributes).length > 3 ? <span className="text-[10px] font-bold text-ink-800/30">+{Object.keys(contact.attributes).length - 3}</span> : null}
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
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-ink-800/20"><User size={32} /></div>
                  <div className="text-sm font-bold text-ink-900">No contacts found</div>
                  <div className="mt-1 text-xs font-semibold text-ink-800/50">Try adjusting your search or add a new contact.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-900/5 bg-slate-50/50 px-4 py-3 md:px-6">
        <div className="text-xs font-bold uppercase tracking-widest text-ink-800/40">Page {page} of {totalPages} · {total} contacts</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={page <= 1 || loading || syncing} onClick={onPagePrev} className="h-9">Previous</Button>
          <Button type="button" variant="ghost" size="sm" disabled={page >= totalPages || loading || syncing} onClick={onPageNext} className="h-9">Next</Button>
        </div>
      </div>
    </Card>
  );
}

function getDisplayAttributes(contact: Contact, definitions: AttributeDefinition[]) {
  const values = contact.attributes || {};
  const definitionMap = new Map(definitions.map((definition) => [definition.key, definition]));
  const managed = definitions
    .filter((definition) => values[definition.key] !== undefined)
    .map((definition) => ({ key: definition.key, label: definition.label, value: values[definition.key] }));
  const legacy = Object.entries(values)
    .filter(([key]) => !definitionMap.has(key))
    .map(([key, value]) => ({ key, label: key, value }));
  return [...managed, ...legacy];
}

