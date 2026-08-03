import type { ReactNode } from "react";
import { BadgeCheck, Globe, Phone, Plus, Sparkles, Wallet } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { formatCurrencySafe } from "@shared/config/currency";
import { whatsappProfilePictureUrl } from "@shared/utils/whatsappProfile";
import { cn } from "@shared/utils/cn";

export function DashboardSidebar({ snapshot, onView, onEdit, onRecharge }: any) {
  const profilePictureUrl = whatsappProfilePictureUrl(snapshot?.meta?.businessProfile);
  const businessName = snapshot?.meta?.phone?.verified_name || snapshot?.meta?.verifiedName || "WhatsApp Business";
  const phoneNumber = snapshot?.meta?.phone?.display_phone_number || snapshot?.meta?.displayPhoneNumber || "Not linked";
  const category = snapshot?.meta?.businessProfile?.vertical || "Other";
  const isLive = snapshot?.metaStatus === "active";

  return (
    <div className="space-y-5 lg:sticky lg:top-6 self-start">
      <Card className="overflow-hidden rounded-[22px] border border-white/80 bg-white/95 p-5 shadow-[0_22px_56px_-40px_rgba(15,23,42,0.42)]">
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Business profile</div>
          <div className={cn("rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]", isLive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
            {isLive ? "Live" : "Offline"}
          </div>
        </div>

        <div className="mt-4 rounded-[22px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(255,255,255,1))] p-4">
          <div className="flex items-center gap-4">
            {profilePictureUrl ? (
              <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-md shadow-slate-200">
                <img src={profilePictureUrl} alt="profile" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-black text-emerald-700 shadow-md shadow-emerald-100">
                {String(businessName || "W").trim().charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-2xl font-black tracking-tight text-slate-900">{businessName}</div>
              <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500">
                <BadgeCheck size={14} className={cn(isLive ? "text-emerald-600" : "text-amber-600")} />
                {isLive ? "Verified and connected" : "Needs attention"}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <SidebarInfoRow icon={<Phone size={16} />} label="Phone Number" value={phoneNumber} />
            <SidebarInfoRow icon={<Globe size={16} />} label="Category" value={category} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" onClick={onView} className="h-10 rounded-[14px] border-slate-200 bg-white font-bold hover:border-emerald-200 hover:bg-emerald-50/50">
              Profile
            </Button>
            <Button size="sm" onClick={onEdit} className="h-10 rounded-[14px] border-0 bg-[linear-gradient(135deg,_#dff7ef,_#eefcf6)] font-black text-emerald-800 shadow-none hover:brightness-95">
              Edit
            </Button>
          </div>
        </div>
      </Card>

      <Card className="relative overflow-hidden rounded-[22px] border border-emerald-100/70 bg-[linear-gradient(135deg,_#052e2b_0%,_#0f766e_52%,_#10b981_100%)] p-5 text-white shadow-[0_24px_64px_-36px_rgba(6,78,59,0.52)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_28%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-50/65">Total balance</div>
              <div className="mt-3 text-4xl font-black tracking-tight text-white">
                {formatCurrencySafe(Number(snapshot?.wallet?.balance ?? 0), String(snapshot?.wallet?.currency || "INR"))}
              </div>
              <div className="mt-2 text-sm font-medium leading-6 text-emerald-50/82">
                Use wallet balance for recharges, add-ons, and plan-linked purchases across the workspace.
              </div>
            </div>
            <div className="flex size-12 items-center justify-center rounded-[16px] bg-white/12 text-white backdrop-blur">
              <Wallet size={18} />
            </div>
          </div>

          <div className="mt-5 rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-emerald-50/88">
            Keep balance healthy to avoid campaign delays and add-on purchase friction.
          </div>

          <Button
            variant="outline"
            className="mt-5 h-11 w-full rounded-[14px] border-white/70 bg-white font-black text-emerald-900 shadow-lg shadow-emerald-950/10 hover:bg-emerald-50"
            onClick={onRecharge}
          >
            <Plus size={18} />
            Add Wallet Balance
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-[22px] border border-white/80 bg-white/95 p-5 shadow-[0_20px_52px_-40px_rgba(15,23,42,0.42)]">
        <div className="flex items-start gap-3">
          <div className="flex size-11 items-center justify-center rounded-[16px] bg-slate-100 text-slate-700">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-slate-900">Workspace Tip</div>
            <div className="mt-1 text-sm font-medium leading-6 text-slate-500">
              Keep your WhatsApp business profile updated with logo, about, and category so dashboards, previews, and customer trust surfaces stay consistent.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SidebarInfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-slate-200 bg-white px-3 py-3 shadow-sm">
      <div className="flex size-10 items-center justify-center rounded-[12px] bg-slate-50 text-slate-500">{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
        <div className="mt-1 truncate text-sm font-bold text-slate-900">{value}</div>
      </div>
    </div>
  );
}
