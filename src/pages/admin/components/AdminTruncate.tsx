import { cn } from "@shared/utils/cn";

export function AdminTruncate({
  text,
  title,
  className,
  max = 64,
}: {
  text: any;
  title?: string;
  className?: string;
  max?: number;
}) {
  const value = String(text ?? "");
  const trimmed = value.length > max ? `${value.slice(0, max - 1)}…` : value;
  return (
    <span title={title ?? value} className={cn("block truncate", className)}>
      {trimmed}
    </span>
  );
}
