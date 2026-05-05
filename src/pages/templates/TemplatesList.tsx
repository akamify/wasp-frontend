import { useEffect, useMemo, useState } from "react";
import { Plus, Eye, RefreshCw, Trash2, MessageSquare, Folder, AlertCircle, ShieldCheck, Megaphone, Package } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import { statusTone } from "./helpers";
import type { TemplateItem } from "./types";

type Props = {
  templates: TemplateItem[];
  loading: boolean;
  approvedCount: number;
  busyId: string | null;
  selectedId: string | null;
  onOpenAdd: () => void;
  onSelectTemplate: (template: TemplateItem) => void;
  onSyncStatus: (id: string) => void;
  onDelete: (template: TemplateItem) => void;
  onEdit: (template: TemplateItem) => void;
};

export function TemplatesList(props: Props) {
  const {
    templates,
    loading,
    approvedCount,
    busyId,
    selectedId,
    onOpenAdd,
    onSelectTemplate,
    onSyncStatus,
    onDelete
  } = props;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const categoryMeta = (category: string) => {
    const c = String(category || "").toLowerCase();
    if (c === "authentication") return { Icon: ShieldCheck, label: "authentication" };
    if (c === "marketing") return { Icon: Megaphone, label: "marketing" };
    return { Icon: Package, label: c || "utility" };
  };

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = templates.filter((template) => {
      const matchesSearch = !term || template.name.toLowerCase().includes(term) || template.category.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || template.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    if (sortBy === "name_asc") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc") list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === "oldest") list = [...list].reverse();
    return list;
  }, [templates, search, statusFilter, sortBy]);

  const total = filteredTemplates.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, total);
  const pagedTemplates = useMemo(
    () => filteredTemplates.slice(pageStart, pageEnd),
    [filteredTemplates, pageStart, pageEnd]
  );

  // Reset to first page when filters change.
  // (Avoids empty pages after narrowing search/status.)
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, pageSize]);

  return (
    <Card className="p-3 md:p-6 shadow-none rounded-[5px]">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-ink-900/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-brand-50 text-brand-600">
            <Folder size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-800/55">
              Template Library
            </div>
            <div className="mt-1 text-xl font-black text-ink-900 flex items-center gap-2">
              {templates.length} total
              <span className="text-ink-800/30 font-normal">|</span>
              <span className="text-brand-600 text-lg">{approvedCount} approved</span>
            </div>
          </div>
        </div>
        <Button onClick={onOpenAdd} className="!hidden items-center gap-2 rounded-[5px] shadow-none md:!inline-flex">
          <Plus size={16} /> Add
        </Button>
      </div>
      <Button onClick={onOpenAdd} className="!inline-flex items-center justify-flex-end mb-7 gap-2 rounded-[5px] shadow-none md:!hidden">
        <Plus size={16} /> Add
      </Button>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
        <Input
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by template name/type"
          className="rounded-[5px] shadow-none"
        />
        <Select
          label="Filter Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-[5px] shadow-none"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="paused">Paused</option>
          <option value="disabled">Disabled</option>
        </Select>
        <Select
          label="Sort"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="rounded-[5px] shadow-none"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </Select>
      </div>

      {/* Pagination controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-xs font-semibold text-ink-900/55">
          {total ? (
            <span>
              Showing <span className="font-black text-ink-900">{pageStart + 1}</span>-
              <span className="font-black text-ink-900">{pageEnd}</span> of{" "}
              <span className="font-black text-ink-900">{total}</span>
            </span>
          ) : (
            <span>Showing 0 results</span>
          )}
        </div>
        <div className="flex items-end gap-2">
          <Select
            label="Per page"
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value) || 10)}
            className="rounded-[5px] shadow-none"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-[5px]"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Prev
          </Button>
          <div className="px-2 pb-2 text-xs font-bold text-ink-900/60">
            {safePage}/{totalPages}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-[5px]"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="grid gap-3 md:hidden">
        {loading ? (
          <div className="rounded-[5px] border border-ink-900/10 bg-white px-4 py-10">
            <Spinner label="Loading templates..." />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="rounded-[5px] border border-ink-900/10 bg-white px-4 py-8 text-center text-sm text-ink-800/70">
            No matching templates found.
          </div>
        ) : (
          pagedTemplates.map((template) => (
            <div
              key={template._id}
              className={`rounded-[5px] border p-3 ${selectedId === template._id ? "border-brand-400 bg-brand-50/30" : "border-ink-900/10 bg-white"}`}
            >
              <button
                type="button"
                className="mb-2 flex w-full items-center gap-2 text-left font-bold text-ink-900"
                onClick={() => onSelectTemplate(template)}
              >
                <MessageSquare size={15} className="text-ink-800/50" />
                <span className="truncate">{template.name}</span>
              </button>
              <div className="mb-3 flex flex-wrap gap-2">
                {(() => {
                  const { Icon, label } = categoryMeta(template.category);
                  return (
                    <Badge tone="neutral" className="rounded-[5px] inline-flex items-center gap-1.5">
                      <Icon size={14} className="text-ink-900/45" />
                      {label}
                    </Badge>
                  );
                })()}
                <Badge tone={statusTone(template.status)} className="rounded-[5px]">{template.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="ghost" onClick={() => onSelectTemplate(template)} className="rounded-[5px]">View</Button>
                <Button size="sm" variant="ghost" onClick={() => onSyncStatus(template._id)} disabled={busyId === template._id} className="rounded-[5px]">
                  <RefreshCw size={13} className={busyId === template._id ? "animate-spin" : ""} />
                  Sync
                </Button>
                <Button size="sm" variant="danger" onClick={() => onDelete(template)} disabled={busyId === template._id} className="rounded-[5px] bg-red-500 text-red-700 hover:bg-red-400 border-none">
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden max-w-full overflow-x-auto rounded-[5px] border border-ink-900/10 md:block">
        <table className="w-full min-w-[860px] text-left text-sm text-ink-900">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-ink-800/60 border-b border-ink-900/10">
            <tr>
              <th className="px-5 py-4 font-semibold">Template Name</th>
              <th className="px-5 py-4 font-semibold">Category</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/10 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center align-middle">
                  <Spinner label="Loading templates..." />
                </td>
              </tr>
            ) : filteredTemplates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center align-middle">
                  <div className="flex flex-col items-center justify-center gap-2 text-ink-800/70">
                    <AlertCircle size={24} className="text-ink-800/40" />
                    <p>No matching templates found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pagedTemplates.map((template) => (
                <tr
                  key={template._id}
                  className={`transition-colors hover:bg-slate-50/50 ${selectedId === template._id ? "bg-brand-50/40" : ""
                    }`}
                >
                  <td className="px-5 py-4 align-middle">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left font-bold text-ink-900 hover:text-brand-700"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <MessageSquare size={16} className="text-ink-800/50" />
                      {template.name}
                    </button>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    {(() => {
                      const { Icon, label } = categoryMeta(template.category);
                      return (
                        <Badge tone="neutral" className="rounded-[5px] inline-flex items-center gap-1.5">
                          <Icon size={14} className="text-ink-900/45" />
                          {label}
                        </Badge>
                      );
                    })()}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <Badge tone={statusTone(template.status)} className="rounded-[5px]">
                      {template.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectTemplate(template)}
                        className="flex items-center gap-1.5 rounded-[5px] shadow-none"
                      >
                        <Eye size={14} /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSyncStatus(template._id)}
                        disabled={busyId === template._id}
                        className="flex items-center gap-1.5 rounded-[5px] shadow-none"
                      >
                        <RefreshCw size={14} className={busyId === template._id ? "animate-spin" : ""} /> Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(template)}
                        disabled={busyId === template._id}
                        className="flex items-center gap-1.5 rounded-[5px] shadow-none bg-red-500 text-red-700 hover:bg-red-400 border-none"
                      >
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
