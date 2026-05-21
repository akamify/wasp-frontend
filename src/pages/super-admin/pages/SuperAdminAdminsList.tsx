import { useNavigate } from "react-router-dom";
import { AdminTable } from "@pages/admin/components/AdminTable";
import { AdminToolbar } from "@pages/admin/components/AdminToolbar";
import { AdminPagination } from "@pages/admin/components/AdminPagination";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";
import { AdminLimitSelect } from "@pages/admin/components/AdminLimitSelect";
import { useSuperAdminAdminsList } from "@pages/super-admin/hooks/useSuperAdminAdminsList";

export default function SuperAdminAdminsListPage() {
  const navigate = useNavigate();
  const list = useSuperAdminAdminsList();

  return (
    <div className="space-y-4 py-4 pr-6">
      <AdminToolbar
        title="Admins"
        subtitle="Only super admin can control admin accounts."
        query={list.query}
        setQuery={list.setQuery}
        onRefresh={list.refresh}
        isSyncing={list.loading}
        right={<AdminLimitSelect limit={list.limit} setLimit={list.setLimit} />}
      />

      {list.loading && !list.items.length ? (
        <TableSkeleton cols={5} rows={10} />
      ) : (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "status", label: "Status" },
              { key: "twoFactor", label: "2FA" },
              { key: "lastLogin", label: "Last Login" },
            ]}
          >
            {list.items.map((item) => (
              <tr key={item.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/super-admin/admins/${item.id}`)}>
                <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.name || "-"}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{item.email || "-"}</td>
                <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{item.status || "active"}</td>
                <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">{item.twoFactorEnabled ? "Enabled" : "Disabled"}</td>
                <td className="px-6 py-4 text-xs text-slate-600">{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString("en-IN") : "-"}</td>
              </tr>
            ))}
          </AdminTable>

          <AdminPagination page={list.page} totalPages={list.totalPages} total={list.total} onPageChange={list.setPage} />
        </>
      )}
    </div>
  );
}
