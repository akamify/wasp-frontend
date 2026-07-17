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

const LIST_LIMITS = {
  body: 1024,
  buttonText: 20,
  sections: 10,
  rows: 10,
  sectionTitle: 24,
  rowTitle: 24,
  rowDescription: 72,
  rowId: 200,
};

export function ListNodeSettings({
  config,
  onChange,
  onHandleRename,
}: Readonly<ListNodeSettingsProps>) {
  const sections = Array.isArray(config.sections) ? (config.sections as ListSection[]) : [];
  const totalRows = sections.reduce((count, section) => count + section.rows.length, 0);

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
      <p className="rounded-[5px] bg-slate-50 p-3 text-[11px] font-medium leading-5 text-slate-500">
        WhatsApp list limits: max 10 sections, 10 rows total, button text 20 chars, row title 24 chars.
      </p>
      <Textarea label="Message text" value={configString(config, "text")} onChange={(event) => onChange({ ...config, text: event.target.value })} maxLength={LIST_LIMITS.body} />
      <Input label="Button text" value={configString(config, "buttonText")} onChange={(event) => onChange({ ...config, buttonText: event.target.value })} maxLength={LIST_LIMITS.buttonText} />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-ink-800/80">Sections and rows</div>
            <div className="text-[10px] text-slate-400">Row IDs become branch handles. {totalRows}/{LIST_LIMITS.rows} rows used.</div>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={sections.length >= LIST_LIMITS.sections} onClick={() => onChange({ ...config, sections: [...sections, { title: `Section ${sections.length + 1}`, rows: [] }] })}>
            <Plus size={14} />
            Section
          </Button>
        </div>
        {sections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`} className="space-y-3 rounded-[5px] border border-slate-200 p-3">
            <div className="flex items-end gap-2">
              <Input label="Section title" value={section.title} onChange={(event) => updateSection(sectionIndex, { ...section, title: event.target.value })} maxLength={LIST_LIMITS.sectionTitle} />
              <Button type="button" size="icon" variant="ghost" onClick={() => onChange({ ...config, sections: sections.filter((_, index) => index !== sectionIndex) })} aria-label="Remove section">
                <Trash2 size={15} />
              </Button>
            </div>
            {section.rows.map((row, rowIndex) => (
              <div key={`${row.id}-${rowIndex}`} className="space-y-2 rounded bg-slate-50 p-2">
                <Input label="Row title" value={row.title} onChange={(event) => updateRow(sectionIndex, rowIndex, { ...row, title: event.target.value })} maxLength={LIST_LIMITS.rowTitle} />
                <Input label="Row ID" value={row.id} onChange={(event) => updateRow(sectionIndex, rowIndex, { ...row, id: event.target.value.trim() })} maxLength={LIST_LIMITS.rowId} />
                <div className="flex items-end gap-2">
                  <Input label="Description" value={row.description} onChange={(event) => updateRow(sectionIndex, rowIndex, { ...row, description: event.target.value })} maxLength={LIST_LIMITS.rowDescription} />
                  <Button type="button" size="icon" variant="ghost" onClick={() => updateSection(sectionIndex, { ...section, rows: section.rows.filter((_, index) => index !== rowIndex) })} aria-label="Remove row">
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" disabled={totalRows >= LIST_LIMITS.rows} onClick={() => updateSection(sectionIndex, { ...section, rows: [...section.rows, { id: `option_${section.rows.length + 1}`, title: `Option ${section.rows.length + 1}`, description: "" }] })}>
              <Plus size={14} />
              Add row
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}
