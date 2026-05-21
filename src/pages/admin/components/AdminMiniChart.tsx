import React from "react";
import { cn } from "@shared/utils/cn";

type Point = { label: string; count: number };

export function AdminBarChart({
  points,
  height = 96,
  className,
}: {
  points: Point[];
  height?: number;
  className?: string;
}) {
  const safe = Array.isArray(points) ? points : [];
  const max = Math.max(...safe.map((p) => Number(p.count || 0)), 1);
  return (
    <div className={cn("flex items-end gap-2 w-full", className)} style={{ height }}>
      {safe.map((p, i) => {
        const pct = Math.max(4, Math.round((Number(p.count || 0) / max) * 100));
        return (
          <div key={`${p.label}-${i}`} className="flex-1 min-w-0 h-full flex items-end group relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-[3px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
              {p.count.toLocaleString()}
            </div>
            <div className="w-full bg-brand-500/10 rounded-[4px] h-full relative overflow-hidden flex items-end">
              <div 
                className="w-full bg-brand-500 rounded-[4px] transition-all duration-700 ease-out shadow-[0_0_15px_-3px_rgba(var(--brand-500-rgb),0.3)]" 
                style={{ height: `${pct}%` }} 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminLineChart({
  points,
  height = 96,
  className,
}: {
  points: Point[];
  height?: number;
  className?: string;
}) {
  const safe = Array.isArray(points) ? points : [];
  if (safe.length < 2) return <AdminBarChart points={safe} height={height} className={className} />;
  
  const max = Math.max(...safe.map((p) => Number(p.count || 0)), 1);
  const width = 1000;
  const h = 200;
  
  const getX = (i: number) => (i / (safe.length - 1)) * width;
  const getY = (count: number) => h - (Math.max(0.1, count / max) * (h - 20)) - 10;
  
  const pathData = safe.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.count)}`).join(" ");
  const areaData = `${pathData} L ${getX(safe.length - 1)} ${h} L 0 ${h} Z`;

  // Brand green: #06b77e -> rgb(6, 183, 126)
  const brandColor = "#06b77e";

  return (
    <div className={cn("w-full relative", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${h}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={brandColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={brandColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaData} fill="url(#chartGradient)" />
        <path
          d={pathData}
          fill="none"
          stroke={brandColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
        />
        {safe.map((p, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(p.count)}
            r="8"
            fill="white"
            stroke={brandColor}
            strokeWidth="4"
            className="cursor-pointer hover:r-[12] transition-all"
          >
            <title>{`${p.label}: ${p.count}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
}

export function AdminChartLabels({ points }: { points: Point[] }) {
  return (
    <div className="mt-3 flex justify-between gap-2 px-1">
      {points.map((p, i) => (
        <div key={`${p.label}-${i}`} className="text-[9px] font-black text-slate-400 uppercase tracking-tighter truncate text-center">
          {String(p.label).length > 7 ? String(p.label).slice(5) : p.label}
        </div>
      ))}
    </div>
  );
}

