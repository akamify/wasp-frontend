import React, { useEffect, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

type Template = { _id: string; name: string };

export default function LinksPage() {
  const [url, setUrl] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedUrl, setTrackedUrl] = useState<string | null>(null);

  useEffect(() => {
    API.templates
      .list()
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {});
  }, []);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setTrackedUrl(null);
    setBusy(true);
    try {
      const res = await API.links.create({
        url,
        ...(templateId ? { templateId } : {}),
        ...(messageId ? { messageId } : {}),
      });
      setTrackedUrl(res.trackedUrl);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create tracked link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[5px] bg-white/60 p-6 ring-1 ring-ink-900/10 backdrop-blur">
        <div className="text-xs font-semibold text-ink-800/60">Analytics</div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Tracked links</h1>
        <p className="mt-2 text-sm text-ink-800/70">
          Generate a signed tracking URL. When clicked, we log the click and redirect.
        </p>
      </div>

      <Card className="p-6">
        <div className="text-lg font-black tracking-tight">Create tracked URL</div>

        <form className="mt-5 grid gap-3" onSubmit={onGenerate}>
          {error ? <Alert>{error}</Alert> : null}
          <Input
            label="Destination URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/offer"
            required
          />
          <Select
            label="Template (optional)"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            <option value="">—</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Input
            label="Message ID (optional)"
            value={messageId}
            onChange={(e) => setMessageId(e.target.value)}
            placeholder="Mongo message _id"
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Generating..." : "Generate"}
          </Button>
        </form>

        {trackedUrl ? (
          <div className="mt-5 rounded-[5px] bg-brand-50 p-4 ring-1 ring-brand-200">
            <div className="text-xs font-black">Tracked URL</div>
            <div className="mt-2 break-all rounded-[5px] bg-white/70 px-3 py-2 text-sm font-semibold ring-1 ring-ink-900/10">
              {trackedUrl}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="ghost" onClick={() => navigator.clipboard.writeText(trackedUrl)}>
                Copy
              </Button>
              <a
                className="inline-flex items-center justify-center rounded-[5px] bg-white/70 px-4 py-2 text-sm font-semibold ring-1 ring-ink-900/10 hover:bg-white"
                href={trackedUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

