import { getToken, getWorkspaceId } from "@api/api";
import type { TrackedLink } from "./shared";

export async function downloadAuthed(url: string, filename: string) {
  const token = getToken();
  const workspaceId = getWorkspaceId();
  const res = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(workspaceId ? { "x-workspace-id": workspaceId } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Download failed (${res.status})`);
  }
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}

export function trackedUrlFor(link: TrackedLink) {
  return link.trackedUrl || `${window.location.origin}/t/${link.slug}`;
}

export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}
