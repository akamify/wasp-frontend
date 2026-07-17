import { CsvField } from "@modules/automation-flows/components/CsvField";
import { KeyValueEditor } from "@modules/automation-flows/components/KeyValueEditor";
import { TemplateSettings } from "@modules/automation-flows/components/MessageNodeSettings";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { NODE_META, nodePreview } from "@modules/automation-flows/nodeCatalog";
import type {
  BuilderNode,
  FlowNodeConfig,
  FlowRuntimeSettings,
  FlowTrigger,
  TriggerType,
} from "@modules/automation-flows/types";

interface FlowSettingsPanelProps {
  trigger: FlowTrigger;
  nodes: BuilderNode[];
  fallbackNodeId: string | null;
  handoverNodeId: string | null;
  runtimeSettings: FlowRuntimeSettings;
  onTriggerChange: (trigger: FlowTrigger) => void;
  onFallbackChange: (nodeId: string | null) => void;
  onHandoverChange: (nodeId: string | null) => void;
  onRuntimeSettingsChange: (settings: FlowRuntimeSettings) => void;
}

const TRIGGER_HELP: Record<Exclude<TriggerType, null>, string> = {
  keyword: "Keyword trigger starts flow when user sends matching text.",
  template_button: "Template button trigger starts flow when user clicks a configured button payload.",
  ctwa: "CTWA trigger starts flow from a configured click-to-WhatsApp payload.",
  manual: "Manual trigger means flow can only be started manually from contact or conversation pages.",
};

