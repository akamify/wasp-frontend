import React, { useEffect, useState } from "react";
import { API } from "../api/api";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { useToast } from "../context/ToastContext";
import { Badge } from "../components/ui/Badge";
import { Link2, Copy, ExternalLink, Info, CheckCircle2 } from "lucide-react";

type Template = { _id: string; name: string };

export default function LinksPage() {
  const [url, setUrl] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [messageId, setMessageId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busy, setBusy] = useState(false);
  const [trackedUrl, setTrackedUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    API.templates
      .list()
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {});
  }, []);

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    setTrackedUrl(null);
    setBusy(true);
    try {
      const res = await API.links.create({
        url,
        ...(templateId ? { templateId } : {}),
        ...(messageId ? { messageId } : {}),
      });
      setTrackedUrl(res.trackedUrl);
      toast("Tracked link generated successfully.", "success");
    } catch (e: any) {
      toast(e?.response?.data?.message || "Failed to create tracked link", "error");
    } finally {
      setBusy(false);
    }
  }

  const copyToClipboard = () => {
    if (trackedUrl) {
      navigator.clipboard.writeText(trackedUrl);
      toast("URL copied to clipboard", "success");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink-900">Tracked Links</h1>
          <p className="mt-2 text-sm font-semibold text-ink-800/60 uppercase tracking-widest">Analytics & Redirect Engine</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card className="p-6 md:p-8 border-ink-900/5 shadow-xl shadow-ink-900/5">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-[5px] bg-brand-50 flex items-center justify-center text-brand-600">
                <Link2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-ink-900">URL Generator</h2>
                <p className="text-xs font-bold text-ink-800/40 uppercase tracking-wider">Convert any URL into a tracked asset</p>
              </div>
            </div>

            <form onSubmit={onGenerate} className="space-y-6">
              <Input
                label="Destination URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com/promo-123"
                hint="The final destination where users will be redirected"
                required
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <Select
                  label="Associate Template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="">None (Standalone)</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Message ID"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  placeholder="Optional ID"
                  hint="For granular tracking"
                />
              </div>

              <Button 
                type="submit" 
                disabled={busy || !url.trim()} 
                className="w-full h-12 text-base font-black gap-2 shadow-lg shadow-brand-500/20"
              >
                {busy ? "Generating Engine..." : (
                  <>
                    <CheckCircle2 size={18} />
                    Generate Tracked Link
                  </>
                )}
              </Button>
            </form>

            {trackedUrl && (
              <div className="mt-8 p-6 rounded-[5px] bg-slate-50 border border-brand-500/20 ring-4 ring-brand-500/5 animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">Tracking Engine Ready</div>
                  <Badge tone="good" className="rounded-[3px] py-0.5 text-[9px]">ACTIVE</Badge>
                </div>
                <div className="font-mono text-xs font-bold text-ink-900 break-all bg-white p-3 rounded-[3px] border border-ink-900/10 shadow-inner">
                  {trackedUrl}
                </div>
                <div className="mt-4 flex gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={copyToClipboard}
                    className="flex-1 h-10 border border-ink-900/10 bg-white gap-2 shadow-sm text-xs font-black uppercase tracking-widest"
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => window.open(trackedUrl, "_blank")}
                    className="flex-1 h-10 border border-ink-900/10 bg-white gap-2 shadow-sm text-xs font-black uppercase tracking-widest"
                  >
                    <ExternalLink size={14} />
                    Test Link
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-ink-900/5 bg-slate-50 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Info size={16} className="text-brand-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-ink-900">How it works</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-white border border-ink-900/10 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                <p className="text-[11px] font-medium text-ink-800/60 leading-relaxed">
                  We generate a unique signed URL that points to our redirect server.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-white border border-ink-900/10 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                <p className="text-[11px] font-medium text-ink-800/60 leading-relaxed">
                  When a user clicks, we log their metadata (IP, User-Agent, Timestamp).
                </p>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-white border border-ink-900/10 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                <p className="text-[11px] font-medium text-ink-800/60 leading-relaxed">
                  The user is instantly redirected to your destination URL without delay.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-ink-900/5 bg-ink-900 text-white shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-3">Best Practice</h3>
            <p className="text-[11px] font-medium text-white/80 leading-relaxed">
              Use tracked links in your WhatsApp templates to measure Campaign performance and ROI accurately.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
