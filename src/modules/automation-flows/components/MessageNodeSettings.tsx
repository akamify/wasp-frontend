import { Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { Textarea } from "@components/ui/Textarea";
import { CsvField } from "@modules/automation-flows/components/CsvField";
import {
  configBoolean,
  configString,
  configStrings,
} from "@modules/automation-flows/configUtils";
import type { FlowNodeConfig, FlowNodeType } from "@modules/automation-flows/types";

interface MessageNodeSettingsProps {
  type: FlowNodeType;
  config: FlowNodeConfig;
  onChange: (config: FlowNodeConfig) => void;
  onHandleRename: (oldHandle: string, newHandle: string) => void;
}

interface ReplyButton {
  id: string;
  title: string;
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
  onChange,
  onHandleRename,
}: Readonly<MessageNodeSettingsProps>) {
  if (type === "text_buttons") {
    return <TextButtonsSettings config={config} onChange={onChange} onHandleRename={onHandleRename} />;
  }
  if (type === "text") {
    return (
      <>
        <Textarea label="Message text" value={configString(config, "text")} onChange={(event) => onChange({ ...config, text: event.target.value })} />
        <AutoContinue checked={configBoolean(config, "autoContinue")} onChange={(checked) => onChange({ ...config, autoContinue: checked })} />
      </>
    );
  }
  if (type === "ask_question") {
    return (
      <>
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
    return (
      <>
        <Input label="Template name" value={configString(config, "templateName")} onChange={(event) => onChange({ ...config, templateName: event.target.value })} />
        <Input label="Language code" value={configString(config, "languageCode", "en")} onChange={(event) => onChange({ ...config, languageCode: event.target.value })} />
        <CsvField label="Variables" value={configStrings(config, "variables")} onChange={(variables) => onChange({ ...config, variables })} placeholder="{{contact.name}}, {{context.orderId}}" />
        <AutoContinue checked={configBoolean(config, "autoContinue")} onChange={(checked) => onChange({ ...config, autoContinue: checked })} />
      </>
    );
  }
  return (
    <Textarea
      label="Ending message"
      value={configString(config, "message")}
      onChange={(event) => onChange({ ...config, message: event.target.value })}
      hint="Optional message sent before completing the flow."
    />
  );
}
