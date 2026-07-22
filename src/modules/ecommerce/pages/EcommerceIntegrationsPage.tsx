import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API } from "@api/api";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Modal } from "@components/ui/Modal";
import { useToast } from "@shared/providers/ToastContext";
import { cn } from "@shared/utils/cn";
import { ArrowLeft, ExternalLink, MoreVertical, Plus, RefreshCw, ShoppingBag, Store, Trash2 } from "lucide-react";

type EcommercePlatform = {
  platform: string;
  name: string;
  description: string;
  connectedStores: number;
  statusSummary?: { connected?: number; paused?: number; error?: number };
};

type EcommerceStore = {
  id: string;
  platform: string;
  storeName: string;
  storeUrl: string;
  storeDomain: string;
  status: string;
  connectionHealth?: { lastError?: string; webhooksConfigured?: boolean; apiAccessValid?: boolean };
  webhooks?: Array<{ topic: string; status: string; lastFailureReason?: string }>;
  lastConnectedAt?: string | null;
  lastSuccessfulCheckAt?: string | null;
  lastWebhookEventAt?: string | null;
  pausedAt?: string | null;
  disconnectedAt?: string | null;
};

type StoreForm = {
  storeName: string;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

const EMPTY_FORM: StoreForm = {
  storeName: "",
  storeUrl: "",
  consumerKey: "",
  consumerSecret: "",
};

const PLATFORM_LABELS: Record<string, string> = {
  woocommerce: "WooCommerce",
  shopify: "Shopify",
};

function statusTone(status: string): "good" | "warn" | "bad" | "neutral" | "brand" {
  if (status === "connected") return "good";
  if (status === "paused" || status === "connecting" || status === "reconnecting" || status === "degraded") return "warn";
  if (status === "connection_error" || status === "disconnected") return "bad";
  return "neutral";
}

function formatDate(value?: string | null) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleString();
}

function extractError(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string; details?: string[] } }; userMessage?: string; message?: string };
  return err?.response?.data?.message || err?.userMessage || err?.message || fallback;
}

function validateForm(form: StoreForm, editing: boolean) {
  const errors: Partial<Record<keyof StoreForm, string>> = {};
  if (!form.storeName.trim()) errors.storeName = "Store name is required.";
  if (!editing && !/^https:\/\/[^/\s]+/i.test(form.storeUrl.trim())) errors.storeUrl = "Enter a valid HTTPS store URL.";
  if (!editing && !form.consumerKey.trim()) errors.consumerKey = "Consumer key is required.";
  if (!editing && !form.consumerSecret.trim()) errors.consumerSecret = "Consumer secret is required.";
  if (editing && (form.consumerKey.trim() || form.consumerSecret.trim()) && (!form.consumerKey.trim() || !form.consumerSecret.trim())) {
    errors.consumerSecret = "Enter both consumer key and consumer secret to update credentials.";
  }
  return errors;
}

