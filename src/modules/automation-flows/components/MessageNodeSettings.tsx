import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import {
  listApprovedTemplates,
  listContactAttributeOptions,
  type ApprovedFlowTemplate,
  type ContactAttributeOption,
} from "@modules/automation-flows/automationDataApi";
import {
  configBoolean,
  configString,
} from "@modules/automation-flows/configUtils";
import type {
  FlowNodeConfig,
  FlowNodeType,
  FlowTemplateConfig,
  TemplateComponentMapping,
  TemplateVariableMapping,
  TemplateVariableSourceType,
} from "@modules/automation-flows/types";

interface MessageNodeSettingsProps {
  type: FlowNodeType;
  config: FlowNodeConfig;
  availableContextKeys?: string[];
  flowId?: string;
  nodeId?: string;
  onChange: (config: FlowNodeConfig) => void;
  onHandleRename: (oldHandle: string, newHandle: string) => void;
}

interface ReplyButton {
  id: string;
  title: string;
}

const CONTACT_FIELDS = ["name", "phone", "email", "language"];
const WORKSPACE_FIELDS = ["name", "businessName", "supportPhone"];

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function placeholderIndexes(text: unknown) {
  const indexes = new Set<number>();
  for (const match of String(text || "").matchAll(/\{\{(\d+)\}\}/g)) {
    const index = Number(match[1]);
    if (Number.isFinite(index) && index > 0) indexes.add(index);
  }
  return Array.from(indexes).sort((a, b) => a - b);
}

function defaultMapping(index: number, buttonIndex?: number): TemplateVariableMapping {
  return {
    index,
    sourceType: "static",
    sourceKey: "",
    value: "",
    fallback: "",
    ...(buttonIndex !== undefined ? { buttonIndex } : {}),
  };
}

function mappingsFromTemplate(template: ApprovedFlowTemplate): FlowTemplateConfig {
  const components: TemplateComponentMapping[] = [];
  for (const rawComponent of template.components || []) {
    const component = asObject(rawComponent);
    const type = String(component.type || "").toLowerCase();
    if (type === "header") {
      const variables = placeholderIndexes(component.text).map((index) => defaultMapping(index));
      if (variables.length) components.push({ type: "header", label: "Header", variables });
    }
    if (type === "body") {
      const variables = placeholderIndexes(component.text).map((index) => defaultMapping(index));
      if (variables.length) components.push({ type: "body", label: "Body", variables });
    }
    if (type === "buttons") {
      const buttons = Array.isArray(component.buttons) ? component.buttons : [];
      buttons.forEach((rawButton, buttonIndex) => {
        const button = asObject(rawButton);
        const variables = placeholderIndexes(button.url).map((index) =>
          defaultMapping(index, buttonIndex)
        );
        if (variables.length) {
          components.push({
            type: "button",
            label: `Button URL ${buttonIndex + 1}`,
            buttonIndex,
            variables,
          });
        }
      });
    }
  }
  return {
    templateName: template.name,
    languageCode: template.languageCode || "en",
    components,
  };
}

function selectedTemplateKey(template: ApprovedFlowTemplate) {
  return `${template.name}::${template.languageCode || ""}`;
}

function AutoContinue({
  checked,
  onChange,
}: Readonly<{ checked: boolean; onChange: (checked: boolean) => void }>) {
  return (
    <label className="flex items-center justify-between rounded-[5px] border border-slate-200 p-3">
      <div>
        <div className="text-xs font-bold text-slate-700">Auto continue</div>
        <div className="mt-0.5 text-[10px] font-medium text-slate-400">Follow the default edge after sending.</div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-emerald-600"
      />
    </label>
  );
}

function PlainMessageNotice({ children }: Readonly<{ children: string }>) {
  return (
    <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
      {children}
    </p>
  );
}

