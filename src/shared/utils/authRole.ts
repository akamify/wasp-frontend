export type NormalizedRole = "user" | "admin" | "super_admin";

export function normalizeRole(role?: string | null): NormalizedRole {
  const value = String(role || "").trim().toLowerCase().replace(/-/g, "_");
  if (value === "super_admin" || value === "superadmin") return "super_admin";
  if (value === "admin") return "admin";
  return "user";
}