export function FlowSettingsPanel({
  trigger,
  nodes,
  fallbackNodeId,
  handoverNodeId,
  runtimeSettings,
  onTriggerChange,
  onFallbackChange,
  onHandoverChange,
  onRuntimeSettingsChange,
}: Readonly<FlowSettingsPanelProps>) {
  const timeoutUnit =
    runtimeSettings.sessionTimeoutMinutes >= 60 &&
    runtimeSettings.sessionTimeoutMinutes % 60 === 0
      ? "hours"
      : "minutes";
  const timeoutValue =
    timeoutUnit === "hours"
      ? runtimeSettings.sessionTimeoutMinutes / 60
      : runtimeSettings.sessionTimeoutMinutes;
  const timeoutHelp =
    "Flow session timeout can be set up to 10 hours. WhatsApp's customer service window is 24 hours, so we keep a safety buffer for retries, delays, and expiry handling.";

  function updateExpiry(
    updates: Partial<FlowRuntimeSettings["onSessionExpired"]>
  ) {
    onRuntimeSettingsChange({
      ...runtimeSettings,
      onSessionExpired: {
        ...runtimeSettings.onSessionExpired,
        ...updates,
      },
    });
  }

  function nodeLabel(node: BuilderNode) {
    const title = NODE_META[node.data.nodeType].label;
    const preview = nodePreview(node.data.nodeType, node.data.config);
    return `${title} - ${preview.slice(0, 42)}`;
  }

  function apiContextKeys() {
    const keys = new Set<string>();
    for (const node of nodes) {
      if (node.data.nodeType !== "api_request") continue;
      const mapping = node.data.config.responseMapping;
      if (!mapping || typeof mapping !== "object" || Array.isArray(mapping)) continue;
      Object.keys(mapping).forEach((key) => {
        if (key.trim()) keys.add(key.trim());
      });
    }
    return Array.from(keys).sort();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-black text-slate-900">Flow Settings</h2>
        <p className="mt-1 text-xs font-medium text-slate-400">Configure entry and fallback behavior.</p>
      </div>
      <Select
        label="Trigger type"
        value={trigger.type || ""}
        onChange={(event) => onTriggerChange({ ...trigger, type: (event.target.value || null) as TriggerType })}
      >
        <option value="">Select trigger...</option>
        <option value="keyword">Keyword</option>
        <option value="template_button">Template button</option>
        <option value="ctwa">Click-to-WhatsApp</option>
        <option value="manual">Manual</option>
      </Select>
      {trigger.type ? (
        <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
          {TRIGGER_HELP[trigger.type]}
        </p>
      ) : null}
      {trigger.type === "keyword" ? (
        <>
          <Select label="Match mode" value={trigger.matchMode} onChange={(event) => onTriggerChange({ ...trigger, matchMode: event.target.value as FlowTrigger["matchMode"] })}>
            <option value="exact">Exact</option>
            <option value="contains">Contains</option>
            <option value="regex">Regular expression</option>
          </Select>
          <CsvField label="Keywords" value={trigger.keywords} onChange={(keywords) => onTriggerChange({ ...trigger, keywords })} placeholder="hello, pricing, support" />
        </>
      ) : null}
      {trigger.type === "template_button" ? (
        <CsvField label="Template button payloads" value={trigger.templateButtonPayloads} onChange={(templateButtonPayloads) => onTriggerChange({ ...trigger, templateButtonPayloads })} placeholder="GET_STARTED, TRACK_ORDER" />
      ) : null}
      {trigger.type === "ctwa" ? (
        <CsvField label="CTWA payloads" value={trigger.ctwaPayloads} onChange={(ctwaPayloads) => onTriggerChange({ ...trigger, ctwaPayloads })} placeholder="campaign_payload" />
      ) : null}
      <Select label="Fallback node" value={fallbackNodeId || ""} onChange={(event) => onFallbackChange(event.target.value || null)}>
        <option value="">No fallback node</option>
        {nodes.filter((node) => node.data.nodeType === "fallback").map((node) => (
          <option key={node.id} value={node.id}>{nodeLabel(node)}</option>
        ))}
      </Select>
      <Select label="Handover node" value={handoverNodeId || ""} onChange={(event) => onHandoverChange(event.target.value || null)}>
        <option value="">No handover node</option>
        {nodes.filter((node) => node.data.nodeType === "request_intervention").map((node) => (
          <option key={node.id} value={node.id}>{nodeLabel(node)}</option>
        ))}
      </Select>
      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Session expiry
        </h3>
        <div className="mt-3 grid grid-cols-[1fr_110px] gap-2">
          <Input
            label="Session timeout"
            type="number"
            min={1}
            max={timeoutUnit === "hours" ? 10 : 600}
            value={timeoutValue}
            onChange={(event) => {
              const value = Math.max(1, Number(event.target.value) || 1);
              const minutes = timeoutUnit === "hours" ? value * 60 : value;
              onRuntimeSettingsChange({
                ...runtimeSettings,
                sessionTimeoutMinutes: Math.min(600, minutes),
              });
            }}
          />
          <Select
            label="Unit"
            value={timeoutUnit}
            onChange={(event) => {
              const unit = event.target.value;
              onRuntimeSettingsChange({
                ...runtimeSettings,
                sessionTimeoutMinutes:
                  unit === "hours"
                    ? Math.min(600, Math.max(60, timeoutValue * 60))
                    : Math.min(600, Math.max(1, timeoutValue)),
              });
            }}
          >
            <option value="minutes">Minutes</option>
            <option value="hours">Hours</option>
          </Select>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-slate-500">
          {timeoutHelp}
        </p>
        {runtimeSettings.sessionTimeoutMinutes < 1 ||
        runtimeSettings.sessionTimeoutMinutes > 600 ? (
          <p className="mt-1 text-[11px] font-semibold text-red-600">
            Timeout must be between 1 minute and 10 hours.
          </p>
        ) : null}
      </div>
      <label className="flex items-start gap-3 rounded-[5px] border border-slate-200 p-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-brand-600"
          checked={runtimeSettings.allowKeywordRestartWhenWaiting}
          onChange={(event) =>
            onRuntimeSettingsChange({
              ...runtimeSettings,
              allowKeywordRestartWhenWaiting: event.target.checked,
            })
          }
        />
        <span>
          <span className="block text-xs font-bold text-slate-800">
            Allow keyword restart while waiting
          </span>
          <span className="mt-1 block text-[11px] leading-4 text-slate-500">
            If the user sends the trigger keyword again while waiting for a button or answer, restart the flow instead of showing fallback.
          </span>
        </span>
      </label>
      <div className="grid grid-cols-[120px_1fr] gap-2">
        <Input
          label="Invalid replies"
          type="number"
          min={1}
          max={10}
          value={runtimeSettings.maxInvalidReplies || 2}
          onChange={(event) =>
            onRuntimeSettingsChange({
              ...runtimeSettings,
              maxInvalidReplies: Math.min(
                10,
                Math.max(1, Number(event.target.value) || 1)
              ),
            })
          }
        />
        <Input
          label="Invalid reply message"
          value={
            runtimeSettings.invalidReplyMessage ||
            "Please choose one of the available options."
          }
          onChange={(event) =>
            onRuntimeSettingsChange({
              ...runtimeSettings,
              invalidReplyMessage: event.target.value,
            })
          }
        />
      </div>
      <Select
        label="On session expired"
        value={runtimeSettings.onSessionExpired.action}
        onChange={(event) =>
          updateExpiry({
            action: event.target
              .value as FlowRuntimeSettings["onSessionExpired"]["action"],
          })
        }
      >
        <option value="none">Do nothing</option>
        <option value="text">Send text message</option>
        <option value="template">Send template message</option>
      </Select>
      <KeyValueEditor
        label="Static variables"
        value={runtimeSettings.staticVariables || {}}
        onChange={(staticVariables) =>
          onRuntimeSettingsChange({
            ...runtimeSettings,
            staticVariables,
          })
        }
        keyPlaceholder="companyName"
        valuePlaceholder="Amila Gold"
      />
      <p className="text-[11px] leading-4 text-slate-500">
        Avoid storing API secrets here. Values with token/key/secret/password in the key are masked in logs only; use a backend secret store when available.
      </p>
      {runtimeSettings.onSessionExpired.action === "text" ? (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-800/80">
            Expiry text message
          </span>
          <textarea
            rows={4}
            value={runtimeSettings.onSessionExpired.textMessage}
            onChange={(event) => updateExpiry({ textMessage: event.target.value })}
            className="w-full rounded-[5px] bg-white px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-900/12 focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <span className="mt-1 block text-[11px] leading-4 text-slate-500">
            Expiry text is static. Use template expiry action for dynamic WhatsApp variables.
          </span>
        </label>
      ) : null}
      {runtimeSettings.onSessionExpired.action === "template" ? (
        <div className="space-y-3">
          <TemplateSettings
            config={runtimeSettings.onSessionExpired as unknown as FlowNodeConfig}
            availableContextKeys={apiContextKeys()}
            onChange={(config) =>
              updateExpiry({
                templateName: String(config.templateName || ""),
                languageCode: String(config.languageCode || "en"),
                variables: Array.isArray(config.variables)
                  ? config.variables.map((value) => String(value))
                  : [],
                templateConfig: config.templateConfig as FlowRuntimeSettings["onSessionExpired"]["templateConfig"],
              })
            }
          />
          {!runtimeSettings.onSessionExpired.templateName.trim() ? (
            <p className="text-[11px] font-semibold text-amber-700">
              Select or enter an approved template before publishing.
            </p>
          ) : null}
        </div>
      ) : null}
      {runtimeSettings.onSessionExpired.action !== "none" ? (
        <p className="rounded-[5px] bg-amber-50 p-3 text-[11px] font-medium leading-5 text-amber-800">
          Outside the 24-hour WhatsApp window, expiry notifications require an approved template.
        </p>
      ) : null}
    </div>
  );
}
