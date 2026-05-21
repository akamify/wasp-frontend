import { useCallback, useMemo, useState } from "react";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { useAdminList } from "@pages/admin/hooks/useAdminList";
import { User, Phone, Mail, Building2, Globe, Briefcase, MessageSquare } from "lucide-react";
import { cn } from "@shared/utils/cn";

type Item = any;

export default function AdminMasterContactsPage() {
  const [showTestData, setShowTestData] = useState(false);
  const fetcher = useCallback(
    (params: { page: number; limit: number; q: string }) =>
      API.admin.masterContacts(params).then((r: any) => ({
        items: r.items || [],
        total: Number(r.total || 0),
        page: Number(r.page || params.page),
        limit: Number(r.limit || params.limit),
        totalPages: Number(r.totalPages || 1),
      })),
    []
  );

  const list = useAdminList<Item>({ 
    fetcher, 
    initialLimit: 25,
    initialFilter: "all",
    initialSort: "recent"
  });

  const filteredItems = useMemo(() => {
    if (showTestData) return list.items;
    return (list.items || []).filter((c: any) => {
      const email = String(c?.email || "").toLowerCase();
      const name = String(c?.name || "").toLowerCase();
      const phone = String(c?.phone || "");
      const company = String(c?.company || "").toLowerCase();
      const workspaceName = String(c?.workspace?.name || "").toLowerCase();
      if (email.endsWith("@example.com")) return false;
      if (email.includes("smoke+") || email.includes("legacy+") || email.includes("e2e+")) return false;
      if (company.includes("demo co") || name.includes("demo customer")) return false;
      if (workspaceName.includes("smoke test") || workspaceName.includes("e2e") || workspaceName.includes("legacy")) return false;
      if (phone === "919999999999" || phone === "919876543210") return false;
      return true;
    });
  }, [list.items, showTestData]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 pb-20">
      <AdminToolbar
        title="Master Contacts"
        subtitle="Global directory of all synced contacts across all platform workspaces."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        filterOptions={[
          { label: "All Contacts", value: "all" },
          { label: "Synced", value: "synced" },
          { label: "Imported", value: "imported" },
        ]}
        currentFilter={list.filter}
        onFilterChange={list.setFilter}
        sortOptions={[
          { label: "Recent", value: "recent" },
          { label: "A-Z", value: "az" },
          { label: "Workspace", value: "workspace" },
        ]}
        currentSort={list.sort}
        onSortChange={list.setSort}
        right={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setShowTestData((v) => !v)}>
              {showTestData ? "Hide Test Data" : "Show Test Data"}
            </Button>
            <AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />
          </div>
        }
      />

      {list.error ? <Alert variant="danger">{list.error}</Alert> : null}

      {list.loading && !filteredItems.length ? (
        <TableSkeleton cols={7} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "phone", label: "Identity" },
              { key: "email", label: "Contact Info" },
              { key: "company", label: "Organization" },
              { key: "source", label: "Source" },
              { key: "workspace", label: "Workspace" },
              { key: "preview", label: "Last Interaction" },
            ]}
          >
            {filteredItems.length ? (
              filteredItems.map((c: any) => (
                <tr key={c.id} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="size-10 rounded-[5px] bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                          <User size={18} />
                       </div>
                       <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                             <AdminTruncate text={c.name || "Unnamed Contact"} max={30} />
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <Phone size={10} />
                             {c.phone || "No Phone"}
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 min-w-[120px]">
                       <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          <AdminTruncate text={c.email || "No Email"} max={30} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                       <Building2 size={14} className="text-slate-400" />
                       <AdminTruncate text={c.company || "N/A"} max={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-[4px] text-[10px] font-black uppercase tracking-widest">
                       <Globe size={10} />
                       {c.source || "IMPORT"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                       <Briefcase size={14} className="text-slate-400" />
                       <AdminTruncate text={c.workspace?.name || "N/A"} max={20} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                       <MessageSquare size={14} className="text-slate-300" />
                       <AdminTruncate text={c.lastMessagePreview || "No previous interaction"} max={40} />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-6 py-20 text-center text-sm font-bold text-slate-400" colSpan={6}>
                  No contacts found in global directory.
                </td>
              </tr>
            )}
          </AdminTable>

          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}
    </div>
  );
}
