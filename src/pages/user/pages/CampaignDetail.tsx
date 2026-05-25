import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API } from "@api/api";
import { Alert } from "@components/ui/Alert";
import { CampaignDetailSkeleton } from "@components/ui/Skeletons";
import CampaignCreateModal from "@components/campaigns/CampaignCreateModal";
import { parseComponentsForPreview } from "@pages/user/templates/helpers";
import { useToast } from "@shared/providers/ToastContext";
import type { TemplateRecord } from "@shared/utils/templateRuntime";
import { downloadCsv } from "./campaign-detail/helpers";
import { buildTabMeta, DetailHeader, LastErrorBanner, LeftOverviewPanel, LogCard, MainGrid, OverviewCard } from "./campaign-detail/sections";
import type { Campaign, CampaignMessageItem, Metrics, ReplyItem, TabId } from "./campaign-detail/types";
import { motion } from "framer-motion";

export default function CampaignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [templatePreviewProps, setTemplatePreviewProps] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [creditUsage, setCreditUsage] = useState<{ net: number; currency: string } | null>(null);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [items, setItems] = useState<CampaignMessageItem[]>([]);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [retryTemplates, setRetryTemplates] = useState<TemplateRecord[]>([]);
  const [retrySeed, setRetrySeed] = useState<{ name: string; phones: string[] } | null>(null);
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsTotal, setItemsTotal] = useState(0);
  const ITEMS_PER_PAGE = 50;

  const tab = (searchParams.get("tab") as TabId) || "overview";
  const setTab = (next: TabId) => setSearchParams((prev) => {
    const p = new URLSearchParams(prev);
    p.set("tab", next);
    return p;
  });

  const audienceTotal = metrics?.audienceTotal ?? campaign?.totals?.total ?? 0;
  const tabMeta = useMemo(() => buildTabMeta(metrics, campaign, audienceTotal), [metrics, campaign, audienceTotal]);
  const tabGraphValue = tab === "overview" ? 0 : itemsTotal;
  const counts = metrics?.counts;
  const createdAt = campaign?.createdAt ? new Date(campaign.createdAt) : null;
  const selectedPhones = Object.keys(selected).filter((k) => selected[k]);
  const failedPhones = items.map((x) => x.phone);
  const allFailedSelected = failedPhones.length > 0 && failedPhones.every((p) => selected[p]);

  const currentStatus = String(campaign?.status || "").toLowerCase();
  const isApiCampaign = String(campaign?.type || "").toLowerCase() === "api";
  const isCanceled = ["canceled", "cancelled"].includes(currentStatus);
  const isPaused = currentStatus === "paused";
  const isLive = currentStatus === "running";
  const allowPause = isLive;
  const allowResume = isPaused;
  const allowStop = isLive || isPaused;
  const allowComplete = isLive && isApiCampaign;
  const hasStatusActions = allowPause || allowResume || allowStop || allowComplete;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) setStatusMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadCampaign() {
    if (!id) return;
    if (!campaign) setLoading(true);
    setSyncing(true);
    try {
      const cRes = await API.campaigns.get(id);
      setCampaign(cRes?.campaign || null);
      setLoading(false);
      const templateId = cRes?.campaign?.templateId;
      const [mRes, creditRes, tRes] = await Promise.allSettled([API.campaigns.metrics(id), API.campaigns.creditUsage(id), templateId ? API.templates.get(templateId) : Promise.resolve(null)]);
      if (mRes.status === "fulfilled" && mRes.value?.success) setMetrics(mRes.value);
      if (creditRes.status === "fulfilled" && creditRes.value?.success) setCreditUsage({ net: Number(creditRes.value?.net || 0), currency: String(creditRes.value?.currency || "INR") });
      if (tRes.status === "fulfilled") {
        const tpl = tRes.value?.template || null;
        setTemplateName(String(tpl?.name || ""));
        setCampaign((prev) => (prev ? { ...prev, templateName: String(tpl?.name || "") } : prev));
        const parsed = parseComponentsForPreview(tpl?.components || []);
        setTemplatePreviewProps({ category: tpl?.category || "utility", headerType: parsed.headerType, headerText: parsed.headerText, mediaHandle: parsed.mediaHandle, headerLocation: parsed.headerLocation, bodyText: parsed.bodyText, footerText: parsed.footerText, ctaButtons: parsed.ctaButtons, variableValues: {}, headerVariableValues: {}, authConfig: parsed.authConfig });
      } else {
        setTemplateName("");
        setTemplatePreviewProps(null);
      }
      if (!loading) toast("Campaign details updated", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load campaign detail", "error");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => { void loadCampaign(); }, [id]);
  useEffect(() => { setItems([]); setReplies([]); setSelected({}); setItemsPage(1); setItemsTotal(0); setStatusMenuOpen(false); }, [tab]);

  useEffect(() => {
    if (!id || tab === "overview") return;
    setItemsLoading(true);
    (async () => {
      try {
        if (tab === "replied") {
          const res = await API.campaigns.replies(id, { page: itemsPage, limit: ITEMS_PER_PAGE });
          setReplies(Array.isArray(res?.items) ? res.items : []);
          setItemsTotal(res?.total || 0);
          setItems([]);
          return;
        }
        const res = await API.campaigns.messages(id, { tab, page: itemsPage, limit: ITEMS_PER_PAGE });
        setItems(Array.isArray(res?.items) ? res.items : []);
        setItemsTotal(res?.total || 0);
        setReplies([]);
      } catch (e: any) {
        toast(e?.response?.data?.message || "Failed to load campaign data", "error");
      } finally {
        setItemsLoading(false);
      }
    })();
  }, [id, tab, itemsPage]);

  if (loading) return <CampaignDetailSkeleton />;
  if (!campaign) return <div className="p-6"><Alert tone="error">Campaign not found</Alert></div>;

  const exportFailed = () => downloadCsv(`campaign_failed_${campaign._id.slice(-8)}.csv`, items.filter((it) => selected[it.phone]).map((it) => ({ phone: it.phone, name: it.name, status: it.status, error: it.error?.message || it.error?.error?.message || "" })));
  const createRetryBroadcast = async () => {
    if (!id || !selectedPhones.length) return;
    setBusy(true);
    try {
      const tRes = await API.templates.list();
      setRetryTemplates(tRes?.templates || []);
      setRetrySeed({ name: `Retry - ${campaign.name}`.slice(0, 140), phones: selectedPhones });
      setRetryModalOpen(true);
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to load templates", "error");
    } finally {
      setBusy(false);
    }
  };
  const runAction = async (action: "pause" | "resume" | "stop" | "complete") => {
    if (!id) return;
    setBusy(true);
    try {
      await API.campaigns.action(id, action);
      const actionLabel = action === "stop" ? "canceled" : action === "complete" ? "completed" : `${action}d`;
      toast(`Campaign ${actionLabel} successfully.`, "success");
      await loadCampaign();
    } catch (e: any) {
      toast(e?.response?.data?.message || "Unable to update campaign status", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#F8FAFC]">
      <DetailHeader campaign={campaign} tabMeta={tabMeta} tab={tab} audienceTotal={audienceTotal} setTab={setTab} navigate={navigate} loadCampaign={loadCampaign} loading={loading} syncing={syncing} />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <LastErrorBanner campaign={campaign} />
        <MainGrid tab={tab}>
          {tab === "overview" ? <LeftOverviewPanel campaign={campaign} createdAt={createdAt} templateName={templateName} templatePreviewProps={templatePreviewProps} /> : null}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 order-2 lg:order-2 w-full">
            {tab === "overview" ? (
              <OverviewCard campaign={campaign} counts={counts} audienceTotal={audienceTotal} creditUsage={creditUsage} isCanceled={isCanceled} statusMenuOpen={statusMenuOpen} setStatusMenuOpen={setStatusMenuOpen} hasStatusActions={hasStatusActions} busy={busy} allowPause={allowPause} allowResume={allowResume} allowStop={allowStop} allowComplete={allowComplete} runAction={runAction} statusMenuRef={statusMenuRef} />
            ) : (
              <LogCard tab={tab} itemsLoading={itemsLoading} replies={replies} items={items} allFailedSelected={allFailedSelected} failedPhones={failedPhones} selected={selected} setSelected={setSelected} itemsTotal={itemsTotal} itemsPage={itemsPage} setItemsPage={setItemsPage} ITEMS_PER_PAGE={ITEMS_PER_PAGE} selectedPhones={selectedPhones} exportFailed={exportFailed} createRetryBroadcast={createRetryBroadcast} busy={busy} tabGraphValue={tabGraphValue} />
            )}
          </motion.div>
        </MainGrid>
        <CampaignCreateModal
          isOpen={retryModalOpen}
          onClose={() => { setRetryModalOpen(false); setRetrySeed(null); }}
          onSuccess={async () => { await loadCampaign(); }}
          templates={retryTemplates}
          contacts={[]}
          initialType={retrySeed ? "broadcast" : undefined}
          initialSelectedPhones={retrySeed ? retrySeed.phones : undefined}
          initialName={retrySeed ? retrySeed.name : undefined}
          lockRecipients={!!retrySeed}
        />
      </div>
    </div>
  );
}
