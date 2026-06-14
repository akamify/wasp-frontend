import {
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  Loader2,
  PanelLeft,
  Save,
  Settings2,
} from "lucide-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { FlowStatusBadge } from "@modules/automation-flows/components/FlowStatusBadge";
import type { FlowStatus } from "@modules/automation-flows/types";
import type { ValidationStatus } from "@modules/automation-flows/useFlowPublishWorkflow";

interface BuilderTopBarProps {
  name: string;
  status: FlowStatus;
  dirty: boolean;
  editable: boolean;
  isSaving: boolean;
  isValidating: boolean;
  isPublishing: boolean;
  canSave: boolean;
  canValidate: boolean;
  canPublish: boolean;
  validationStatus: ValidationStatus;
  lastSavedAt: Date | null;
  blocksCollapsed: boolean;
  settingsOpen: boolean;
  onNameChange: (name: string) => void;
  onBack: () => void;
  onSave: () => void;
  onValidate: () => void;
  onPublish: () => void;
  onToggleBlocks: () => void;
  onToggleSettings: () => void;
}

export function BuilderTopBar({
  name,
  status,
  dirty,
  editable,
  isSaving,
  isValidating,
  isPublishing,
  canSave,
  canValidate,
  canPublish,
  validationStatus,
  lastSavedAt,
  blocksCollapsed,
  settingsOpen,
  onNameChange,
  onBack,
  onSave,
  onValidate,
  onPublish,
  onToggleBlocks,
  onToggleSettings,
}: Readonly<BuilderTopBarProps>) {
  const savedLabel = lastSavedAt
    ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Saved";
  const stateLabel = dirty
    ? "Unsaved changes"
    : validationStatus === "passed"
      ? "Validation passed"
      : validationStatus === "failed"
        ? "Validation failed"
        : savedLabel;

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
      <span
        className={`text-[10px] font-bold uppercase tracking-wider ${
          dirty
            ? "text-amber-600"
            : validationStatus === "passed"
              ? "text-emerald-600"
              : validationStatus === "failed"
                ? "text-rose-600"
                : "text-slate-400"
        }`}
      >
        {isPublishing ? "Publishing..." : isValidating ? "Validating..." : isSaving ? "Saving..." : stateLabel}
      </span>
      <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleBlocks}
          aria-label={blocksCollapsed ? "Expand content blocks" : "Collapse content blocks"}
          title={blocksCollapsed ? "Expand content blocks" : "Collapse content blocks"}
        >
          <PanelLeft size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSettings}
          aria-label={settingsOpen ? "Close settings panel" : "Open settings panel"}
          title={settingsOpen ? "Hide settings" : "Show settings"}
        >
          <Settings2 size={16} />
        </Button>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={onSave}
          disabled={!editable || !canSave}
          title={!dirty ? "No unsaved changes" : "Save latest changes"}
        >
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isSaving ? "Saving..." : dirty ? "Save Changes" : "Saved"}
        </Button>
        <Button
          variant="outline"
          onClick={onValidate}
          disabled={!editable || !canValidate}
          title={dirty ? "Save changes first" : "Validate saved draft"}
        >
          {isValidating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {isValidating ? "Validating..." : "Validate"}
        </Button>
        <Button
          onClick={onPublish}
          disabled={!editable || !canPublish}
          title={dirty ? "Save and validate first" : validationStatus !== "passed" ? "Validate first" : "Publish validated draft"}
        >
          {isPublishing ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />}
          {isPublishing ? "Publishing..." : "Publish"}
        </Button>
      </div>
    </div>
  );
}