export default function EcommerceIntegrationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { platform } = useParams();
  const selectedPlatform = String(platform || "").toLowerCase();
  const isPlatformView = selectedPlatform === "woocommerce" || selectedPlatform === "shopify";
  const isWooCommerce = selectedPlatform === "woocommerce";
  const isShopify = selectedPlatform === "shopify";
  const platformLabel = PLATFORM_LABELS[selectedPlatform] || "";
  const { toast } = useToast();

  const [platforms, setPlatforms] = useState<EcommercePlatform[]>([]);
  const [stores, setStores] = useState<EcommerceStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<EcommerceStore | null>(null);
  const [form, setForm] = useState<StoreForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof StoreForm, string>>>({});
  const [shopifyModalOpen, setShopifyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | { title: string; body: string; cta: string; danger?: boolean; run: () => Promise<void> }>(null);
  const [detailsStore, setDetailsStore] = useState<EcommerceStore | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    setError("");
    try {
      if (isPlatformView) {
        const res = await API.ecommerce.stores({ platform: selectedPlatform });
        setStores(Array.isArray(res?.stores) ? res.stores : []);
      } else {
        const res = await API.ecommerce.platforms();
        setPlatforms(Array.isArray(res?.platforms) ? res.platforms : []);
      }
    } catch (err) {
      setError(extractError(err, "Failed to load ecommerce integrations."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isPlatformView, selectedPlatform]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isShopify) return;
    const params = new URLSearchParams(location.search);
    const status = params.get("shopifyStatus");
    if (!status) return;
    if (status === "connected") {
      toast(`Shopify store connected${params.get("store") ? `: ${params.get("store")}` : ""}`, "success");
      load(true);
    } else if (status === "error") {
      toast(params.get("message") || "Shopify connection failed", "error");
    }
    navigate("/app/ecommerce/shopify", { replace: true });
  }, [isShopify, load, location.search, navigate, toast]);

  const wooPlatform = useMemo(() => {
    return platforms.find((item) => item.platform === "woocommerce") || {
      platform: "woocommerce",
      name: "WooCommerce",
      description: "Connect WooCommerce stores and manage connected store health.",
      connectedStores: 0,
      statusSummary: {},
    };
  }, [platforms]);

  const shopifyPlatform = useMemo(() => {
    return platforms.find((item) => item.platform === "shopify") || {
      platform: "shopify",
      name: "Shopify",
      description: "Authorize Shopify stores and manage ecommerce webhook event sync.",
      connectedStores: 0,
      statusSummary: {},
    };
  }, [platforms]);

  function openCreate() {
    if (isShopify) {
      setShopifyModalOpen(true);
      return;
    }
    setEditingStore(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(store: EcommerceStore) {
    setEditingStore(store);
    setForm({ storeName: store.storeName || "", storeUrl: store.storeUrl || "", consumerKey: "", consumerSecret: "" });
    setFieldErrors({});
    setModalOpen(true);
  }

  function openShopifyCreate() {
    setShopifyModalOpen(true);
  }

  async function submitStore() {
    const errors = validateForm(form, !!editingStore);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSubmitting(true);
    try {
      if (editingStore) {
        const payload: Record<string, string> = { storeName: form.storeName.trim() };
        if (form.consumerKey.trim() || form.consumerSecret.trim()) {
          payload.consumerKey = form.consumerKey.trim();
          payload.consumerSecret = form.consumerSecret.trim();
        }
        await API.ecommerce.updateStore(editingStore.id, payload);
        toast("Store updated", "success");
      } else {
        await API.ecommerce.createStore({
          platform: "woocommerce",
          storeName: form.storeName.trim(),
          storeUrl: form.storeUrl.trim(),
          consumerKey: form.consumerKey.trim(),
          consumerSecret: form.consumerSecret.trim(),
        });
        toast("WooCommerce store connected", "success");
      }
      setModalOpen(false);
      await load(true);
    } catch (err) {
      toast(extractError(err, editingStore ? "Failed to update store." : "Failed to connect WooCommerce store."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitShopify() {
    setSubmitting(true);
    try {
      const res = await API.ecommerce.startShopifyConnect({});
      if (!res?.authorizationUrl) throw new Error("Shopify authorization URL was not returned.");
      window.location.assign(res.authorizationUrl);
    } catch (err) {
      const message = extractError(err, "Failed to start Shopify authorization.");
      toast(message, "error");
      setSubmitting(false);
    }
  }

  async function runStoreAction(store: EcommerceStore, label: string, action: () => Promise<unknown>, success: string) {
    setActionBusy(`${store.id}:${label}`);
    try {
      await action();
      toast(success, "success");
      await load(true);
    } catch (err) {
      toast(extractError(err, "Store action failed."), "error");
    } finally {
      setActionBusy("");
    }
  }

  async function reconnectStore(store: EcommerceStore) {
    setActionBusy(`${store.id}:reconnect`);
    try {
      const res = await API.ecommerce.reconnectStore(store.id);
      if (res?.requiresAuthorization && res?.authorization?.authorizationUrl) {
        window.location.assign(res.authorization.authorizationUrl);
        return;
      }
      toast("Reconnect check completed", "success");
      await load(true);
    } catch (err) {
      toast(extractError(err, "Reconnect failed."), "error");
      setActionBusy("");
    }
  }

  async function openDetails(store: EcommerceStore) {
    setDetailsStore(store);
    setEvents([]);
    setEventsLoading(true);
    try {
      const res = await API.ecommerce.events(store.id, { limit: 25 });
      setEvents(Array.isArray(res?.events) ? res.events : []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }

  if (isPlatformView) {
    return (
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button type="button" onClick={() => navigate("/app/ecommerce")} className="mb-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900">
              <ArrowLeft size={14} /> Ecommerce Integrations
            </button>
            <h1 className="text-2xl font-black text-slate-900">{platformLabel}</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage connected {platformLabel} stores, authorization and webhook health.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={() => load(true)} disabled={refreshing}>
              <RefreshCw size={16} className={cn(refreshing && "animate-spin cursor-pointer")} /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} /> Add {platformLabel} Store
            </Button>
          </div>
        </div>

        {error ? <div className="rounded-[5px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}

        {loading ? (
          <Card className="p-8 text-sm font-semibold text-slate-500">Loading {platformLabel} stores...</Card>
        ) : stores.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black text-slate-900">No {platformLabel} stores connected.</div>
                <p className="mt-1 text-sm text-slate-500">Connect your first store to prepare ecommerce event sync.</p>
              </div>
              <Button onClick={openCreate}><Plus size={16} /> Connect {platformLabel} Store</Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                busyKey={actionBusy}
                onManage={() => openDetails(store)}
                onEdit={() => openEdit(store)}
                onReconnect={() => reconnectStore(store)}
                onPause={() => runStoreAction(store, "pause", () => API.ecommerce.pauseStore(store.id), "Store event processing paused")}
                onResume={() => runStoreAction(store, "resume", () => API.ecommerce.resumeStore(store.id), "Store event processing resumed")}
                onDisconnect={() => setConfirmAction({
                  title: `Disconnect ${platformLabel} Store`,
                  body: "This stops ecommerce event processing and disables AI Wiz-managed webhook tracking for this store. Historical data is preserved.",
                  cta: "Disconnect",
                  danger: true,
                  run: () => runStoreAction(store, "disconnect", () => API.ecommerce.disconnectStore(store.id), "Store disconnected"),
                })}
                onDelete={() => setConfirmAction({
                  title: `Delete ${platformLabel} Store`,
                  body: "This permanently removes the store connection record and encrypted credentials. Contacts and unrelated CRM history are not deleted.",
                  cta: "Delete Store",
                  danger: true,
                  run: () => runStoreAction(store, "delete", () => API.ecommerce.deleteStore(store.id), "Store deleted"),
                })}
              />
            ))}
          </div>
        )}

        {isWooCommerce || editingStore ? (
          <StoreModal
            open={modalOpen}
            editing={!!editingStore}
            platformName={platformLabel}
            credentialFields={isWooCommerce}
            form={form}
            fieldErrors={fieldErrors}
            submitting={submitting}
            onClose={() => !submitting && setModalOpen(false)}
            onChange={setForm}
            onSubmit={submitStore}
          />
        ) : (
          <ShopifyAuthModal
            open={shopifyModalOpen}
            submitting={submitting}
            onClose={() => !submitting && setShopifyModalOpen(false)}
            onSubmit={() => submitShopify()}
          />
        )}
        <ConfirmModal confirm={confirmAction} busy={!!actionBusy} onClose={() => setConfirmAction(null)} />
        <DetailsModal store={detailsStore} events={events} loading={eventsLoading} onClose={() => setDetailsStore(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Ecommerce Integrations</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Connect ecommerce platforms and manage every connected store under one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={16} className={cn(refreshing && "animate-spin cursor-pointer")} /> Refresh
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-[5px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PlatformCard platform={wooPlatform} loading={loading} onOpen={() => navigate("/app/ecommerce/woocommerce")} onAdd={openCreate} />
        <PlatformCard platform={shopifyPlatform} loading={loading} onOpen={() => navigate("/app/ecommerce/shopify")} onAdd={openShopifyCreate} />
      </div>

      <StoreModal
        open={modalOpen}
        editing={false}
        platformName="WooCommerce"
        credentialFields
        form={form}
        fieldErrors={fieldErrors}
        submitting={submitting}
        onClose={() => !submitting && setModalOpen(false)}
        onChange={setForm}
        onSubmit={submitStore}
      />
      <ShopifyAuthModal
        open={shopifyModalOpen}
        submitting={submitting}
        onClose={() => !submitting && setShopifyModalOpen(false)}
        onSubmit={() => submitShopify()}
      />
    </div>
  );
}

function PlatformCard({ platform, loading, onOpen, onAdd }: { platform: EcommercePlatform; loading: boolean; onOpen: () => void; onAdd: () => void }) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-0">
        <div className="flex items-start gap-2">
          <div className="rounded-[5px] bg-purple-50 p-3 text-purple-700"><ShoppingBag size={24} /></div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{platform.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{platform.description}</p>
          </div>
        </div>
        <Badge className="flex items-center" tone={platform.connectedStores ? "good" : "neutral"}>{loading ? "..." : `${platform.connectedStores} stores`}</Badge>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 rounded-[5px] bg-slate-50 p-3 text-center">
        <div><div className="text-lg font-black text-slate-900">{platform.statusSummary?.connected || 0}</div><div className="text-[10px] font-bold uppercase text-slate-400">Connected</div></div>
        <div><div className="text-lg font-black text-slate-900">{platform.statusSummary?.paused || 0}</div><div className="text-[10px] font-bold uppercase text-slate-400">Paused</div></div>
        <div><div className="text-lg font-black text-slate-900">{platform.statusSummary?.error || 0}</div><div className="text-[10px] font-bold uppercase text-slate-400">Issues</div></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button className="cursor-pointer" variant="outline" onClick={onOpen}>View Stores</Button>
        <Button className="cursor-pointer" onClick={onAdd}><Plus size={16} /> Add Store</Button>
      </div>
    </Card>
  );
}

function StoreCard(props: {
  store: EcommerceStore;
  busyKey: string;
  onManage: () => void;
  onEdit: () => void;
  onReconnect: () => void;
  onPause: () => void;
  onResume: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}) {
  const { store, busyKey } = props;
  const busy = busyKey.startsWith(`${store.id}:`);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-brand-600" />
            <h3 className="truncate text-base font-black text-slate-900">{store.storeName}</h3>
          </div>
          <a href={store.storeUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs font-bold text-slate-500 hover:text-brand-600">
            <span className="truncate">{store.storeDomain || store.storeUrl}</span><ExternalLink size={12} />
          </a>
        </div>
        <Badge tone={statusTone(store.status)}>{store.status}</Badge>
      </div>
      <div className="mt-4 grid gap-3 text-xs font-semibold text-slate-600 sm:grid-cols-2">
        <InfoLine label="Last health check" value={formatDate(store.lastSuccessfulCheckAt)} />
        <InfoLine label="Last webhook event" value={formatDate(store.lastWebhookEventAt)} />
        <InfoLine label="Webhook health" value={store.connectionHealth?.webhooksConfigured ? "Configured" : "Not configured"} />
        <InfoLine label="API access" value={store.connectionHealth?.apiAccessValid ? "Valid" : "Needs check"} />
      </div>
      {store.connectionHealth?.lastError ? (
        <div className="mt-4 rounded-[5px] border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
          {store.connectionHealth.lastError}
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={props.onManage}><MoreVertical size={14} /> Manage</Button>
        <Button size="sm" variant="outline" onClick={props.onEdit}>Edit</Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={props.onReconnect}>Reconnect</Button>
        {store.status === "paused" ? (
          <Button size="sm" variant="outline" disabled={busy} onClick={props.onResume}>Resume</Button>
        ) : (
          <Button size="sm" variant="outline" disabled={busy} onClick={props.onPause}>Pause</Button>
        )}
        <Button size="sm" variant="danger" disabled={busy} onClick={props.onDisconnect}>Disconnect</Button>
        <Button size="sm" variant="danger" disabled={busy} onClick={props.onDelete}><Trash2 size={14} /> Delete</Button>
      </div>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div><div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div><div className="mt-0.5 text-slate-700">{value}</div></div>;
}

function StoreModal(props: {
  open: boolean;
  editing: boolean;
  platformName: string;
  credentialFields?: boolean;
  form: StoreForm;
  fieldErrors: Partial<Record<keyof StoreForm, string>>;
  submitting: boolean;
  onClose: () => void;
  onChange: (form: StoreForm) => void;
  onSubmit: () => void;
}) {
  const { form, fieldErrors, editing, submitting, credentialFields = true, platformName } = props;
  const set = (key: keyof StoreForm, value: string) => props.onChange({ ...form, [key]: value });
  return (
    <Modal isOpen={props.open} onClose={props.onClose} title={editing ? `Edit ${platformName} Store` : `Connect ${platformName} Store`} className="max-w-xl">
      <div className="space-y-4">
        <Input label="Store Name" value={form.storeName} onChange={(e) => set("storeName", e.target.value)} hint={fieldErrors.storeName || "Use a recognizable internal store name."} />
        {credentialFields ? (
          <>
            <Input label="Store URL" value={form.storeUrl} disabled={editing} onChange={(e) => set("storeUrl", e.target.value)} placeholder="https://store.example.com" hint={fieldErrors.storeUrl || "Must be a public HTTPS WooCommerce store URL."} />
            <Input label="Consumer Key" value={form.consumerKey} onChange={(e) => set("consumerKey", e.target.value)} autoComplete="off" hint={fieldErrors.consumerKey || (editing ? "Leave blank unless updating credentials." : "WooCommerce REST API consumer key with read/write access.")} />
            <Input label="Consumer Secret" type="password" value={form.consumerSecret} onChange={(e) => set("consumerSecret", e.target.value)} autoComplete="new-password" hint={fieldErrors.consumerSecret || "Secret is submitted once and never returned by the API."} />
          </>
        ) : null}
        <div className="rounded-[5px] border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
          {credentialFields
            ? "Connecting validates API access, provisions AI Wiz-managed webhooks, encrypts credentials, and returns only sanitized store metadata."
            : "Only safe store metadata can be edited here. Shopify authorization is managed through Shopify reconnect."}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={submitting} onClick={props.onClose}>Cancel</Button>
          <Button disabled={submitting} onClick={props.onSubmit}>{submitting ? (editing ? "Saving..." : "Connecting...") : editing ? "Save Changes" : "Connect Store"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ShopifyAuthModal(props: {
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal isOpen={props.open} onClose={props.onClose} title="Connect Shopify Store" className="max-w-xl">
      <div className="space-y-4">
        <p className="text-sm font-semibold leading-6 text-slate-600">
          You'll be redirected to Shopify to authorize AI Wiz Chat to access the permissions required for ecommerce integration.
        </p>
        <div className="rounded-[5px] border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
          Shopify identifies the store during authorization. AI Wiz Chat then verifies the store, checks granted scopes, configures managed webhooks, and stores the per-store authorization securely.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={props.submitting} onClick={props.onClose}>Cancel</Button>
          <Button disabled={props.submitting} onClick={props.onSubmit}>{props.submitting ? "Redirecting..." : "Continue to Shopify"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ confirm, busy, onClose }: { confirm: null | { title: string; body: string; cta: string; danger?: boolean; run: () => Promise<void> }; busy: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={!!confirm} onClose={onClose} title={confirm?.title || "Confirm"} className="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm font-semibold leading-7 text-slate-700">{confirm?.body}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button variant={confirm?.danger ? "danger" : "primary"} disabled={busy} onClick={async () => { if (!confirm) return; await confirm.run(); onClose(); }}>{confirm?.cta || "Confirm"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function DetailsModal({ store, events, loading, onClose }: { store: EcommerceStore | null; events: any[]; loading: boolean; onClose: () => void }) {
  const title = `${PLATFORM_LABELS[String(store?.platform || "")] || "Ecommerce"} Store Details`;
  return (
    <Modal isOpen={!!store} onClose={onClose} title={title} className="max-w-3xl">
      {store ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoLine label="Store" value={store.storeName} />
            <InfoLine label="Status" value={store.status} />
            <InfoLine label="Domain" value={store.storeDomain || store.storeUrl} />
            <InfoLine label="Last webhook event" value={formatDate(store.lastWebhookEventAt)} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Webhook health</h3>
            <div className="mt-2 space-y-2">
              {(store.webhooks || []).length ? store.webhooks?.map((webhook) => (
                <div key={`${webhook.topic}-${webhook.status}`} className="flex items-center justify-between rounded-[5px] border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold">
                  <span>{webhook.topic}</span>
                  <Badge tone={webhook.status === "active" ? "good" : "warn"}>{webhook.status}</Badge>
                </div>
              )) : <div className="text-sm font-semibold text-slate-500">No webhook records yet.</div>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Recent event logs</h3>
            <div className="mt-2 space-y-2">
              {loading ? <div className="text-sm text-slate-500">Loading events...</div> : events.length ? events.map((event) => (
                <div key={event.id} className="rounded-[5px] border border-slate-100 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-800">{event.topic}</span>
                    <Badge tone={event.status === "received" ? "brand" : "neutral"}>{event.status}</Badge>
                  </div>
                  <div className="mt-1 text-slate-500">{formatDate(event.receivedAt || event.createdAt)}</div>
                </div>
              )) : <div className="text-sm font-semibold text-slate-500">No events received yet.</div>}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
