import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";

export type LoginEvent = {
  id: string;
  ip?: string;
  userAgent?: string;
  location?: string;
  action?: string;
  createdAt?: string;
};

const REQUEST_LABELS: Record<string, string> = {
  name: "Name Change",
  email: "Email Change",
  phone: "Phone Change",
  password_reset: "Password Reset Link",
  "2fa_enable": "Enable 2FA",
  "2fa_disable": "Disable 2FA",
};

export function AdminProfileHeader({ onRefresh, onEdit }: { onRefresh: () => void; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black leading-none tracking-tight text-slate-900 md:text-4xl">Admin Profile</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">Profile info, security controls, and complete login history.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onRefresh}>Refresh</Button>
        <Button onClick={onEdit}>Edit Profile</Button>
      </div>
    </div>
  );
}

export function AdminProfileError({ error }: { error: string }) {
  if (!error) return null;
  return <Alert variant="danger">{error}</Alert>;
}

export function AdminProfileCard({
  profile,
  onResetPassword,
  onEnable2fa,
}: {
  profile: any;
  onResetPassword: () => void;
  onEnable2fa: () => void;
}) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm lg:col-span-1">
      <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-5">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Profile</div>
      </div>
      <div className="space-y-4 p-6">
        <Input label="Name" value={String(profile?.displayName || "")} disabled />
        <Input label="Email" value={String(profile?.email || "")} disabled />
        <Input label="Phone" value={String(profile?.phone || "")} disabled />
        <Input label="2FA" value={profile?.twoFactorEnabled ? "Enabled" : "Disabled"} disabled />
        <div className="flex flex-wrap gap-2 pt-2">
          <Button variant="outline" onClick={onResetPassword}>Reset Password</Button>
          <Button onClick={onEnable2fa} disabled={!!profile?.twoFactorEnabled}>Enable 2FA</Button>
        </div>
      </div>
    </div>
  );
}

export function SubmittedRequestsCard({
  shownRequests,
  onScroll,
  onOpenOtp,
  saving,
}: {
  shownRequests: any[];
  onScroll: (e: any) => void;
  onOpenOtp: (req: any) => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm lg:col-span-2">
      <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-5">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Submitted Requests</div>
      </div>
      <div className="max-h-[280px] overflow-auto divide-y divide-slate-100" onScroll={onScroll}>
        {shownRequests.length ? shownRequests.map((r) => (
          <div key={String(r._id)} className="px-6 py-4 text-xs">
            <div className="font-black text-slate-900">{REQUEST_LABELS[String(r?.metadata?.requestType || "")] || r?.action || "Request"}</div>
            <div className="mt-1 text-slate-600">{String(r?.metadata?.reason || "-")}</div>
            <div className="mt-1 text-slate-500">Status: {String(r?.metadata?.status || "pending")} | {r?.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "-"}</div>
            {String(r?.metadata?.status || "") === "approved_pending_otp" ? (
              <div className="mt-3">
                <Button variant="outline" onClick={() => onOpenOtp(r)} disabled={saving}>
                  Verify OTP
                </Button>
              </div>
            ) : null}
          </div>
        )) : <div className="px-6 py-8 text-sm text-slate-500">No requests yet.</div>}
      </div>
    </div>
  );
}

export function LoginHistoryCard({ shownLogins, onScroll }: { shownLogins: LoginEvent[]; onScroll: (e: any) => void }) {
  return (
    <div className="rounded-[5px] border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/30 px-6 py-5">
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">Login History (Full)</div>
      </div>
      <div className="max-h-[520px] overflow-auto divide-y divide-slate-100" onScroll={onScroll}>
        {shownLogins.length ? shownLogins.map((e) => (
          <div key={e.id} className="px-6 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="truncate text-xs font-black text-slate-900">{e.userAgent || "Unknown device"}</div>
                <div className="mt-1 text-[11px] font-semibold text-slate-500 truncate">
                  Action: {e.action || "-"} | IP: {e.ip || "-"} | Location: {e.location || "Localhost"}
                </div>
              </div>
              <div className="whitespace-nowrap text-[11px] font-black text-slate-500">
                {e.createdAt ? new Date(e.createdAt).toLocaleString("en-IN") : "-"}
              </div>
            </div>
          </div>
        )) : <div className="px-6 py-14 text-center text-sm font-bold text-slate-400">No login events yet.</div>}
      </div>
    </div>
  );
}
