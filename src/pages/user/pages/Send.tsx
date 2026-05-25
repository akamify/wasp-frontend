import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, RefreshCcw, Search } from "lucide-react";
import { API } from "@api/api";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { useToast } from "@shared/providers/ToastContext";
import CampaignCreateModal from "@components/campaigns/CampaignCreateModal";
import type { TemplateRecord } from "@shared/utils/templateRuntime";
import { SendCampaignsTable } from "@pages/user/pages/send/SendCampaignsTable";

type Contact = { _id: string; name?: string; phone: string; company?: string };

type Campaign = {
  _id: string;
  name: string;
  status: string;
  templateId: string;
  type?: "broadcast" | "csv" | "api";
  totals?: { total?: number; queued?: number; sent?: number; failed?: number };
  createdAt?: string;
  lastError?: { message?: any };
};

export default function SendPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [actioningId, setActioningId] = useState("");
  const [retrySeed, setRetrySeed] = useState<{ name: string; phones: string[] } | null>(null);
  const isInitialLoad = useRef(true);

  async function deleteCampaign(campaignId: string, status: string) {
    const active = ["queued", "running", "paused"].includes(String(status || "").toLowerCase());
    const confirmed = window.confirm(
      active
        ? "This campaign is active. Delete with force and remove queued jobs?"
        : "Delete this campaign and its campaign messages?"
    );
    if (!confirmed) return;
    setActioningId(campaignId);
    try {
      await API.campaigns.remove(campaignId, active ? { force: true } : undefined);
      toast("Campaign deleted successfully.", "success");
      await loadData();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to delete campaign", "error");
    } finally {
      setActioningId("");
    }
  }

  async function openRetryBroadcastModal(campaignId: string) {
    setActioningId(campaignId);
    try {
      const campaign = campaigns.find((c) => c._id === campaignId) || null;
      const res = await API.campaigns.failedRecipients(campaignId);
      const phones = Array.isArray(res?.phones) ? res.phones : [];
      if (!phones.length) {
        toast("No failed recipients found for retry", "error");
        return;
      }
      setRetrySeed({
        name: `Retry - ${campaign?.name || "Campaign"}`.slice(0, 140),
        phones,
      });
      setIsModalOpen(true);
      toast(`Loaded ${phones.length} failed recipients`, "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load failed recipients", "error");
    } finally {
      setActioningId("");
    }
  }

  async function loadData() {
    if (!campaigns.length) setLoading(true);
    setSyncing(true);
    try {
      const [campRes, tempRes, contRes] = await Promise.allSettled([
        API.campaigns.list({ limit: 100 }),
        API.templates.list(),
        API.contacts.list({ limit: 100 })
      ]);

      if (campRes.status === "fulfilled") {
        setCampaigns(Array.isArray(campRes.value?.campaigns) ? campRes.value.campaigns : []);
      }
      if (tempRes.status === "fulfilled") {
        setTemplates(tempRes.value?.templates || []);
      }
      if (contRes.status === "fulfilled") {
        setContacts(contRes.value?.contacts || []);
      }

      const failed = [campRes, tempRes, contRes].filter((result) => result.status === "rejected");
      if (failed.length) {
        const firstError = failed[0] as PromiseRejectedResult;
        toast(firstError.reason?.response?.data?.message || "Some campaign data could not be loaded", "error");
      } else if (!isInitialLoad.current) {
        toast("Campaigns and contacts refreshed", "success");
      }
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load workspace data", "error");
    } finally {
      setLoading(false);
      setSyncing(false);
      isInitialLoad.current = false;
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const retryFrom = searchParams.get("retryFrom");
    if (!retryFrom) return;
    if (loading) return;
    void openRetryBroadcastModal(retryFrom);
    const next = new URLSearchParams(searchParams);
    next.delete("retryFrom");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, searchParams]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "all" || c.status.toLowerCase() === filter.toLowerCase();
      const matchesType = typeFilter === "all" || String(c.type || "broadcast") === typeFilter;
      return matchesSearch && matchesFilter && matchesType;
    });
  }, [campaigns, search, filter, typeFilter]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / PAGE_SIZE));
  const paginatedCampaigns = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCampaigns.slice(start, start + PAGE_SIZE);
  }, [filteredCampaigns, page]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, typeFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Campaigns</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Blast messages to your audience groups</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={loadData} disabled={loading || syncing} className="h-10 border border-ink-900/10 bg-white gap-2">
            <RefreshCcw size={16} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Refresh"}
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="h-10 gap-2">
            <Plus size={18} /> New Campaign
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/40" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by campaign name..."
            className="w-full h-11 pl-11 pr-4 rounded-[5px] border border-ink-900/10 bg-white text-sm font-semibold placeholder:text-ink-800/30 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
          {["all", "active", "completed", "Cancelled"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${filter === f
                ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                : "text-ink-800/40 hover:text-ink-900"
                }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-ink-900/5 rounded-[5px]">
          {[
            { value: "all", label: "All types" },
            { value: "broadcast", label: "Broadcast" },
            { value: "csv", label: "CSV" },
            { value: "api", label: "API" }
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`rounded-[3px] px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${typeFilter === t.value
                ? "bg-white text-ink-900 shadow-sm shadow-ink-900/10 ring-1 ring-ink-900/5"
                : "text-ink-800/40 hover:text-ink-900"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-0 border-ink-900/5 shadow-xl shadow-ink-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <SendCampaignsTable
            loading={loading}
            campaigns={paginatedCampaigns}
            actioningId={actioningId}
            onOpenCampaign={(id) => navigate(`/app/send/${id}`)}
            onDeleteCampaign={(event, id, campaignStatus) => {
              event.stopPropagation();
              void deleteCampaign(id, campaignStatus);
            }}
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-ink-800/70">
        <div>
          Showing {filteredCampaigns.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
          {Math.min(page * PAGE_SIZE, filteredCampaigns.length)} of {filteredCampaigns.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-ink-900">
            {page} / {totalPages}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>

      <CampaignCreateModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setRetrySeed(null); }}
        onSuccess={loadData}
        templates={templates}
        contacts={contacts}
        initialType={retrySeed ? "broadcast" : undefined}
        initialSelectedPhones={retrySeed ? retrySeed.phones : undefined}
        initialName={retrySeed ? retrySeed.name : undefined}
      />
    </div>
  );
}
