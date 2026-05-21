import { FileText, Image, Music, Video } from "lucide-react";
import type { RefObject } from "react";

type Props = {
  panelRef: RefObject<HTMLDivElement | null>;
  onPick: (kind: "image" | "video" | "audio" | "document") => void;
  disabled?: boolean;
};

export function AttachmentMenu({ panelRef, onPick, disabled }: Props) {
  if (disabled) return null;

  return (
    <div ref={panelRef} className="absolute bottom-12 left-0 z-20 w-52 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-xl">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        onClick={() => onPick("image")}
      >
        <Image size={16} /> Image
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        onClick={() => onPick("video")}
      >
        <Video size={16} /> Video
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        onClick={() => onPick("audio")}
      >
        <Music size={16} /> Audio
      </button>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
        onClick={() => onPick("document")}
      >
        <FileText size={16} /> Document
      </button>
    </div>
  );
}
