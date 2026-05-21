export function formatChatTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return d
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    .toLowerCase();
}

export function formatDurationShort(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

