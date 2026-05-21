export function AdminLimitSelect({
  limit,
  setLimit,
  options = [10, 25, 50, 100],
}: {
  limit: number;
  setLimit: (v: number) => void;
  options?: number[];
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-semibold text-ink-900/60">
      Per page
      <select
        className="rounded-[5px] border border-ink-900/10 bg-white px-2 py-2 text-xs font-bold text-ink-900"
        value={String(limit)}
        onChange={(e) => setLimit(Number(e.target.value) || 25)}
      >
        {options.map((o) => (
          <option key={o} value={String(o)}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
