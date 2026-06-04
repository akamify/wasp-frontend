import { Badge } from "@components/ui/Badge";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import type { CampaignScheduleFrequency, CampaignType } from "@modules/campaigns/types/campaign-form.types";
import type { TemplateRecord } from "@shared/utils/templateRuntime";
import { truncateTemplateName } from "@modules/templates/utils/helpers";

type CampaignBasicsSectionProps = {
  type: CampaignType;
  name: string;
  scheduledAt: string;
  scheduleFrequency: CampaignScheduleFrequency;
  templateId: string;
  approvedTemplates: TemplateRecord[];
  onTypeReset: () => void;
  onNameChange: (value: string) => void;
  onScheduledAtChange: (value: string) => void;
  onScheduleFrequencyChange: (value: CampaignScheduleFrequency) => void;
  onTemplateIdChange: (value: string) => void;
};

export function CampaignBasicsSection({
  type,
  name,
  scheduledAt,
  scheduleFrequency,
  templateId,
  approvedTemplates,
  onTypeReset,
  onNameChange,
  onScheduledAtChange,
  onScheduleFrequencyChange,
  onTemplateIdChange,
}: CampaignBasicsSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge tone="neutral" className="px-3 py-1 capitalize font-black">{type}</Badge>
        </div>
        <button onClick={onTypeReset} className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:underline">Change Type</button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-row-2">
        <div className="space-y-4">
          <Input label="Campaign Name" placeholder="e.g. Summer Sale 2026" value={name} onChange={(event) => onNameChange(event.target.value)} required />
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
            <Input label="Schedule (optional)" type="datetime-local" value={scheduledAt} onChange={(event) => onScheduledAtChange(event.target.value)} />
            <Select
              label="Repeat"
              value={scheduleFrequency}
              onChange={(event) => onScheduleFrequencyChange(event.target.value as CampaignScheduleFrequency)}
            >
              <option value="once">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </Select>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-ink-800/40">Select Template</div>
        <Select value={templateId} onChange={(event) => onTemplateIdChange(event.target.value)} required className="mt-1">
          <option value="">Select approved template...</option>
          {approvedTemplates.map((template) => (
            <option key={template._id} value={template._id}>
              {truncateTemplateName(template.name)} ({template.language})
            </option>
          ))}
        </Select>
        <div className="text-[10px] font-bold text-ink-800/40 italic">
          Only approved templates can be used for campaigns.
        </div>
      </div>
    </Card>
  );
}
