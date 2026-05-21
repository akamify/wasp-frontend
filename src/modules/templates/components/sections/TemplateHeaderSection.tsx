import { CheckCircle2, Image as ImageIcon, MessageSquare, Plus, Type, Video } from "lucide-react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { Alert } from "@components/ui/Alert";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import type { HeaderType } from "@modules/templates/types/templates.types";

type Props = {
  clearHeaderMedia: () => void;
  headerText: string;
  headerTextRef: RefObject<HTMLInputElement | null>;
  headerType: HeaderType;
  headerVariableIndexes: number[];
  headerVariableValues: Record<number, string>;
  locationAddress: string;
  locationLatitude: string;
  locationLongitude: string;
  locationName: string;
  mediaHandle: string;
  mediaInputRef: RefObject<HTMLInputElement | null>;
  mediaUploadError: string | null;
  mediaUploadPct: number;
  mediaUploading: boolean;
  nextHeaderVariableIndex: number;
  setHeaderText: Dispatch<SetStateAction<string>>;
  setHeaderType: (value: HeaderType) => void;
  setHeaderVariableValues: Dispatch<SetStateAction<Record<number, string>>>;
  setLocationAddress: (value: string) => void;
  setLocationLatitude: (value: string) => void;
  setLocationLongitude: (value: string) => void;
  setLocationName: (value: string) => void;
  uploadHeaderMedia: (file: File) => void;
};

export function TemplateHeaderSection(props: Props) {
  const resetHeader = (value: HeaderType) => {
    props.setHeaderType(value);
    props.setHeaderText("");
    props.setHeaderVariableValues({});
    props.clearHeaderMedia();
    props.setLocationName("");
    props.setLocationAddress("");
    props.setLocationLatitude("");
    props.setLocationLongitude("");
  };

  return (
    <div className="rounded-[5px] border border-ink-900/10 bg-slate-50/50 p-5 shadow-none">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-900">
        <Type size={16} className="text-ink-800/60" /> Header (Optional)
      </div>
      <Select label="Header Type" value={props.headerType} onChange={(e) => resetHeader(e.target.value as HeaderType)} className="mb-4 rounded-[5px] shadow-none">
        <option value="NONE">None</option>
        <option value="TEXT">Text</option>
        <option value="IMAGE">Image</option>
        <option value="VIDEO">Video</option>
        <option value="DOCUMENT">Document</option>
        <option value="LOCATION">Location</option>
      </Select>
      {props.headerType === "TEXT" ? <HeaderTextFields {...props} /> : null}
      {props.headerType === "IMAGE" || props.headerType === "VIDEO" || props.headerType === "DOCUMENT" ? <HeaderMediaFields {...props} /> : null}
      {props.headerType === "LOCATION" ? <HeaderLocationFields {...props} /> : null}
    </div>
  );
}

