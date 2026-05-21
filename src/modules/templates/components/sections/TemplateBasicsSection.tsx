import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { CATEGORY_OPTIONS, TEMPLATE_NAME_MAX_CHARS, TEMPLATE_NAME_MIN_CHARS } from "@modules/templates/utils/helpers";
import type { TemplateCategory } from "@modules/templates/types/templates.types";

type Props = {
  category: TemplateCategory;
  language: string;
  languageOptions: string[];
  mode: "create" | "edit";
  name: string;
  onCategoryChange: (value: TemplateCategory) => void;
  onLanguageChange: (value: string) => void;
  onNameChange: (value: string) => void;
};

export function TemplateBasicsSection({ category, language, languageOptions, mode, name, onCategoryChange, onLanguageChange, onNameChange }: Props) {
  return (
    <div className="grid gap-4 bg-white p-1">
      <Input
        label="Template Name"
        value={name}
        onChange={(e) => {
          if (mode === "edit") return;
          onNameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
        }}
        placeholder="e.g. order_confirmation_v1"
        className="rounded-[5px] shadow-none"
        minLength={TEMPLATE_NAME_MIN_CHARS}
        maxLength={TEMPLATE_NAME_MAX_CHARS}
        required
        hint={
          mode === "edit"
            ? "Template name cannot be edited."
            : `Only lowercase letters, numbers, and underscore are allowed. ${name.trim().length}/${TEMPLATE_NAME_MAX_CHARS} chars (min ${TEMPLATE_NAME_MIN_CHARS}).`
        }
        disabled={mode === "edit"}
      />
      {mode !== "edit" && name.trim() && name.trim().length < TEMPLATE_NAME_MIN_CHARS ? (
        <div className="text-xs font-semibold text-rose-700">
          Template name must be at least {TEMPLATE_NAME_MIN_CHARS} characters.
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Select Template Language" value={language} onChange={(e) => mode !== "edit" && onLanguageChange(e.target.value)} className="rounded-[5px] shadow-none" disabled={mode === "edit"}>
          {languageOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </Select>
        <Select label="Category" value={category} onChange={(e) => mode !== "edit" && onCategoryChange(e.target.value as TemplateCategory)} className="rounded-[5px] shadow-none" disabled={mode === "edit"}>
          {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </Select>
      </div>
      {mode === "edit" ? <div className="text-xs text-ink-800/60">Template language and category cannot be changed in edit mode.</div> : null}
    </div>
  );
}