function TemplateMappingEditor({
  value,
  availableContextKeys,
  attributeOptions,
  onChange,
}: Readonly<{
  value: FlowTemplateConfig;
  availableContextKeys: string[];
  attributeOptions: ContactAttributeOption[];
  onChange: (value: FlowTemplateConfig) => void;
}>) {
  const sourceOptions = useMemo(
    () => ({
      contact_field: CONTACT_FIELDS,
      contact_attribute: attributeOptions.map((attribute) => attribute.key),
      api_context: availableContextKeys,
      workspace_field: WORKSPACE_FIELDS,
    }),
    [availableContextKeys, attributeOptions]
  );

  function updateVariable(
    componentIndex: number,
    variableIndex: number,
    patch: Partial<TemplateVariableMapping>
  ) {
    const components = value.components.map((component, currentComponentIndex) => {
      if (currentComponentIndex !== componentIndex) return component;
      return {
        ...component,
        variables: component.variables.map((variable, currentVariableIndex) =>
          currentVariableIndex === variableIndex
            ? { ...variable, ...patch }
            : variable
        ),
      };
    });
    onChange({ ...value, components });
  }

  if (!value.components.length) {
    return (
      <p className="rounded-[5px] border border-slate-200 bg-slate-50 p-3 text-[11px] leading-5 text-slate-500">
        This approved template has no mapped text variables.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-ink-800/80">Template variables</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          Map each WhatsApp template variable from static values, contact fields, attributes, API data, or workspace fields.
        </p>
      </div>
      {value.components.map((component, componentIndex) => (
        <div key={`${component.type}-${componentIndex}`} className="space-y-2 rounded-[5px] border border-slate-200 p-3">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            {component.label || component.type}
          </div>
          {component.variables.map((variable, variableIndex) => {
            const optionList = sourceOptions[variable.sourceType as keyof typeof sourceOptions] || [];
            return (
              <div key={`${component.type}-${variable.index}-${variableIndex}`} className="space-y-2 rounded-[5px] bg-slate-50 p-2">
                <div className="text-[11px] font-bold text-slate-700">
                  {component.type === "button" ? "Button URL" : component.type} {"{{"}{variable.index}{"}}"}
                </div>
                <Select
                  label="Source type"
                  value={variable.sourceType}
                  onChange={(event) =>
                    updateVariable(componentIndex, variableIndex, {
                      sourceType: event.target.value as TemplateVariableSourceType,
                      sourceKey: "",
                      value: "",
                    })
                  }
                >
                  <option value="static">Static value</option>
                  <option value="contact_field">Contact field</option>
                  <option value="contact_attribute">Contact attribute</option>
                  <option value="api_context">API / Dynamic data</option>
                  <option value="workspace_field">Workspace field</option>
                </Select>
                {variable.sourceType === "static" ? (
                  <Input
                    label="Static value"
                    value={variable.value || variable.sourceKey || ""}
                    onChange={(event) =>
                      updateVariable(componentIndex, variableIndex, {
                        value: event.target.value,
                        sourceKey: event.target.value,
                      })
                    }
                  />
                ) : optionList.length ? (
                  <Select
                    label="Source key"
                    value={variable.sourceKey}
                    onChange={(event) =>
                      updateVariable(componentIndex, variableIndex, {
                        sourceKey: event.target.value,
                      })
                    }
                  >
                    <option value="">Select source...</option>
                    {optionList.map((option) => (
                      <option key={option} value={option}>
                        {variable.sourceType === "contact_attribute"
                          ? `${attributeOptions.find((item) => item.key === option)?.label || option} / ${option}`
                          : option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    label="Source key"
                    value={variable.sourceKey}
                    onChange={(event) =>
                      updateVariable(componentIndex, variableIndex, {
                        sourceKey: event.target.value,
                      })
                    }
                    placeholder={variable.sourceType === "api_context" ? "productName" : "sourceKey"}
                    hint={variable.sourceType === "api_context" ? "No API data mapped yet. Add an API Request node and map response fields, or enter a key manually." : undefined}
                  />
                )}
                <Input
                  label="Fallback value"
                  value={variable.fallback}
                  onChange={(event) =>
                    updateVariable(componentIndex, variableIndex, {
                      fallback: event.target.value,
                    })
                  }
                  placeholder="Optional"
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function TemplateSettings({
  config,
  availableContextKeys,
  onChange,
}: Readonly<{
  config: FlowNodeConfig;
  availableContextKeys: string[];
  onChange: (config: FlowNodeConfig) => void;
}>) {
  const [templates, setTemplates] = useState<ApprovedFlowTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [attributes, setAttributes] = useState<ContactAttributeOption[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [attributesError, setAttributesError] = useState("");
  const selectedKey = `${configString(config, "templateName")}::${configString(config, "languageCode")}`;
  const templateConfigRecord = asObject(config.templateConfig);
  const templateConfig = {
    templateName: configString(config, "templateName"),
    languageCode: configString(config, "languageCode", "en"),
    components: [],
    ...templateConfigRecord,
  };

  async function loadTemplates(isActive = () => true) {
    setLoadingTemplates(true);
    setTemplateError("");
    return listApprovedTemplates()
      .then((items) => {
        if (isActive()) setTemplates(items);
      })
      .catch((error: unknown) => {
        if (!isActive()) return;
        const message = error instanceof Error ? error.message : "Unable to load templates";
        setTemplateError(message);
      })
      .finally(() => {
        if (isActive()) setLoadingTemplates(false);
      });
  }

  async function loadAttributes(isActive = () => true) {
    setLoadingAttributes(true);
    setAttributesError("");
    return listContactAttributeOptions()
      .then((items) => {
        if (isActive()) setAttributes(items);
      })
      .catch((error: unknown) => {
        if (!isActive()) return;
        const message = error instanceof Error ? error.message : "Could not load attributes.";
        setAttributesError(message);
      })
      .finally(() => {
        if (isActive()) setLoadingAttributes(false);
      });
  }

  useEffect(() => {
    let active = true;
    void loadTemplates(() => active);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadAttributes(() => active);
    return () => {
      active = false;
    };
  }, []);

  function selectTemplate(value: string) {
    const template = templates.find((item) => selectedTemplateKey(item) === value);
    if (!template) return;
    const nextTemplateConfig = mappingsFromTemplate(template);
    onChange({
      ...config,
      templateName: nextTemplateConfig.templateName,
      languageCode: nextTemplateConfig.languageCode,
      templateConfig: nextTemplateConfig,
      variables: [],
    });
  }

  function updateTemplateConfig(nextTemplateConfig: FlowTemplateConfig) {
    onChange({
      ...config,
      templateName: nextTemplateConfig.templateName,
      languageCode: nextTemplateConfig.languageCode,
      templateConfig: nextTemplateConfig,
    });
  }

  return (
    <>
      <PlainMessageNotice>
        Select an approved WhatsApp template, then map each variable from static values, contact fields, attributes, or API data.
      </PlainMessageNotice>
      <Select
        label="Approved template"
        value={selectedKey}
        onChange={(event) => selectTemplate(event.target.value)}
      >
        <option value="">Select approved template...</option>
        {templates.map((template) => (
          <option key={selectedTemplateKey(template)} value={selectedTemplateKey(template)}>
            {template.name} | {template.languageCode || "en"} | {template.category || "template"} | APPROVED
          </option>
        ))}
      </Select>
      {loadingTemplates ? <p className="text-[11px] text-slate-400">Loading approved templates...</p> : null}
      {!loadingTemplates && !templateError && templates.length === 0 ? (
        <p className="text-[11px] font-semibold text-amber-700">No approved templates found.</p>
      ) : null}
      {templateError ? (
        <div className="flex items-center justify-between gap-2 rounded-[5px] bg-amber-50 p-2 text-[11px] font-semibold text-amber-800">
          <span>Could not load templates. {templateError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void loadTemplates()}>
            Retry
          </Button>
        </div>
      ) : null}
      {loadingAttributes ? <p className="text-[11px] text-slate-400">Loading attributes...</p> : null}
      {!loadingAttributes && !attributesError && attributes.length === 0 ? (
        <p className="text-[11px] text-slate-400">No attributes created yet.</p>
      ) : null}
      {attributesError ? (
        <div className="flex items-center justify-between gap-2 rounded-[5px] bg-amber-50 p-2 text-[11px] font-semibold text-amber-800">
          <span>Could not load attributes. {attributesError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void loadAttributes()}>
            Retry
          </Button>
        </div>
      ) : null}
      <Input label="Template name" value={configString(config, "templateName")} onChange={(event) => onChange({ ...config, templateName: event.target.value })} />
      <Input label="Language code" value={configString(config, "languageCode", "en")} onChange={(event) => onChange({ ...config, languageCode: event.target.value })} />
      <TemplateMappingEditor
        value={{
          templateName: templateConfig.templateName || configString(config, "templateName"),
          languageCode: templateConfig.languageCode || configString(config, "languageCode", "en"),
          components: Array.isArray(templateConfig.components) ? templateConfig.components : [],
        }}
        availableContextKeys={availableContextKeys}
        attributeOptions={attributes}
        onChange={updateTemplateConfig}
      />
      <AutoContinue checked={configBoolean(config, "autoContinue")} onChange={(checked) => onChange({ ...config, autoContinue: checked })} />
    </>
  );
}

function TextButtonsSettings({
  config,
  onChange,
  onHandleRename,
}: Omit<MessageNodeSettingsProps, "type">) {
  const buttons = Array.isArray(config.buttons)
    ? (config.buttons as ReplyButton[])
    : [];

  function updateButton(index: number, next: ReplyButton) {
    const previous = buttons[index];
    const updated = buttons.map((button, buttonIndex) => buttonIndex === index ? next : button);
    if (previous?.id && previous.id !== next.id) onHandleRename(previous.id, next.id);
    onChange({ ...config, buttons: updated });
  }

  return (
    <>
      <Textarea
        label="Message text"
        value={configString(config, "text")}
        onChange={(event) => onChange({ ...config, text: event.target.value })}
        placeholder="Choose an option below."
      />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-ink-800/80">Reply buttons</div>
            <div className="text-[10px] text-slate-400">Maximum 3 buttons. IDs must be unique.</div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={buttons.length >= 3}
            onClick={() =>
              onChange({
                ...config,
                buttons: [
                  ...buttons,
                  { id: `button_${buttons.length + 1}`, title: `Option ${buttons.length + 1}` },
                ],
              })
            }
          >
            <Plus size={14} />
            Add
          </Button>
        </div>
        {buttons.map((button, index) => (
          <div key={`${button.id}-${index}`} className="space-y-2 rounded-[5px] border border-slate-200 p-3">
            <Input
              label="Button title"
              value={button.title}
              onChange={(event) => updateButton(index, { ...button, title: event.target.value })}
              maxLength={20}
            />
            <div className="flex items-end gap-2">
              <Input
                label="Button ID / payload"
                value={button.id}
                onChange={(event) => updateButton(index, { ...button, id: event.target.value.trim() })}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onChange({ ...config, buttons: buttons.filter((_, itemIndex) => itemIndex !== index) })}
                aria-label="Remove button"
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function MessageNodeSettings({
  type,
  config,
  availableContextKeys = [],
  onChange,
  onHandleRename,
}: Readonly<MessageNodeSettingsProps>) {
  if (type === "text_buttons") {
    return (
      <>
        <PlainMessageNotice>
          Buttons and message text are static. Use Template Message node if you need variables.
        </PlainMessageNotice>
        <TextButtonsSettings config={config} onChange={onChange} onHandleRename={onHandleRename} />
      </>
    );
  }
  if (type === "text") {
    return (
      <>
        <PlainMessageNotice>
          Variables are not supported here. Use Template Message node for dynamic WhatsApp variables.
        </PlainMessageNotice>
        <Textarea label="Message text" value={configString(config, "text")} onChange={(event) => onChange({ ...config, text: event.target.value })} />
        <AutoContinue checked={configBoolean(config, "autoContinue")} onChange={(checked) => onChange({ ...config, autoContinue: checked })} />
      </>
    );
  }
  if (type === "ask_question") {
    return (
      <>
        <PlainMessageNotice>
          Question text is static. Save the answer, then use it in API requests or Template Message variable mapping.
        </PlainMessageNotice>
        <Textarea label="Question" value={configString(config, "question")} onChange={(event) => onChange({ ...config, question: event.target.value })} />
        <Select label="Input type" value={configString(config, "inputType", "text")} onChange={(event) => onChange({ ...config, inputType: event.target.value })}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </Select>
        <Input label="Save to attribute" value={configString(config, "saveToAttribute")} onChange={(event) => onChange({ ...config, saveToAttribute: event.target.value })} hint="Example: orderId, city, email" />
      </>
    );
  }
  if (type === "media") {
    return (
      <>
        <PlainMessageNotice>
          Media captions and URLs are static. Use Template Message node for dynamic WhatsApp variables.
        </PlainMessageNotice>
        <Select label="Media type" value={configString(config, "mediaType", "image")} onChange={(event) => onChange({ ...config, mediaType: event.target.value })}>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="document">Document</option>
          <option value="audio">Audio</option>
        </Select>
        <Input label="Media URL" value={configString(config, "mediaUrl")} onChange={(event) => onChange({ ...config, mediaUrl: event.target.value })} placeholder="https://..." />
        <Textarea label="Caption" value={configString(config, "caption")} onChange={(event) => onChange({ ...config, caption: event.target.value })} />
        {configString(config, "mediaType") === "document" ? (
          <Input label="Filename" value={configString(config, "filename")} onChange={(event) => onChange({ ...config, filename: event.target.value })} />
        ) : null}
        <AutoContinue checked={configBoolean(config, "autoContinue")} onChange={(checked) => onChange({ ...config, autoContinue: checked })} />
      </>
    );
  }
  if (type === "template") {
    return <TemplateSettings config={config} availableContextKeys={availableContextKeys} onChange={onChange} />;
  }
  return (
    <>
      <PlainMessageNotice>
        End messages are static. Use Template Message node before End Flow if you need variables.
      </PlainMessageNotice>
      <Textarea
        label="Ending message"
        value={configString(config, "message")}
        onChange={(event) => onChange({ ...config, message: event.target.value })}
        hint="Optional message sent before completing the flow."
      />
    </>
  );
}
