import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import type { CampaignContact } from "@modules/campaigns/types/campaign-form.types";

type CampaignAudienceSectionProps = {
  lockRecipients?: boolean;
  selectedPhones: Record<string, true>;
  contactQuery: string;
  filteredContacts: CampaignContact[];
  onContactQueryChange: (value: string) => void;
  onTogglePhone: (phone: string) => void;
};

export function CampaignAudienceSection({
  lockRecipients,
  selectedPhones,
  contactQuery,
  filteredContacts,
  onContactQueryChange,
  onTogglePhone,
}: CampaignAudienceSectionProps) {
  const selectedPhoneList = Object.keys(selectedPhones || {});

  return (
    <Card className="p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Audience</div>
      <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">
        {lockRecipients ? "Selected failed recipients" : "Select contacts"}
      </div>
      {lockRecipients ? (
        <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-slate-50 p-4">
          <div className="text-sm font-black text-ink-900">{selectedPhoneList.length.toLocaleString()} recipients locked</div>
          <div className="mt-1 text-xs text-ink-800/70">
            Recipients canâ€™t be changed here. You can change campaign name and template.
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedPhoneList.slice(0, 10).map((phone) => (
              <span key={phone} className="rounded-full bg-white px-3 py-1 text-[10px] font-black tracking-widest text-ink-900 ring-1 ring-ink-900/10">
                +{phone}
              </span>
            ))}
            {selectedPhoneList.length > 10 ? (
              <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black tracking-widest text-ink-900 ring-1 ring-ink-900/10">
                +{selectedPhoneList.length - 10} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {!lockRecipients ? (
        <div className="mt-4">
          <Input label="Search contacts" value={contactQuery} onChange={(event) => onContactQueryChange(event.target.value)} placeholder="Search name or phone" />
        </div>
      ) : null}
      {!lockRecipients ? (
        <div className="mt-4 max-h-64 overflow-auto rounded-[5px] border border-ink-900/10 bg-white divide-y divide-ink-900/5">
          {filteredContacts.slice(0, 300).map((contact) => {
            const checked = !!selectedPhones[contact.phone];
            return (
              <label key={contact._id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-900">{contact.name || contact.phone}</div>
                  <div className="mt-0.5 truncate text-xs text-ink-800/65">{contact.phone}{contact.company ? ` â€¢ ${contact.company}` : ""}</div>
                </div>
                <input type="checkbox" checked={checked} onChange={() => onTogglePhone(contact.phone)} />
              </label>
            );
          })}
          {!filteredContacts.length ? <div className="px-4 py-6 text-sm text-ink-800/70">No contacts found.</div> : null}
        </div>
      ) : null}
    </Card>
  );
}
