import { Bold, Highlighter, Italic, MessageSquare, Plus, Redo2, Strikethrough, Undo2 } from "lucide-react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";

type Props = {
  bodyRef: RefObject<HTMLTextAreaElement | null>;
  bodyText: string;
  bodyVariablesSequential: boolean;
  insertAtSelection: (value: string) => void;
  nextVariableIndex: number;
  runNativeUndoRedo: (command: "undo" | "redo") => void;
  setBodyText: (value: string) => void;
  setVariableValues: Dispatch<SetStateAction<Record<number, string>>>;
  variableIndexes: number[];
  variableValues: Record<number, string>;
  wrapSelection: (prefix: string, suffix?: string) => void;
};

export function TemplateBodySection({ bodyRef, bodyText, bodyVariablesSequential, insertAtSelection, nextVariableIndex, runNativeUndoRedo, setBodyText, setVariableValues, variableIndexes, variableValues, wrapSelection }: Props) {
  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-900">
        <MessageSquare size={16} className="text-ink-800/60" /> Body
      </div>
      <Textarea
        label="Body Text"
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        rows={6}
        ref={bodyRef}
        className="rounded-[5px] shadow-none"
        required
        onKeyDown={(event) => {
          const key = event.key.toLowerCase();
          if ((event.ctrlKey || event.metaKey) && key === "z" && !event.shiftKey) {
            event.preventDefault();
            runNativeUndoRedo("undo");
          }
          if ((event.ctrlKey || event.metaKey) && (key === "y" || (key === "z" && event.shiftKey))) {
            event.preventDefault();
            runNativeUndoRedo("redo");
          }
        }}
      />
      <div className="my-3 flex flex-wrap items-center justify-between gap-4 border-b border-ink-900/10 pb-4">
        <div className="flex flex-wrap items-center gap-1">
          <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => runNativeUndoRedo("undo")}><Undo2 size={14} /></Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => runNativeUndoRedo("redo")}><Redo2 size={14} /></Button>
          <div className="h-4 w-px bg-ink-900/20 mx-1" />
          <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("*")}><Bold size={14} /></Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("_")}><Italic size={14} /></Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("~")}><Strikethrough size={14} /></Button>
          <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none" onClick={() => wrapSelection("[blue]", "[/blue]")}><Highlighter size={14} /></Button>
        </div>
        <Button type="button" size="sm" variant="ghost" className="flex items-center gap-1.5 rounded-[5px] shadow-none text-brand-600 bg-brand-50 hover:bg-brand-100" onClick={() => insertAtSelection(`{{${nextVariableIndex}}}`)}>
          <Plus size={14} /> Add {`{{${nextVariableIndex}}}`}
        </Button>
      </div>

      {variableIndexes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {variableIndexes.map((idx) => (
            <Button key={idx} type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none border border-ink-900/10" onClick={() => insertAtSelection(`{{${idx}}}`)}>
              {`{{${idx}}}`}
            </Button>
          ))}
        </div>
      )}

      {!bodyVariablesSequential ? (
        <div className="mb-4 rounded-[5px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">
          Body variables must start from {"{{1}}"} and continue without gaps. Header variables use separate numbering, so body should still start at {"{{1}}"}.
        </div>
      ) : null}

      {variableIndexes.length > 0 ? (
        <div className="mt-4 rounded-[5px] border border-ink-900/10 bg-white p-4 shadow-none">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-800/60">Variable Values</div>
          <div className="grid gap-4 sm:grid-cols-1">
            {variableIndexes.map((index) => (
              <Input key={index} label={`Value for {{${index}}}`} value={variableValues[index] || ""} onChange={(event) => setVariableValues((prev) => ({ ...prev, [index]: event.target.value }))} placeholder={`Enter value for {{${index}}}`} className="rounded-[5px] shadow-none" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
