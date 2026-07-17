import { Badge } from "@components/ui/Badge";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import type { CampaignScheduleType, CampaignType } from "@modules/campaigns/types/campaign-form.types";
import type { TemplateRecord } from "@shared/utils/templateRuntime";
import { truncateTemplateName } from "@modules/templates/utils/helpers";

const WEEKDAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "UTC", label: "UTC" },
];

type CampaignBasicsSectionProps = {
  type: CampaignType;
  name: string;
  scheduleType: CampaignScheduleType;
  scheduleDate: string;
  scheduleTime: string;
  scheduleWeekdays: number[];
  scheduleTimezone: string;
  scheduleEndDate: string;
  scheduleMaxOccurrences: string;
  templateId: string;
  approvedTemplates: TemplateRecord[];
  onTypeReset: () => void;
  onNameChange: (value: string) => void;
  onScheduleTypeChange: (value: CampaignScheduleType) => void;
  onScheduleDateChange: (value: string) => void;
  onScheduleTimeChange: (value: string) => void;
  onToggleScheduleWeekday: (value: number) => void;
  onScheduleTimezoneChange: (value: string) => void;
  onScheduleEndDateChange: (value: string) => void;
  onScheduleMaxOccurrencesChange: (value: string) => void;
  onTemplateIdChange: (value: string) => void;
};

function getScheduleSummary(
  type: CampaignScheduleType,
  date: string,
  time: string,
  weekdays: number[]
) {
  if (type === "once" && date && time) return `Send on ${date} at ${time}`;
  if (type === "daily" && time) return `Every day at ${time}`;
  if (type === "weekly" && weekdays.length && time) {
    const labels = WEEKDAYS.filter((day) => weekdays.includes(day.value)).map((day) => day.label);
    return `Every ${labels.join(", ")} at ${time}`;
  }
  return type === "immediate" ? "Send as soon as the campaign is created" : "Complete the schedule fields";
}

export function CampaignBasicsSection({
  type,
  name,
  scheduleType,
  scheduleDate,
  scheduleTime,
  scheduleWeekdays,
  scheduleTimezone,
  scheduleEndDate,
  scheduleMaxOccurrences,
  templateId,
  approvedTemplates,
  onTypeReset,
  onNameChange,
  onScheduleTypeChange,
  onScheduleDateChange,
  onScheduleTimeChange,
  onToggleScheduleWeekday,
  onScheduleTimezoneChange,
  onScheduleEndDateChange,
  onScheduleMaxOccurrencesChange,
  onTemplateIdChange,
}: CampaignBasicsSectionProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <Badge tone="neutral" className="px-3 py-1 capitalize font-black">{type}</Badge>
        <button onClick={onTypeReset} className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:underline">Change Type</button>
      </div>

      <div className="mt-6 space-y-4">
        <Input label="Campaign Name" placeholder="e.g. Summer Sale 2026" value={name} onChange={(event) => onNameChange(event.target.value)} required />
        <Select
          label="Schedule Type"
          value={scheduleType}
          onChange={(event) => onScheduleTypeChange(event.target.value as CampaignScheduleType)}
        >
          <option value="immediate">Send now</option>
          <option value="once">Send Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </Select>

        {scheduleType === "once" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Date" type="date" value={scheduleDate} onChange={(event) => onScheduleDateChange(event.target.value)} required />
            <Input label="Time" type="time" value={scheduleTime} onChange={(event) => onScheduleTimeChange(event.target.value)} required />
          </div>
        ) : null}

        {scheduleType === "daily" ? (
          <Input label="Time" type="time" value={scheduleTime} onChange={(event) => onScheduleTimeChange(event.target.value)} required />
        ) : null}

        {scheduleType === "weekly" ? (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-ink-800/70">Weekdays</div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {WEEKDAYS.map((day) => {
                const selected = scheduleWeekdays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggleScheduleWeekday(day.value)}
                    className={`h-10 rounded-[5px] border text-xs font-black transition-colors ${
                      selected
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-ink-900/10 bg-white text-ink-900 hover:bg-slate-50"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <Input label="Time" type="time" value={scheduleTime} onChange={(event) => onScheduleTimeChange(event.target.value)} required />
          </div>
        ) : null}

        {scheduleType !== "immediate" ? (
          <Select
            label="Timezone"
            value={scheduleTimezone}
            onChange={(event) => onScheduleTimezoneChange(event.target.value)}
          >
            {TIMEZONES.map((zone) => (
              <option key={zone.value} value={zone.value}>{zone.label}</option>
            ))}
          </Select>
        ) : null}

        {scheduleType === "daily" || scheduleType === "weekly" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="End Date (optional)"
              type="date"
              value={scheduleEndDate}
              onChange={(event) => onScheduleEndDateChange(event.target.value)}
            />
            <Input
              label="Max Runs (optional)"
              type="number"
              min={1}
              max={365}
              value={scheduleMaxOccurrences}
              onChange={(event) => onScheduleMaxOccurrencesChange(event.target.value)}
              placeholder="e.g. 10"
            />
          </div>
        ) : null}

        <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 px-4 py-3 text-xs font-semibold text-ink-800/65">
          {getScheduleSummary(scheduleType, scheduleDate, scheduleTime, scheduleWeekdays)}
          {scheduleType !== "immediate" ? ` (${scheduleTimezone})` : ""}
          {scheduleType !== "immediate" && scheduleEndDate ? ` · Ends ${scheduleEndDate}` : ""}
          {scheduleType !== "immediate" && scheduleMaxOccurrences ? ` · Max ${scheduleMaxOccurrences} runs` : ""}
        </div>
      </div>

      <div className="mt-6 space-y-4">
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
