export function CampaignApiInfoSection() {
  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 p-6">
      <div className="text-sm font-black text-ink-900">API campaigns</div>
      <div className="mt-2 text-sm text-ink-800/70">
        API campaigns store only a name + template mapping. Contacts come from your integration when you call the send endpoint.
      </div>
    </div>
  );
}
