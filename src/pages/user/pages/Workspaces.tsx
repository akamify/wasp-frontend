import { useEffect, useRef, useState } from "react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { SkeletonBar } from "@components/ui/Skeletons";
import { useAuth } from "@shared/providers/AuthContext";

export default function WorkspacesPage() {
  const { logout, switchWorkspace, user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [openingId, setOpeningId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const avatarLetter = String(user?.name || user?.email || "?").trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    API.workspaces.list().then((res: any) => setItems(Array.isArray(res?.workspaces) ? res.workspaces : [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);
  async function openWorkspace(workspaceId: string) {
    setOpeningId(workspaceId);
    setError("");
    try {
      await switchWorkspace(workspaceId);
      window.location.assign("/app");
    } catch {
      setError("Unable to open workspace. Please try again.");
    } finally {
      setOpeningId("");
    }
  }
  return (
    <div className="space-y-5 px-7">
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div><h1 className="text-2xl font-black">Workspaces</h1></div>
        <div className="relative" ref={profileRef}>
          <button type="button" aria-label="Open profile menu" onClick={() => setProfileOpen((open) => !open)} className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-700 transition-colors hover:bg-brand-200">{avatarLetter}</button>
          {profileOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-[5px] border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="truncate text-sm font-black text-slate-900">{user?.name || "User"}</div>
                <div className="mt-1 truncate text-xs font-semibold text-slate-500">{user?.email}</div>
              </div>
              <div className="p-2">
                <button type="button" onClick={() => void logout()} className="w-full rounded-[5px] px-3 py-2 text-left text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50">Logout</button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="max-w-xl py-4 md:py-8">
        <div className="space-y-4">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-500">Workspace name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-[5px] border border-slate-200 p-3 text-sm normal-case tracking-normal text-slate-900" />
          </label>
          <Button disabled={busy || name.trim().length < 2} onClick={async () => { setBusy(true); try { const res = await API.workspaces.create({ name: name.trim() }); await switchWorkspace(res.workspace.id); window.location.assign("/app"); } finally { setBusy(false); } }}>{busy ? "Creating..." : "Create Workspace"}
          </Button>
        </div>
      </div>
      {error ? <div className="rounded-[5px] border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {loading ? Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-[5px] border border-slate-200 bg-white p-3 px-4">
            <SkeletonBar className="h-5 w-28 rounded-[5px]" />
            <SkeletonBar className="h-4 w-20 rounded-[5px] opacity-60" />
            <SkeletonBar className="h-4 w-32 rounded-[5px] opacity-50" />
            <SkeletonBar className="h-9 w-full rounded-[5px]" />
          </div>
        )) : items.map((workspace) => (
          <div key={workspace.id} className="rounded-[5px] space-y-3 border border-slate-200 bg-white p-3 px-4">
            <div className="text-lg font-black">{workspace.name}</div>
            <div className="text-sm flex items-center gap-2">Plan: {workspace.plan ? <div className="text-sm text-slate-500">{workspace.plan}</div> : null}</div>
            <div className="text-sm flex items-center gap-2 font-500">Created: <div className="text-sm text-slate-500">{new Date(workspace.createdAt).toLocaleDateString()}</div> </div>
            <Button variant="outline" className="mt-4 w-full cursor-pointer" disabled={openingId === workspace.id} onClick={() => void openWorkspace(workspace.id)}>{openingId === workspace.id ? "Opening..." : "Open"}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
