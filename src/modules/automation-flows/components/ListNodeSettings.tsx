import { Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { configString } from "@modules/automation-flows/configUtils";
import type { FlowNodeConfig } from "@modules/automation-flows/types";

interface ListRow {
  id: string;
  title: string;
  description: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

interface ListNodeSettingsProps {
  config: FlowNodeConfig;
  onChange: (config: FlowNodeConfig) => void;
  onHandleRename: (oldHandle: string, newHandle: string) => void;
}

export function ListNodeSettings({
  config,
  onChange,
  onHandleRename,
}: Readonly<ListNodeSettingsProps>) {
  const sections = Array.isArray(config.sections) ? (config.sections as ListSection[]) : [];

  function updateSection(index: number, section: ListSection) {
    onChange({ ...config, sections: sections.map((item, itemIndex) => itemIndex === index ? section : item) });
  }

  function updateRow(sectionIndex: number, rowIndex: number, next: ListRow) {
    const section = sections[sectionIndex];
    const previous = section.rows[rowIndex];
    if (previous?.id && previous.id !== next.id) onHandleRename(previous.id, next.id);
    updateSection(sectionIndex, {
      ...section,
      rows: section.rows.map((row, index) => index === rowIndex ? next : row),
    });
  }

  return (
    <>
      <Textarea label="Message text" value={configString(config, "text")} onChange={(event) => onChange({ ...config, text: event.target.value })} />
      <Input label="Button text" value={configString(config, "buttonText")} onChange={(event) => onChange({ ...config, buttonText: event.target.value })} maxLength={20} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-ink-800/80">Sections and rows</div>
            <div className="text-[10px] text-slate-400">Row IDs become branch handles.</div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...config, sections: [...sections, { title: `Section ${sections.length + 1}`, rows: [] }] })}>
            <Plus size={14} />
            Section
          </Button>
        </div>
        {sections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`} className="space-y-3 rounded-[5px] border border-slate-200 p-3">
            <div className="flex items-end gap-2">
              <Input label="Section title" value={section.title} onChange={(event) => updateSection(sectionIndex, { ...section, title: event.target.value })} />
              <Button type="button" size="icon" variant="ghost" onClick={() => onChange({ ...config, sections: sections.filter((_, index) => index !== sectionIndex) })} aria-label="Remove section">
                <Trash2 size={15} />
              </Button>
            </div>
            {section.rows.map((row, rowIndex) => (
              <div key={`${row.id}-${rowIndex}`} className="space-y-2 rounded bg-slate-50 p-2">
                <Input label="Row title" value={row.title} onChange={(event) => updateRow(sectionIndex, rowIndex, { ...row, title: event.target.value })} />
                <Input label="Row ID" value={row.id} onChange={(event) => updateRow(sectionIndex, rowIndex, { ...row, id: event.target.value.trim() })} />
                <div className="flex items-end gap-2">
                  <Input label="Description" value={row.description} onChange={(event) => updateRow(sectionIndex, rowIndex, { ...row, description: event.target.value })} />
                  <Button type="button" size="icon" variant="ghost" onClick={() => updateSection(sectionIndex, { ...section, rows: section.rows.filter((_, index) => index !== rowIndex) })} aria-label="Remove row">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={() => updateSection(sectionIndex, { ...section, rows: [...section.rows, { id: `option_${section.rows.length + 1}`, title: `Option ${section.rows.length + 1}`, description: "" }] })}>
              <Plus size={14} />
              Add row
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
