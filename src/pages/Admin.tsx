import { useEffect, useMemo, useState } from "react";
import { API } from "../api/api";
import { Alert } from "../components/ui/Alert";
import { Card } from "../components/ui/Card";
import { BRAND_NAME } from "../config/brand";
import { formatCurrencySafe } from "../config/currency";

type AdminSnapshot = {
  overview?: any;
  dailyMessages?: Array<{ date: string; count: number }>;
  users?: any[];
  templates?: any[];
  credentials?: any[];
  wallets?: any[];
};

export default function AdminPage() {
  const [snapshot, setSnapshot] = useState<AdminSnapshot>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [usersPageSize, setUsersPageSize] = useState(25);
  const [usersPage, setUsersPage] = useState(1);
  const [walletsPageSize, setWalletsPageSize] = useState(25);
  const [walletsPage, setWalletsPage] = useState(1);
  const [credsPageSize, setCredsPageSize] = useState(25);
  const [credsPage, setCredsPage] = useState(1);
  const [templatesPageSize, setTemplatesPageSize] = useState(12);
  const [templatesPage, setTemplatesPage] = useState(1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      API.admin.overview(),
      API.admin.users(),
      API.admin.templates(),
      API.admin.credentials(),
      API.admin.wallets(),
    ])
      .then(([overview, users, templates, credentials, wallets]) => {
        if (!active) return;
        setSnapshot({
          overview: overview.overview,
          dailyMessages: overview.dailyMessages || [],
          users: users.users || [],
          templates: templates.templates || [],
          credentials: credentials.credentials || [],
          wallets: wallets.wallets || [],
        });
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.response?.data?.message || e?.message || "Failed to load admin dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const statCards = useMemo(
    () => [
      { label: "Users", value: snapshot.overview?.users ?? 0 },
      { label: "Workspaces", value: snapshot.overview?.workspaces ?? 0 },
      { label: "Templates", value: snapshot.overview?.templates ?? 0 },
      { label: "Valid WABA creds", value: snapshot.overview?.validCredentials ?? 0 },
      { label: "Wallet balance", value: formatCurrencySafe(Number(snapshot.overview?.walletBalance ?? 0)) },
      { label: "Outbound msgs", value: snapshot.overview?.outboundMessages ?? 0 },
    ],
    [snapshot.overview]
  );

  const usersPaged = useMemo(() => {
    const all = snapshot.users || [];
    const totalPages = Math.max(Math.ceil(all.length / usersPageSize), 1);
    const safePage = Math.min(Math.max(usersPage, 1), totalPages);
    const start = (safePage - 1) * usersPageSize;
    return {
      items: all.slice(start, start + usersPageSize),
      total: all.length,
      page: safePage,
      totalPages,
      start,
      end: Math.min(start + usersPageSize, all.length),
    };
  }, [snapshot.users, usersPage, usersPageSize]);

  const walletsPaged = useMemo(() => {
    const all = snapshot.wallets || [];
    const totalPages = Math.max(Math.ceil(all.length / walletsPageSize), 1);
    const safePage = Math.min(Math.max(walletsPage, 1), totalPages);
    const start = (safePage - 1) * walletsPageSize;
    return {
      items: all.slice(start, start + walletsPageSize),
      total: all.length,
      page: safePage,
      totalPages,
      start,
      end: Math.min(start + walletsPageSize, all.length),
    };
  }, [snapshot.wallets, walletsPage, walletsPageSize]);

  const credsPaged = useMemo(() => {
    const all = snapshot.credentials || [];
    const totalPages = Math.max(Math.ceil(all.length / credsPageSize), 1);
    const safePage = Math.min(Math.max(credsPage, 1), totalPages);
    const start = (safePage - 1) * credsPageSize;
    return {
      items: all.slice(start, start + credsPageSize),
      total: all.length,
      page: safePage,
      totalPages,
      start,
      end: Math.min(start + credsPageSize, all.length),
    };
  }, [snapshot.credentials, credsPage, credsPageSize]);

  const templatesPaged = useMemo(() => {
    const all = snapshot.templates || [];
    const totalPages = Math.max(Math.ceil(all.length / templatesPageSize), 1);
    const safePage = Math.min(Math.max(templatesPage, 1), totalPages);
    const start = (safePage - 1) * templatesPageSize;
    return {
      items: all.slice(start, start + templatesPageSize),
      total: all.length,
      page: safePage,
      totalPages,
      start,
      end: Math.min(start + templatesPageSize, all.length),
    };
  }, [snapshot.templates, templatesPage, templatesPageSize]);

  return (
    <div className="grid gap-6 p-4 md:p-8">
      <section id="overview" className="rounded-[5px] border border-ink-900/10 bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.08)] sm:p-7">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-800/60">Admin Panel</div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">{BRAND_NAME} Control Center</h1>
        <p className="mt-2 text-sm text-ink-800/70">Manage users, template activity, WhatsApp credentials, analytics, and wallet health from one dashboard.</p>
      </section>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {loading ? <Alert>Loading admin dashboard...</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="rounded-[5px] border border-ink-900/10 bg-white p-5 shadow-none">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-800/50">{card.label}</div>
            <div className="mt-3 text-3xl font-black text-ink-900">{card.value}</div>
          </Card>
        ))}
      </section>

      <section id="analytics" className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-[5px] border border-ink-900/10 bg-white p-5 shadow-none">
          <div className="text-sm font-bold text-ink-900">Last 7 Days Outbound Activity</div>
          <div className="mt-4 grid gap-3">
            {(snapshot.dailyMessages || []).length ? (
              snapshot.dailyMessages?.map((point) => (
                <div key={point.date} className="grid grid-cols-[110px_1fr_56px] items-center gap-3">
                  <div className="text-xs font-semibold text-ink-800/60">{point.date}</div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" style={{ width: `${Math.min(100, Math.max(8, point.count))}%` }} />
                  </div>
                  <div className="text-right text-sm font-bold text-ink-900">{point.count}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-ink-800/60">No outbound activity yet.</div>
            )}
          </div>
        </Card>
        <Card className="rounded-[5px] border border-ink-900/10 bg-white p-5 shadow-none">
          <div className="text-sm font-bold text-ink-900">Delivery Snapshot</div>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-ink-800/60">Delivered</span><span className="font-bold text-ink-900">{snapshot.overview?.deliveredMessages ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-800/60">Read</span><span className="font-bold text-ink-900">{snapshot.overview?.readMessages ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-800/60">Failed</span><span className="font-bold text-red-600">{snapshot.overview?.failedMessages ?? 0}</span></div>
            <div className="flex items-center justify-between"><span className="text-ink-800/60">Clicks</span><span className="font-bold text-ink-900">{snapshot.overview?.clicks ?? 0}</span></div>
          </div>
        </Card>
      </section>

      <section id="users" className="rounded-[5px] border border-ink-900/10 bg-white p-5 shadow-none">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-bold text-ink-900">Users</div>
          <div className="text-xs text-ink-800/55">{snapshot.users?.length || 0} recent accounts</div>
        </div>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-xs font-semibold text-ink-900/55">
            {usersPaged.total ? (
              <span>
                Showing <span className="font-black text-ink-900">{usersPaged.start + 1}</span>-
                <span className="font-black text-ink-900">{usersPaged.end}</span> of{" "}
                <span className="font-black text-ink-900">{usersPaged.total}</span>
              </span>
            ) : (
              <span>Showing 0 results</span>
            )}
          </div>
          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-ink-900/60">
              Per page
              <select
                className="ml-2 rounded-[5px] border border-ink-900/10 bg-white px-2 py-1 text-xs font-semibold"
                value={String(usersPageSize)}
                onChange={(e) => { setUsersPageSize(Number(e.target.value) || 25); setUsersPage(1); }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={usersPaged.page <= 1}
              onClick={() => setUsersPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </button>
            <div className="px-2 pb-1 text-xs font-bold text-ink-900/60">{usersPaged.page}/{usersPaged.totalPages}</div>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={usersPaged.page >= usersPaged.totalPages}
              onClick={() => setUsersPage((p) => Math.min(p + 1, usersPaged.totalPages))}
            >
              Next
            </button>
          </div>
        </div>
        <div className="overflow-x-auto rounded-[5px] ring-1 ring-ink-900/10">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/10 text-ink-800/55">
                <th className="px-3 py-2 font-semibold">User</th>
                <th className="px-3 py-2 font-semibold">Workspace</th>
                <th className="px-3 py-2 font-semibold">Templates</th>
                <th className="px-3 py-2 font-semibold">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {usersPaged.items.map((user) => (
                <tr key={user.id} className="border-b border-ink-900/5">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-ink-900">{user.name || user.email}</div>
                    <div className="text-xs text-ink-800/55">{user.email}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium text-ink-900">{user.workspace?.name || "No workspace"}</div>
                    <div className="text-xs text-ink-800/55">{user.workspace?.plan || "-"}</div>
                  </td>
                  <td className="px-3 py-3 font-semibold text-ink-900">{user.templateCount}</td>
                  <td className="px-3 py-3 font-semibold text-ink-900">{formatCurrencySafe(Number(user.wallet?.balance ?? 0), user.wallet?.currency || undefined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="templates" className="rounded-[5px] border border-ink-900/10 bg-white p-5 shadow-none">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm font-bold text-ink-900">Templates</div>
          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-ink-900/60">
              Per page
              <select
                className="ml-2 rounded-[5px] border border-ink-900/10 bg-white px-2 py-1 text-xs font-semibold"
                value={String(templatesPageSize)}
                onChange={(e) => { setTemplatesPageSize(Number(e.target.value) || 12); setTemplatesPage(1); }}
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </label>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={templatesPaged.page <= 1}
              onClick={() => setTemplatesPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </button>
            <div className="px-2 pb-1 text-xs font-bold text-ink-900/60">{templatesPaged.page}/{templatesPaged.totalPages}</div>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={templatesPaged.page >= templatesPaged.totalPages}
              onClick={() => setTemplatesPage((p) => Math.min(p + 1, templatesPaged.totalPages))}
            >
              Next
            </button>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templatesPaged.items.map((template) => (
            <div key={template.id} className="rounded-[5px] border border-ink-900/10 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-ink-900">{template.name}</div>
                  <div className="mt-1 text-xs text-ink-800/55">{template.workspace?.name || "Unknown workspace"}</div>
                </div>
                <div className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-800/60">
                  {template.status}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-800/60">{template.category} | {template.language} | {template.source}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="credentials" className="rounded-[5px] border border-ink-900/10 bg-white p-5 shadow-none">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm font-bold text-ink-900">WhatsApp Credentials</div>
          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-ink-900/60">
              Per page
              <select
                className="ml-2 rounded-[5px] border border-ink-900/10 bg-white px-2 py-1 text-xs font-semibold"
                value={String(credsPageSize)}
                onChange={(e) => { setCredsPageSize(Number(e.target.value) || 25); setCredsPage(1); }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={credsPaged.page <= 1}
              onClick={() => setCredsPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </button>
            <div className="px-2 pb-1 text-xs font-bold text-ink-900/60">{credsPaged.page}/{credsPaged.totalPages}</div>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={credsPaged.page >= credsPaged.totalPages}
              onClick={() => setCredsPage((p) => Math.min(p + 1, credsPaged.totalPages))}
            >
              Next
            </button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {credsPaged.items.map((cred) => (
            <div key={cred.id} className="rounded-[5px] border border-ink-900/10 bg-slate-50/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-ink-900">{cred.workspace?.name || "Unknown workspace"}</div>
                  <div className="mt-1 text-xs text-ink-800/55">{cred.workspace?.ownerEmail || ""}</div>
                </div>
                <div className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${cred.isValid ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"}`}>
                  {cred.isValid ? "valid" : "invalid"}
                </div>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-ink-800/60">
                <div>Phone: {cred.phoneNumberId}</div>
                <div>Business: {cred.businessAccountId}</div>
                <div>Graph API: {cred.graphApiVersion}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="wallets" className="rounded-[5px] border border-ink-900/10 bg-white p-5 shadow-none">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm font-bold text-ink-900">Wallets</div>
          <div className="flex items-end gap-2">
            <label className="text-xs font-semibold text-ink-900/60">
              Per page
              <select
                className="ml-2 rounded-[5px] border border-ink-900/10 bg-white px-2 py-1 text-xs font-semibold"
                value={String(walletsPageSize)}
                onChange={(e) => { setWalletsPageSize(Number(e.target.value) || 25); setWalletsPage(1); }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </label>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={walletsPaged.page <= 1}
              onClick={() => setWalletsPage((p) => Math.max(p - 1, 1))}
            >
              Prev
            </button>
            <div className="px-2 pb-1 text-xs font-bold text-ink-900/60">{walletsPaged.page}/{walletsPaged.totalPages}</div>
            <button
              className="rounded-[5px] border border-ink-900/10 bg-white px-3 py-1 text-xs font-bold disabled:opacity-40"
              disabled={walletsPaged.page >= walletsPaged.totalPages}
              onClick={() => setWalletsPage((p) => Math.min(p + 1, walletsPaged.totalPages))}
            >
              Next
            </button>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {walletsPaged.items.map((wallet) => (
            <div key={wallet.id} className="rounded-[5px] border border-ink-900/10 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-ink-900">{wallet.workspace?.name || "Unknown workspace"}</div>
                  <div className="mt-1 text-xs text-ink-800/55">{wallet.workspace?.ownerEmail || ""}</div>
                </div>
                <div className="text-lg font-black text-ink-900">{wallet.currency} {wallet.balance}</div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-ink-800/60">
                {(wallet.recentTransactions || []).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-[5px] bg-white px-3 py-2">
                    <span>{tx.reason}</span>
                    <span className="font-semibold text-ink-900">{tx.type} {tx.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
