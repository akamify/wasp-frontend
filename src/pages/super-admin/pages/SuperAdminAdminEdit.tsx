import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { useToast } from "@shared/providers/ToastContext";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";

const PAGE_COMPONENTS: Record<string, string[]> = {
  "/admin/dashboard": ["dashboard.view", "charts.view", "filters.view"],
  "/admin/users": ["users.view", "users.create", "users.edit", "users.delete", "bulk.actions", "search.panel"],
  "/admin/reports": ["reports.view", "export.button", "filters.view"],
  "/admin/analytics": ["analytics.view", "charts.view", "filters.view"],
  "/admin/billing": ["billing.view", "billing.edit", "export.button"],
  "/admin/notifications": ["notifications.view", "notifications.manage"],
  "/admin/logs": ["logs.view", "search.panel", "filters.view"],
  "/admin/audit-trail": ["audit.view", "export.button", "filters.view"],
  "/admin/profile": ["profile.view", "profile.edit", "profile.change_password", "profile.upload_avatar", "profile.manage_2fa", "profile.sessions"],
  "/admin/settings": ["settings.view", "settings.manage"],
  "/admin/docs": ["docs.view", "docs.create", "docs.edit", "docs.delete", "docs.preview", "status.controls"],
  "/admin/workspaces": ["workspaces.view", "workspaces.edit"],
  "/admin/master-campaigns": ["campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.delete"],
  "/admin/master-templates": ["templates.view", "templates.create", "templates.edit", "templates.delete"],
  "/admin/master-contacts": ["contacts.view", "contacts.create", "contacts.edit", "contacts.delete"],
  "/admin/subscriptions-data": ["subscriptions.view", "subscriptions.edit"],
  "/admin/transactions-logs": ["transactions.view", "export.button"],
  "/admin/message-logs": ["messages.view", "export.button"],
  "/admin/pages": ["pages.view", "pages.edit"],
  "/admin/support-tickets": ["tickets.view", "tickets.edit", "approval.panel"],
  "/admin/career-applications": ["careers.view", "careers.edit", "approval.panel"],
};

const PAGE_ACTIONS: Record<string, string[]> = {
  "/admin/dashboard": ["dashboard.manage"],
  "/admin/users": ["users.export", "users.approve", "users.manage"],
  "/admin/reports": ["reports.export", "reports.approve", "reports.manage"],
  "/admin/analytics": ["analytics.export", "analytics.manage"],
  "/admin/billing": ["billing.export", "billing.approve", "billing.manage"],
  "/admin/notifications": ["notifications.create", "notifications.edit", "notifications.delete", "notifications.manage"],
  "/admin/logs": ["logs.export", "logs.manage"],
  "/admin/audit-trail": ["audit.export", "audit.manage"],
  "/admin/profile": ["profile.manage"],
  "/admin/settings": ["settings.manage"],
  "/admin/docs": ["docs.publish", "docs.unpublish", "docs.export", "docs.approve", "docs.manage"],
  "/admin/workspaces": ["workspaces.manage"],
  "/admin/master-campaigns": ["campaigns.export", "campaigns.approve", "campaigns.manage"],
  "/admin/master-templates": ["templates.export", "templates.approve", "templates.manage"],
  "/admin/master-contacts": ["contacts.export", "contacts.approve", "contacts.manage"],
  "/admin/subscriptions-data": ["subscriptions.export", "subscriptions.manage"],
  "/admin/transactions-logs": ["transactions.export", "transactions.manage"],
  "/admin/message-logs": ["messages.export", "messages.manage"],
  "/admin/pages": ["pages.manage"],
  "/admin/support-tickets": ["tickets.approve", "tickets.manage"],
  "/admin/career-applications": ["careers.approve", "careers.manage"],
};

