import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import type { CampaignAttributeDefinition, CampaignAttributeFilter, CampaignAudienceMode, CampaignContact } from "@modules/campaigns/types/campaign-form.types";

type CampaignAudienceSectionProps = {
  lockRecipients?: boolean;
  selectedPhones: Record<string, true>;
  audienceMode: CampaignAudienceMode;
  availableTags: string[];
  selectedTags: Record<string, true>;
  tagMatchMode: "any" | "all";
  tagMatchedCount: number;
  contactQuery: string;
  filteredContacts: CampaignContact[];
  onAudienceModeChange: (value: CampaignAudienceMode) => void;
  onContactQueryChange: (value: string) => void;
  onTogglePhone: (phone: string) => void;
  onToggleTag: (tag: string) => void;
  onTagMatchModeChange: (value: "any" | "all") => void;
  attributeDefinitions: CampaignAttributeDefinition[];
  attributeFilters: CampaignAttributeFilter[];
  onAttributeFiltersChange: (filters: CampaignAttributeFilter[]) => void;
};

export function CampaignAudienceSection({
  lockRecipients,
  selectedPhones,
  audienceMode,
  availableTags,
  selectedTags,
  tagMatchMode,
  tagMatchedCount,
  contactQuery,
  filteredContacts,
  onAudienceModeChange,
  onContactQueryChange,
  onTogglePhone,
  onToggleTag,
  onTagMatchModeChange,
  attributeDefinitions,
  attributeFilters,
  onAttributeFiltersChange,
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
            Recipients cannot be changed here. You can change campaign name and template.
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
        <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <Select label="Audience type" value={audienceMode} onChange={(event) => onAudienceModeChange(event.target.value as CampaignAudienceMode)}>
            <option value="manual">Manual</option>
            <option value="tags">By tags</option>
            <option value="attributes">Attribute filters</option>
          </Select>
          {audienceMode === "manual" ? (
            <Input label="Search contacts" value={contactQuery} onChange={(event) => onContactQueryChange(event.target.value)} placeholder="Search name, phone, company, or tag" />
          ) : audienceMode === "tags" ? (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 px-4 py-3">
              <div className="text-xs font-black uppercase tracking-widest text-ink-800/45">Matched contacts</div>
              <div className="mt-1 text-sm font-black text-ink-900">{tagMatchedCount.toLocaleString()} contacts</div>
            </div>
          ) : <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 px-4 py-3 text-xs font-semibold text-ink-800/60">Contacts must match all selected attribute filters.</div>}
        </div>
      ) : null}

      {!lockRecipients && audienceMode === "manual" ? (
        <div className="mt-4 max-h-64 overflow-auto rounded-[5px] border border-ink-900/10 bg-white divide-y divide-ink-900/5">
          {filteredContacts.slice(0, 300).map((contact) => {
            const checked = !!selectedPhones[contact.phone];
            return (
              <label key={contact._id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-ink-900">{contact.name || contact.phone}</div>
                  <div className="mt-0.5 truncate text-xs text-ink-800/65">
                    {contact.phone}
                    {contact.company ? ` - ${contact.company}` : ""}
                  </div>
                  {contact.tags?.length ? (
                    <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-ink-800/40">
                      {contact.tags.join(", ")}
                    </div>
                  ) : null}
                </div>
                <input type="checkbox" checked={checked} onChange={() => onTogglePhone(contact.phone)} />
              </label>
            );
          })}
          {!filteredContacts.length ? <div className="px-4 py-6 text-sm text-ink-800/70">No contacts found.</div> : null}
        </div>
      ) : null}

      {!lockRecipients && audienceMode === "tags" ? (
        <div className="mt-4 max-h-64 overflow-auto rounded-[5px] border border-ink-900/10 bg-white p-3">
          <div className="mb-3 max-w-56">
            <Select
              label="Tag matching"
              value={tagMatchMode}
              onChange={(event) => onTagMatchModeChange(event.target.value as "any" | "all")}
            >
              <option value="all">Match all tags</option>
              <option value="any">Match any tag</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const checked = !!selectedTags[tag];
              return (
                <label
                  key={tag}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-black ring-1 ${
                    checked ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-ink-900 ring-ink-900/10"
                  }`}
                >
                  <input className="sr-only" type="checkbox" checked={checked} onChange={() => onToggleTag(tag)} />
                  {tag}
                </label>
              );
            })}
          </div>
          {!availableTags.length ? <div className="px-1 py-3 text-sm text-ink-800/70">No contact tags found.</div> : null}
          <div className="mt-3 text-xs font-semibold text-ink-800/55">
            {tagMatchMode === "all"
              ? "Contacts must have every selected tag."
              : "Contacts can have any one of the selected tags."}
          </div>
        </div>
      ) : null}
      {!lockRecipients && audienceMode === "attributes" ? <div className="mt-4 space-y-3 rounded-[5px] border border-ink-900/10 bg-white p-3">
        {attributeFilters.map((filter, index) => {
          const definition = attributeDefinitions.find((item) => item.key === filter.key);
          const noValue = filter.operator === "exists" || filter.operator === "not_exists";
          return <div key={index} className="grid gap-2 md:grid-cols-[1fr_150px_1fr_auto]">
            <select className="rounded-[5px] border border-slate-200 px-3 py-2 text-sm" value={filter.key} onChange={(event) => onAttributeFiltersChange(attributeFilters.map((item, itemIndex) => itemIndex === index ? { ...item, key: event.target.value, value: "" } : item))}><option value="">Select attribute</option>{attributeDefinitions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select>
            <select className="rounded-[5px] border border-slate-200 px-3 py-2 text-sm" value={filter.operator} onChange={(event) => onAttributeFiltersChange(attributeFilters.map((item, itemIndex) => itemIndex === index ? { ...item, operator: event.target.value as CampaignAttributeFilter["operator"] } : item))}>{["equals", "not_equals", "exists", "not_exists", ...(definition?.type === "text" ? ["contains"] : [])].map((operator) => <option key={operator} value={operator}>{operator.replace("_", " ")}</option>)}</select>
            <input className="rounded-[5px] border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50" type={definition?.type === "number" ? "number" : definition?.type === "date" ? "date" : "text"} disabled={noValue} value={String(filter.value ?? "")} onChange={(event) => onAttributeFiltersChange(attributeFilters.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} placeholder="Value" />
            <button type="button" className="px-2 font-black text-rose-600" onClick={() => onAttributeFiltersChange(attributeFilters.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
          </div>;
        })}
        <button type="button" className="text-sm font-black text-brand-600" onClick={() => onAttributeFiltersChange([...attributeFilters, { key: attributeDefinitions[0]?.key || "", operator: "equals", value: "" }])}>+ Add filter</button>
        {!attributeDefinitions.length ? <div className="text-sm text-slate-500">Create a visible active attribute first.</div> : null}
      </div> : null}
    </Card>
  );
}
