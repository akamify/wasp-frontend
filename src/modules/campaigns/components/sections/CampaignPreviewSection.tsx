import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Input } from "@components/ui/Input";
import type { ComponentProps } from "react";
import { TemplatePreview } from "@modules/templates/components/TemplatePreview";
import type { CampaignType } from "@modules/campaigns/types/campaign-form.types";
import type { TemplateRecord } from "@shared/utils/templateRuntime";

type CampaignPreviewSectionProps = {
  selectedTemplate: TemplateRecord | undefined;
  templatePreviewProps: ComponentProps<typeof TemplatePreview>;
  demoTo: string;
  demoBusy: boolean;
  templateId: string;
  type: CampaignType | null;
  csvFirstRow: Record<string, string> | null;
  onDemoToChange: (value: string) => void;
  onDemoSend: () => Promise<void>;
  onDemoBusyChange: (busy: boolean) => void;
  onDemoError: (error: unknown) => void;
};

export function CampaignPreviewSection({
  selectedTemplate,
  templatePreviewProps,
  demoTo,
  demoBusy,
  templateId,
  type,
  csvFirstRow,
  onDemoToChange,
  onDemoSend,
  onDemoBusyChange,
  onDemoError,
}: CampaignPreviewSectionProps) {
  return (
    <div className="self-start md:sticky md:top-3">
      <Card className="p-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-800/50">Preview</div>
        <div className="mt-1 text-2xl font-black tracking-tight text-ink-900">Message</div>
        <div className="mt-4">
          {selectedTemplate ? (
            <TemplatePreview {...templatePreviewProps} />
          ) : (
            <div className="rounded-[5px] border border-ink-900/10 bg-slate-50 px-5 py-4 text-sm text-ink-800/70">
              Select a template to see a real-time preview.
            </div>
          )}
        </div>
        <div className="mt-5 grid gap-3">
          <Input label="Demo WhatsApp number" value={demoTo} onChange={(event) => onDemoToChange(event.target.value)} placeholder="919999999999" />
          <Button
            type="button"
            variant="ghost"
            className="rounded-[7px] bg-white border border-ink-900/10"
            disabled={demoBusy || !templateId || (type === "csv" && !csvFirstRow)}
            onClick={async () => {
              onDemoBusyChange(true);
              try {
                await onDemoSend();
              } catch (error) {
                onDemoError(error);
              } finally {
                onDemoBusyChange(false);
              }
            }}
          >
            {demoBusy ? "Sending..." : "Demo Send"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