function HeaderTextFields(props: Props) {
  const insertHeaderVariable = (index: number) => {
    const el = props.headerTextRef.current;
    const value = `{{${index}}}`;
    if (!el) return props.setHeaderText((prev) => `${prev}${value}`);
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const next = `${props.headerText.slice(0, start)}${value}${props.headerText.slice(end)}`;
    props.setHeaderText(next);
    requestAnimationFrame(() => el.setSelectionRange(start + value.length, start + value.length));
  };

  return (
    <div className="grid gap-3">
      <label className="block">
        <div className="mb-1 text-xs font-semibold text-ink-800/80">Header Text</div>
        <input ref={props.headerTextRef} value={props.headerText} onChange={(e) => props.setHeaderText(e.target.value)} placeholder="Limited-time offer {{1}}" className="w-full rounded-[5px] bg-white px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-900/12 placeholder:text-ink-900/35 focus:outline-none focus:ring-2 focus:ring-brand-300" required />
        <div className="mt-1 text-xs text-ink-800/60">Variables are allowed in header text too, like {`{{1}}`}.</div>
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {props.headerVariableIndexes.map((idx) => (
            <Button key={idx} type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none border border-ink-900/10" onClick={() => insertHeaderVariable(idx)}>
              {`{{${idx}}}`}
            </Button>
          ))}
        </div>
        <Button type="button" size="sm" variant="ghost" className="flex items-center gap-1.5 rounded-[5px] shadow-none text-brand-600 bg-brand-50 hover:bg-brand-100" disabled={props.headerVariableIndexes.length >= 1} onClick={() => insertHeaderVariable(props.nextHeaderVariableIndex)}>
          <Plus size={14} /> Add {`{{${props.nextHeaderVariableIndex}}}`}
        </Button>
      </div>
      {props.headerVariableIndexes.length > 1 ? <div className="rounded-[5px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800">Header text can contain maximum 1 variable. Remove extra placeholders to continue.</div> : null}
      {props.headerVariableIndexes.length > 0 ? (
        <div className="rounded-[5px] border border-ink-900/10 bg-white p-4 shadow-none">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-ink-800/60">Header Variable Values (Preview)</div>
          <div className="grid gap-4 sm:grid-cols-1">
            {props.headerVariableIndexes.map((index) => (
              <Input key={index} label={`Value for {{${index}}}`} value={props.headerVariableValues[index] || ""} onChange={(event) => props.setHeaderVariableValues((prev) => ({ ...prev, [index]: event.target.value }))} placeholder={`Enter value for {{${index}}}`} className="rounded-[5px] shadow-none" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeaderMediaFields(props: Props) {
  return (
    <div className="grid gap-4">
      <div className="rounded-[5px] border border-ink-900/10 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] bg-white border border-ink-900/10 text-ink-800/50">
              {props.headerType === "IMAGE" ? <ImageIcon size={18} /> : props.headerType === "VIDEO" ? <Video size={18} /> : <MessageSquare size={18} />}
            </div>
            <div><div className="text-sm font-bold text-ink-900">{props.headerType === "IMAGE" ? "Header Image" : props.headerType === "VIDEO" ? "Header Video" : "Header Document"}</div><div className="text-xs text-ink-800/55">Upload file, get Meta handle, and preview instantly.</div></div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={props.mediaInputRef} type="file" accept={props.headerType === "IMAGE" ? "image/*" : props.headerType === "VIDEO" ? "video/*" : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf"} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) props.uploadHeaderMedia(file); }} />
            <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none bg-brand-50 text-brand-700 hover:bg-brand-100" onClick={() => props.mediaInputRef.current?.click()} disabled={props.mediaUploading}>{props.mediaHandle && !props.mediaUploading ? "Replace" : props.mediaUploading ? "Uploading..." : "Upload"}</Button>
            <Button type="button" size="sm" variant="ghost" className="rounded-[5px] shadow-none border border-ink-900/10" onClick={props.clearHeaderMedia} disabled={props.mediaUploading && !props.mediaHandle}>Clear</Button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[5px] border border-ink-900/10 bg-slate-50 px-3 py-2">
          <div className="text-xs font-semibold text-ink-900/65">{props.mediaHandle && !props.mediaUploading ? <span className="inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={14} /> Uploaded</span> : props.mediaUploading ? "Uploading..." : "No file uploaded"}</div>
          <div className="text-[11px] font-bold text-ink-900/35">{props.mediaHandle && !props.mediaUploading ? "Ready" : props.mediaUploadPct ? `${props.mediaUploadPct}%` : ""}</div>
        </div>
        {props.mediaUploading || props.mediaUploadPct > 0 ? <UploadProgress pct={props.mediaUploadPct} uploading={props.mediaUploading} /> : null}
        {props.mediaUploadError ? <div className="mt-3"><Alert tone="error">{props.mediaUploadError}</Alert></div> : null}
      </div>
    </div>
  );
}

function HeaderLocationFields(props: Props) {
  return (
    <div className="grid gap-4 rounded-[5px] border border-ink-900/10 bg-white p-4">
      <Input label="Location Name" value={props.locationName} onChange={(e) => props.setLocationName(e.target.value)} placeholder="Office / Store name" className="rounded-[5px] shadow-none" />
      <Input label="Address" value={props.locationAddress} onChange={(e) => props.setLocationAddress(e.target.value)} placeholder="Full address" className="rounded-[5px] shadow-none" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Latitude" value={props.locationLatitude} onChange={(e) => props.setLocationLatitude(e.target.value)} placeholder="28.6139" className="rounded-[5px] shadow-none" required />
        <Input label="Longitude" value={props.locationLongitude} onChange={(e) => props.setLocationLongitude(e.target.value)} placeholder="77.2090" className="rounded-[5px] shadow-none" required />
      </div>
      <div className="text-xs text-ink-800/55">This is used only as template example + preview. Sending location templates will be added in the send flow.</div>
    </div>
  );
}

function UploadProgress({ pct, uploading }: { pct: number; uploading: boolean }) {
  return (
    <div className="mt-4">
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 transition-[width] duration-200" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      {uploading ? <div className="mt-2 text-[11px] font-medium text-ink-900/40">Please wait... this can take a few seconds for large files.</div> : null}
    </div>
  );
}
