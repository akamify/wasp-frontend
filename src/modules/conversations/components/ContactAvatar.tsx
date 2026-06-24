import { cn } from "@shared/utils/cn";

const AVATAR_COLORS = [
  { background: "#d9f99d", foreground: "#365314" },
  { background: "#bae6fd", foreground: "#0c4a6e" },
  { background: "#fde68a", foreground: "#713f12" },
  { background: "#fecdd3", foreground: "#881337" },
  { background: "#ddd6fe", foreground: "#4c1d95" },
  { background: "#bbf7d0", foreground: "#14532d" },
];

function avatarInitials(name: string, phone: string) {
  const source = String(name || "").trim();
  if (!source) return String(phone || "?").slice(-2);
  const words = source.split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] || ""}${words.length > 1 ? words[words.length - 1]?.[0] || "" : words[0]?.[1] || ""}`.toUpperCase();
}

function colorFor(identifier: string) {
  let hash = 0;
  for (const character of String(identifier || "")) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function ContactAvatar({ className, name = "", phone }: { className?: string; name?: string; phone: string }) {
  const color = colorFor(phone || name);
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center overflow-hidden font-semibold shadow-sm", className)}
      style={{ backgroundColor: color.background, color: color.foreground }}
      aria-hidden="true"
    >
      {avatarInitials(name, phone)}
    </div>
  );
}
