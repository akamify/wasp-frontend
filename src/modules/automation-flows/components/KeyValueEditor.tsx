import { Plus, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import type { KeyValueMap } from "@modules/automation-flows/types";

interface KeyValueEditorProps {
  label: string;
  value: KeyValueMap;
  onChange: (value: KeyValueMap) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  label,
  value,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: Readonly<KeyValueEditorProps>) {
  const entries = Object.entries(value);

  function updateEntry(index: number, nextKey: string, nextValue: string) {
    const nextEntries = [...entries];
    nextEntries[index] = [nextKey, nextValue];
    onChange(Object.fromEntries(nextEntries.filter(([key]) => key.trim())));
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-ink-800/80">{label}</div>
      {entries.map(([key, entryValue], index) => (
        <div key={`${key}-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            value={key}
            onChange={(event) => updateEntry(index, event.target.value, entryValue)}
            placeholder={keyPlaceholder}
            aria-label={`${label} key`}
          />
          <Input
            value={entryValue}
            onChange={(event) => updateEntry(index, key, event.target.value)}
            placeholder={valuePlaceholder}
            aria-label={`${label} value`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(Object.fromEntries(entries.filter((_, itemIndex) => itemIndex !== index)))}
            aria-label={`Remove ${label} row`}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange({ ...value, [`key_${entries.length + 1}`]: "" })}
      >
        <Plus size={14} />
        Add row
      </Button>
    </div>
  );
}
