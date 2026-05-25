export type TrackedLink = {
  _id: string;
  title: string;
  message: string;
  slug: string;
  trackedUrl?: string;
  clicks: number;
  scans: number;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsPoint = { date: string; clicks: number; scans: number };

export function bars(points: AnalyticsPoint[], key: "clicks" | "scans") {
  const max = Math.max(1, ...points.map((p) => p[key]));
  return points.map((p) => Math.round((p[key] / max) * 100));
}
