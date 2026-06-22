import { useEffect, useMemo, useState } from "react";
import { API } from "@api/api";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { useToast } from "@shared/providers/ToastContext";
import { Copy, Link2, Power, RefreshCw, Trash2 } from "lucide-react";

type WebhookItem = {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  lastDelivery?: {
    status?: string;
    statusCode?: number | null;
    event?: string | null;
    error?: string;
    at?: string | null;
  } | null;
};

const defaultEvents = ["message.created", "message.status_updated", "conversation.updated", "contact.updated"];

export function ExternalChatWebhooksPanel() {
  const [items, setItems] = useState<WebhookItem[]>([]);
  const [events, setEvents] = useState<string[]>(defaultEvents);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(defaultEvents);
  const [busy, setBusy] = useState(false);
  const [secret, setSecret] = useState("");
  const { toast } = useToast();

  const eventSet = useMemo(() => new Set(selectedEvents), [selectedEvents]);

  async function load() {
    setBusy(true);
    try {
      const res = await API.externalChatWebhooks.list();
      const data = res?.data || {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setEvents(Array.isArray(data.events) && data.events.length ? data.events : defaultEvents);
      if (!selectedEvents.length) setSelectedEvents(data.events || defaultEvents);
    } catch (e: any) {
      toast(e?.userMessage || e?.message || "Failed to load webhooks", "error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function toggleEvent(event: string) {
    setSelectedEvents((current) => {
      if (current.includes(event)) return current.filter((item) => item !== event);
      return [...current, event];
    });
  }

  async function createWebhook() {
    const trimmed = url.trim();
    if (!trimmed || selectedEvents.length === 0) {
      toast("Enter a webhook URL and select at least one event.", "warning");
      return;
    }
    setBusy(true);
    try {
      const res = await API.externalChatWebhooks.create({ url: trimmed, events: selectedEvents });
      const nextSecret = String(res?.data?.webhook?.secret || "");
      setSecret(nextSecret);
      setUrl("");
      toast("Webhook endpoint created.", "success");
      await load();
    } catch (e: any) {
      toast(e?.userMessage || e?.message || "Failed to create webhook", "error");
    } finally {
      setBusy(false);
    }
  }

  async function updateWebhook(item: WebhookItem, patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await API.externalChatWebhooks.update(item.id, patch);
      toast("Webhook updated.", "success");
      await load();
    } catch (e: any) {
      toast(e?.userMessage || e?.message || "Failed to update webhook", "error");
    } finally {
      setBusy(false);
    }
  }

  async function deleteWebhook(item: WebhookItem) {
    if (!confirm("Delete this webhook endpoint?")) return;
    setBusy(true);
    try {
      await API.externalChatWebhooks.remove(item.id);
      toast("Webhook deleted.", "success");
      await load();
    } catch (e: any) {
      toast(e?.userMessage || e?.message || "Failed to delete webhook", "error");
    } finally {
      setBusy(false);
    }
  }

  async function rotateSecret(item: WebhookItem) {
    if (!confirm("Rotate this webhook secret? Existing signature verification will stop working until updated.")) return;
    setBusy(true);
    try {
      const res = await API.externalChatWebhooks.rotateSecret(item.id);
      setSecret(String(res?.data?.webhook?.secret || ""));
      toast("Webhook secret rotated.", "success");
      await load();
    } catch (e: any) {
      toast(e?.userMessage || e?.message || "Failed to rotate secret", "error");
    } finally {
      setBusy(false);
    }
  }

  function copySecret() {
    if (!secret) return;
    void navigator.clipboard.writeText(secret);
    toast("Webhook secret copied.", "success");
  }

  return (
    <Card className="p-6 border-none shadow-xl shadow-slate-200/50">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">External Chat Webhooks</h3>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400">Signed CRM delivery</p>
        </div>
        <div className="rounded-[5px] bg-slate-50 p-2 text-slate-400">
          <Link2 size={20} />
        </div>
      </div>

      {secret ? (
        <div className="mb-4 rounded-[5px] border border-emerald-100 bg-emerald-50 p-3">
          <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">Secret shown once</div>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all text-xs font-black text-emerald-800">{secret}</code>
            <Button type="button" size="icon" variant="outline" onClick={copySecret} title="Copy secret">
              <Copy size={16} />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Input label="Endpoint URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://crm.example.com/webhooks/waspakamify" />
        <Button type="button" disabled={busy} onClick={createWebhook} className="self-end">
          Add Endpoint
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {events.map((event) => (
          <button
            key={event}
            type="button"
            onClick={() => toggleEvent(event)}
            className={`rounded-[5px] border px-2.5 py-1 text-[11px] font-black ${
              eventSet.has(event)
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {event}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-[5px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No webhook endpoints configured.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-[5px] border border-slate-100 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="break-all text-sm font-black text-slate-800">{item.url}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.events.map((event) => (
                      <span key={event} className="rounded-[5px] border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        {event}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-slate-500">
                    {item.lastDelivery?.status
                      ? `${item.lastDelivery.status} ${item.lastDelivery.statusCode || ""} ${item.lastDelivery.event || ""}`
                      : "No deliveries yet"}
                  </div>
                  {item.lastDelivery?.error ? <div className="mt-1 text-[11px] font-semibold text-rose-500">{item.lastDelivery.error}</div> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button type="button" size="icon" variant="outline" disabled={busy} onClick={() => updateWebhook(item, { enabled: !item.enabled })} title={item.enabled ? "Disable" : "Enable"}>
                    <Power size={16} className={item.enabled ? "text-emerald-600" : "text-slate-400"} />
                  </Button>
                  <Button type="button" size="icon" variant="outline" disabled={busy} onClick={() => rotateSecret(item)} title="Rotate secret">
                    <RefreshCw size={16} />
                  </Button>
                  <Button type="button" size="icon" variant="danger" disabled={busy} onClick={() => deleteWebhook(item)} title="Delete">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
