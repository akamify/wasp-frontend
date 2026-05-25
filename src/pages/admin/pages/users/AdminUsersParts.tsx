import { Mail, Phone, ShieldCheck, Calendar, Briefcase, Ban, Copy, Check } from "lucide-react";
import { cn } from "@shared/utils/cn";
import { Button } from "@components/ui/Button";
import { AdminTruncate } from "@pages/admin/components/AdminTruncate";

export function AdminUserRow({ u, selectedId, copiedWorkspaceId, onCopyWorkspaceId, onPick }: any) {
  return (
    <tr key={u.id} className={cn("group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer", u.id === selectedId ? "bg-brand-50/50" : "")} onClick={() => onPick(u)}>
      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="size-10 rounded-[5px] bg-brand-100 flex items-center justify-center text-brand-600 font-black text-sm group-hover:scale-110 transition-transform">{u.name?.[0] || u.email?.[0] || "U"}</div><div className="min-w-0"><div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">{u.name || "Unnamed User"}</div><div className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1"><Mail size={10} /> {u.email}</div></div></div></td>
      <td className="px-6 py-4"><div className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Phone size={12} className="text-slate-400" />{u.phone || "No phone"}</div></td>
      <td className="px-6 py-4"><div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest", "bg-blue-100 text-blue-700")}><ShieldCheck size={10} />user</div>{Boolean(u.accountBlocked) ? <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-100"><Ban size={10} /> blocked</div> : null}</td>
      <td className="px-6 py-4"><div className="text-sm font-bold text-slate-800 flex items-center gap-2"><Briefcase size={12} className="text-slate-400" /><AdminTruncate text={u.workspace?.name || "N/A"} max={24} /></div><div className="mt-1 inline-flex items-center gap-1 rounded-[4px] bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600"><span className="uppercase tracking-wider text-slate-400">ID</span><span>{u.workspace?.id || "-"}</span>{u.workspace?.id ? <button type="button" onClick={(e) => { e.stopPropagation(); void onCopyWorkspaceId(u.workspace.id); }} className="rounded p-0.5 text-slate-500 hover:bg-slate-200" title={copiedWorkspaceId === u.workspace.id ? "Copied" : "Copy"}>{copiedWorkspaceId === u.workspace.id ? <Check size={12} /> : <Copy size={12} />}</button> : null}</div></td>
      <td className="px-6 py-4"><div className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 rounded-[4px] text-[10px] font-black uppercase tracking-widest border border-brand-100">{u.workspace?.plan || "FREE"}</div></td>
      <td className="px-6 py-4"><div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5"><Calendar size={12} className="text-slate-400" />{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"}</div></td>
    </tr>
  );
}

export function UserDetailsContent({ selected, onOpenAccess }: any) {
  if (!selected) return null;
  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black text-slate-900">{selected.name || "Unnamed User"}</div><div className="mt-1 text-[11px] font-semibold text-slate-600">{selected.email}</div></div>
      <div className="space-y-2"><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Account Status</div><div className="text-[11px] font-semibold text-slate-500">Current: {selected.accountBlocked ? "blocked" : "active"}. Blocked users can't login or use API keys.</div></div>
      <div className="flex items-center justify-end gap-3 pt-2"><Button variant="outline" onClick={onOpenAccess} className="h-11 px-5">Access</Button></div>
    </div>
  );
}
