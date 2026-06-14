import { ArrowLeft, CheckCircle2, CloudUpload, Save } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { FlowStatusBadge } from "@modules/automation-flows/components/FlowStatusBadge";
import type { FlowStatus } from "@modules/automation-flows/types";

interface BuilderTopBarProps {
  name: string;
  status: FlowStatus;
  dirty: boolean;
  busy: boolean;
  editable: boolean;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onSave: () => void;
  onValidate: () => void;
  onPublish: () => void;
}

export function BuilderTopBar({
  name,
  status,
  dirty,
  busy,
  editable,
  onNameChange,
  onBack,
  onSave,
  onValidate,
  onPublish,
}: Readonly<BuilderTopBarProps>) {
  return (
    <div className="flex min-h-16 flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 shadow-sm">
      <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back to automation flows">
        <ArrowLeft size={18} />
      </Button>
      <div className="min-w-52 flex-1 sm:max-w-md">
        <Input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="border-transparent bg-transparent px-2 text-base font-black hover:border-slate-200 focus:bg-white"
          aria-label="Flow name"
          disabled={!editable}
        />
      </div>
      <FlowStatusBadge status={status} />
      {dirty ? <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Unsaved changes</span> : null}
      <div className="ml-auto flex flex-wrap gap-2">
        <Button variant="outline" onClick={onSave} disabled={busy || !editable}>
          <Save size={15} />
          Save Changes
        </Button>
        <Button variant="outline" onClick={onValidate} disabled={busy || !editable}>
          <CheckCircle2 size={15} />
          Validate
        </Button>
        <Button onClick={onPublish} disabled={busy || !editable}>
          <CloudUpload size={15} />
          Publish
        </Button>
      </div>
    </div>
  );
}
