export type MediaType = "image" | "video" | "document" | "audio";
export type MediaSourceType = "upload" | "library" | "url" | "api_context";

export const MEDIA_UPLOAD_LIMITS: Record<
  MediaType,
  { accept: string; extensions: string[]; maxBytes: number; helper: string }
> = {
  image: {
    accept: ".jpg,.jpeg,.png,image/jpeg,image/png",
    extensions: [".jpg", ".jpeg", ".png"],
    maxBytes: 5 * 1024 * 1024,
    helper: "Allowed: JPG, PNG. Max 5 MB.",
  },
  video: {
    accept: ".mp4,.3gp,video/mp4,video/3gpp",
    extensions: [".mp4", ".3gp"],
    maxBytes: 16 * 1024 * 1024,
    helper: "Allowed: MP4, 3GP. Max 16 MB.",
  },
  audio: {
    accept: ".aac,.m4a,.mp3,.amr,.ogg,audio/*",
    extensions: [".aac", ".m4a", ".mp3", ".amr", ".ogg"],
    maxBytes: 16 * 1024 * 1024,
    helper: "Allowed: AAC, M4A, MP3, AMR, OGG. Max 16 MB.",
  },
  document: {
    accept: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt",
    extensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
    ],
    maxBytes: 100 * 1024 * 1024,
    helper: "Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT. Max 100 MB.",
  },
};

export function formatMediaBytes(value: number) {
  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function mediaFileExtension(name: string) {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}
