import React from "react";

export function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

export function AreaChart({
  points,
  stroke = "#22c55e",
  fill = "rgba(34,197,94,0.08)",
  height = 240,
  datasets,
  showLegend = true,
}: any) {
  const allDatasets = datasets || [{ points, stroke, fill }];
  const width = 640;
  const padding = 32;
  const allYValues = allDatasets.flatMap((d: any) => d.points.map((p: any) => p.y));
  const maxY = Math.max(...allYValues, 1);

  return (
    <div className="w-full overflow-hidden rounded-[5px] border border-ink-900/10 bg-white shadow-sm">
      <div className="px-4 md:px-5 py-3 md:py-4">
        <div className="text-xs md:text-sm font-black text-ink-900 uppercase tracking-wider">Messages Trend</div>
      </div>
      <div className="px-2 md:px-4 pb-4 md:pb-5">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          {Array.from({ length: 5 }).map((_, i) => {
            const y = padding + (i * (height - padding * 2)) / 4;
            return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(15,23,42,0.06)" />;
          })}
          {allDatasets.map((ds: any, idx: number) => {
            const xStep = ds.points.length > 1 ? (width - padding * 2) / (ds.points.length - 1) : 0;
            const coords = ds.points.map((p: any, i: number) => {
              const x = padding + i * xStep;
              const y = padding + (1 - p.y / maxY) * (height - padding * 2);
              return { x, y };
            });
            const d = coords.map((c: any, i: number) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
            const fillD = `${d} L ${(padding + (ds.points.length - 1) * xStep).toFixed(1)} ${(height - padding).toFixed(1)} L ${padding.toFixed(1)} ${(height - padding).toFixed(1)} Z`;
            return (
              <React.Fragment key={idx}>
                <path d={fillD} fill={ds.fill} className="transition-all duration-500" />
                <path d={d} fill="none" stroke={ds.stroke} strokeWidth={3} className="md:stroke-[4]" />
                {coords.map((c: any, i: number) => (
                  <circle key={i} cx={c.x} cy={c.y} r={4} fill={ds.stroke} className="md:r-[6]" />
                ))}
              </React.Fragment>
            );
          })}
          {allDatasets[0].points.map((p: any, i: number) => {
            const xStep = (width - padding * 2) / (allDatasets[0].points.length - 1);
            const x = padding + i * xStep;
            return (
              <text
                key={i}
                x={x}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === allDatasets[0].points.length - 1 ? "end" : "middle"}
                fontSize="13"
                className="font-bold md:text-[15px]"
                fill="rgba(15,23,42,0.6)"
              >
                {p.xLabel}
              </text>
            );
          })}
        </svg>
        {showLegend && !datasets && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-800/60">
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#94a3b8" }} /> queued</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#22c55e" }} /> sent</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#3b82f6" }} /> delivered</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#16a34a" }} /> read</span>
            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#ef4444" }} /> failed</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function BlockSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-[5px] bg-slate-100" />
      ))}
    </div>
  );
}

export function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
