import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { TableSkeleton } from "@pages/admin/components/AdminSkeletons";

export default function SuperAdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [visibleEvents, setVisibleEvents] = useState(10);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res: any = await API.superAdmin.profile();
      setProfile(res?.profile || null);
      setEvents(Array.isArray(res?.loginEvents) ? res.loginEvents : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setVisibleEvents(10);
  }, [events.length]);

  function onEventsScroll(e: any) {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (!nearBottom) return;
    setVisibleEvents((p) => Math.min(p + 10, events.length));
  }

  if (loading) {
    return (
      <div className="space-y-4 py-4 pr-6">
        <div className="rounded-[5px] border border-slate-200 bg-white p-5">
          <div className="h-6 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        </div>
        <TableSkeleton cols={4} rows={8} />
      </div>
    );
  }

  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="space-y-4 py-4 pr-6">
      <div className="rounded-[5px] border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-black text-slate-900">Super Admin Profile</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={load}>Refresh</Button>
            <Link to="/super-admin/profile/edit">
              <Button>Edit Profile</Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input label="Name" value={String(profile?.name || "")} disabled />
          <Input label="Email" value={String(profile?.email || "")} disabled />
          <Input
            label="Updated At"
            value={profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString("en-IN") : "-"}
            disabled
          />
        </div>
      </div>

      <div className="rounded-[5px] border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">Login Activities</div>
        <div className="max-h-[70vh] overflow-auto p-4" onScroll={onEventsScroll}>
          {events.slice(0, visibleEvents).length ? (
            events.slice(0, visibleEvents).map((e) => (
              <div key={String(e._id)} className="mb-2 rounded-[5px] border border-slate-200 p-3 text-xs">
                <div className="font-bold text-slate-900">{e.action}</div>
                <div className="mt-1 text-slate-600">IP: {e.ip || "-"} | Location: {e.location || "Localhost"}</div>
                <div className="text-slate-600">User Agent: {e.userAgent || "-"}</div>
                <div className="text-slate-500">{e.createdAt ? new Date(e.createdAt).toLocaleString("en-IN") : "-"}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-500">No login activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}
