import { Globe, Phone, Plus, Wallet } from "lucide-react";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { formatCurrencySafe } from "@shared/config/currency";
import { whatsappProfilePictureUrl } from "@shared/utils/whatsappProfile";

export function DashboardSidebar({ snapshot, onView, onEdit, onRecharge }: any) {
  const profilePictureUrl = whatsappProfilePictureUrl(snapshot?.meta?.businessProfile);
  return (
    <div className="space-y-8 lg:sticky lg:top-6 self-start">
      <Card className="relative overflow-hidden group rounded-[5px]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            {profilePictureUrl ? (
              <div className="h-16 w-16 overflow-hidden rounded-[5px] ring-4 ring-slate-50 group-hover:scale-105 transition-transform"><img src={profilePictureUrl} alt="profile" className="h-full w-full object-cover" /></div>
            ) : (
              <div className="h-16 w-16 rounded-[5px] bg-brand-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-500/20">{snapshot?.meta?.phone?.verified_name?.[0] || "W"}</div>
            )}
            <div className="min-w-0"><h2 className="text-lg font-black text-slate-900 truncate">{snapshot?.meta?.phone?.verified_name || "WhatsApp Business"}</h2><div className="flex items-center gap-1.5"><span className="text-xs font-bold text-slate-500">{snapshot?.metaStatus === "active" ? "Verified" : "Offline"}</span></div></div>
          </div>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-[5px] border border-slate-100"><Phone size={16} className="text-slate-400" /><div className="min-w-0"><p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p><p className="text-xs font-bold text-slate-900 truncate">{snapshot?.meta?.phone?.display_phone_number || "Not Linked"}</p></div></div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-[5px] border border-slate-100"><Globe size={16} className="text-slate-400" /><div className="min-w-0"><p className="text-[10px] font-bold text-slate-400 uppercase">Category</p><p className="text-xs font-bold text-slate-900 truncate">{snapshot?.meta?.businessProfile?.vertical || "Other"}</p></div></div>
          </div>
          <div className="grid grid-cols-2 gap-3"><Button variant="outline" size="sm" onClick={onView} className="rounded-[5px]">Profile</Button><Button variant="secondary" size="sm" onClick={onEdit} className="rounded-[5px]">Edit</Button></div>
        </div>
      </Card>

      <Card className="p-6 bg-slate-900 text-white overflow-hidden relative group rounded-[5px]">
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-brand-500/20 blur-3xl rounded-full -mb-8 -mr-8" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4"><div className="p-2 bg-brand-600 rounded-[5px] text-white"><Wallet size={18} /></div><Badge tone="brand" className="bg-brand-500/20 text-brand-50 border-none tracking-normal">WhatsApp Credits</Badge></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Balance</p>
          <h3 className="text-3xl font-black text-black mb-6">{formatCurrencySafe(Number(snapshot?.wallet?.balance ?? 0), String(snapshot?.wallet?.currency || "INR"))}</h3>
          <Button variant="primary" className="w-full bg-brand-500 hover:bg-brand-400 text-white font-black rounded-[5px]" onClick={onRecharge}><Plus size={20} /> Buy Credits</Button>
        </div>
      </Card>
    </div>
  );
}