export default function SuperAdminAdminEditPage() {
  const { id = "" } = useParams();
  const isCreateMode = id === "create";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [pages, setPages] = useState<string[]>([]);
  const [components, setComponents] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    if (isCreateMode) {
      setLoading(false);
      setName("");
      setEmail("");
      setPhone("");
      setStatus("active");
      setTwoFactorEnabled(false);
      setPages([]);
      setComponents([]);
      setActions([]);
      return;
    }
    let active = true;
    setLoading(true);
    API.superAdmin.adminDetail(id)
      .then((r: any) => {
        if (!active) return;
        const a = r?.admin || {};
        setName(String(a.name || ""));
        setEmail(String(a.email || ""));
        setPhone(String(a.phone || ""));
        setStatus(String(a.status || "active"));
        setTwoFactorEnabled(!!a.twoFactorEnabled);
        setPages(Array.isArray(a.permissions?.pages) ? a.permissions.pages : []);
        setComponents(Array.isArray(a.permissions?.components) ? a.permissions.components : []);
        setActions(Array.isArray(a.permissions?.actions) ? a.permissions.actions : []);
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.response?.data?.message || "Failed to load admin");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, isCreateMode]);

  const availableComponents = useMemo(() => pages.flatMap((p) => PAGE_COMPONENTS[p] || []), [pages]);
  const availableActions = useMemo(() => pages.flatMap((p) => PAGE_ACTIONS[p] || []), [pages]);

  async function onSave() {
    setSaving(true);
    setError("");
    try {
      const permissions = {
        pages,
        components: components.filter((x) => availableComponents.includes(x)),
        actions: actions.filter((x) => availableActions.includes(x)),
      };
      const cleanEmail = String(email || "").trim().toLowerCase();

      if (isCreateMode) {
        if (!cleanEmail) throw new Error("Email is required");
        const created: any = await API.superAdmin.assignAdmin({ email: cleanEmail, name: String(name || "").trim() });
        const newAdminId = String(created?.user?.id || "");
        if (!newAdminId) throw new Error("Admin created but id was not returned");
        await API.superAdmin.updateAdmin(newAdminId, { name, phone, permissions });
        toast(created?.message || "Admin created. Password setup link sent.", "success");
        navigate(`/super-admin/admins/${newAdminId}/profile`);
      } else {
        await API.superAdmin.updateAdmin(id, {
          name,
          phone,
          status,
          twoFactorEnabled,
          permissions,
        });
        toast("Admin profile updated", "success");
        navigate(`/super-admin/admins/${id}/profile`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to save";
      setError(msg);
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <TableSkeleton cols={4} rows={8} />;

  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-slate-200 bg-white p-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-black text-slate-900">{isCreateMode ? "Create Admin" : "Edit Admin Profile"}</div>
          <div className="text-xs text-slate-500 mt-1">{isCreateMode ? "New admin login credentials will be sent via email with password setup link." : email}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? (isCreateMode ? "Creating..." : "Saving...") : (isCreateMode ? "Create Admin" : "Save")}</Button>
        </div>
      </div>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="rounded-[5px] border border-slate-200 bg-white p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isCreateMode} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {!isCreateMode ? (
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">active</option>
              <option value="banned">banned</option>
              <option value="fired">fired</option>
              <option value="retired">retired</option>
            </Select>
          ) : null}
        </div>

        {!isCreateMode ? (
          <div className="rounded border border-slate-200 p-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={twoFactorEnabled} onChange={(e) => setTwoFactorEnabled(e.target.checked)} />
              2FA Enabled
            </label>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <PermissionPicker title="Pages" items={Object.keys(PAGE_COMPONENTS)} selected={pages} setSelected={setPages} />
          <PermissionPicker title="Components" items={availableComponents} selected={components} setSelected={setComponents} />
          <PermissionPicker title="Actions" items={availableActions} selected={actions} setSelected={setActions} />
        </div>
      </div>
    </div>
  );
}

function PermissionPicker({
  title,
  items,
  selected,
  setSelected,
}: {
  title: string;
  items: string[];
  selected: string[];
  setSelected: (v: string[]) => void;
}) {
  const uniq = Array.from(new Set(items));
  const selectedSet = new Set(selected);

  function selectAll() {
    setSelected(uniq.slice());
  }

  function clearAll() {
    setSelected([]);
  }

  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={!uniq.length}
            className="h-7 rounded-[5px] border border-slate-200 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={!selected.length}
            className="h-7 rounded-[5px] border border-slate-200 bg-white px-2 text-[10px] font-black uppercase tracking-widest text-slate-700 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="space-y-1 max-h-72 overflow-auto">
        {uniq.map((item) => (
          <label key={item} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={selectedSet.has(item)}
              onChange={(e) => setSelected(e.target.checked ? [...selected, item] : selected.filter((x) => x !== item))}
            />
            <span>{item}</span>
          </label>
        ))}
        {!uniq.length ? <div className="text-xs text-slate-400">No items</div> : null}
      </div>
    </div>
  );
}
