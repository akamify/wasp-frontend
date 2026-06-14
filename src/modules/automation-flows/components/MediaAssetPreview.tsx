import { FileAudio, FileText, Film, Image } from "lucide-react";
import type { MediaType } from "@modules/automation-flows/mediaNodeConfig";

export function MediaAssetIcon({
  mediaType,
}: Readonly<{ mediaType: MediaType }>) {
  const Icon =
    mediaType === "image"
      ? Image
      : mediaType === "video"
        ? Film
        : mediaType === "audio"
          ? FileAudio
          : FileText;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-slate-100 text-slate-600">
      <Icon size={17} />
    </span>
  );
}

export function MediaAssetPreview({
  name,
  url,
  mediaType,
}: Readonly<{ name: string; url: string; mediaType: MediaType }>) {
  return (
    <div className="rounded-[7px] border border-slate-200 p-3">
      {mediaType === "image" && url ? (
        <img
          src={url}
          alt={name}
          className="mb-3 max-h-40 w-full rounded-[6px] object-contain"
        />
      ) : null}
      {mediaType === "audio" && url ? (
        <audio controls src={url} className="mb-3 w-full" />
      ) : null}
      <div className="flex items-center gap-3">
        <MediaAssetIcon mediaType={mediaType} />
        <span className="min-w-0 truncate text-xs font-black text-slate-700">
          {name}
        </span>
      </div>
    </div>
  );
}
