import { Card } from "@components/ui/Card";
import { Globe, MessageSquare, Radio, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  baseUrl: string;
};

const events = ["message.created", "message.status_updated", "conversation.updated", "contact.updated"];

export function DeveloperQuickStart({ baseUrl }: Props) {
  return (
    <Card className="p-6 border-none shadow-xl shadow-slate-200/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900">Quick Start</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Campaigns and external inbox</p>
        </div>
        <div className="p-2 bg-slate-50 rounded-[5px] text-slate-400">
          <Globe size={20} />
        </div>
      </div>

      <div className="space-y-4 text-sm text-slate-700">
        <div className="grid gap-2 sm:grid-cols-2">
          <Info label="Base URL" value={baseUrl} />
          <Info label="Auth Header" value="X-API-KEY: your_key" />
        </div>

        <Snippet
          icon={<ShieldCheck size={16} />}
          title="Campaign API"
          code={`curl -X POST \\
  ${baseUrl}/integrations/campaigns/send \\
  -H "X-API-KEY: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"campaignName":"Order Confirmation API","recipients":[{"to":"91XXXXXXXXXX","variables":["John"]}]}'`}
        />

        <Snippet
          icon={<MessageSquare size={16} />}
          title="External Chat Send"
          code={`curl -X POST \\
  ${baseUrl}/external/chat/messages/send-text \\
  -H "X-API-KEY: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"to":"91XXXXXXXXXX","text":"Hi from my CRM","contact":{"tags":["lead"],"attributes":{"source":"crm"}}}'`}
        />

        <Snippet
          icon={<Radio size={16} />}
          title="Realtime Stream"
          code={`TOKEN=$(curl -s -X POST ${baseUrl}/external/chat/realtime/token -H "X-API-KEY: YOUR_KEY")
new EventSource("${baseUrl}/external/chat/realtime/stream?token=STREAM_TOKEN")`}
        />

        <div className="rounded-[5px] border border-slate-100 bg-slate-50 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Webhook Events</div>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
            Save the webhook secret shown once during endpoint creation. Your receiver must verify X-AiWizChat-Signature before processing inbox events.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {events.map((event) => (
              <span key={event} className="rounded-[5px] border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {event}
              </span>
            ))}
          </div>
          <pre className="mt-3 whitespace-pre-wrap rounded-[5px] bg-white p-3 text-xs text-slate-700">{`const expected = "sha256=" + hmac_sha256(secret, timestamp + "." + rawBody)
verify expected === req.header("X-AiWizChat-Signature")`}</pre>
        </div>
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[5px] border border-slate-100 bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="mt-1 break-all text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

function Snippet({ icon, title, code }: { icon: ReactNode; title: string; code: string }) {
  return (
    <div className="rounded-[5px] bg-slate-50 border border-slate-100 p-3 text-xs text-slate-700">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
        {icon}
        {title}
      </div>
      <pre className="whitespace-pre-wrap">{code}</pre>
    </div>
  );
}
