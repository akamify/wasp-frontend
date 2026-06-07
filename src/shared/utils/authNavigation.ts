import { normalizeRole } from "@shared/utils/authRole";

function roleFromToken(token?: string | null) {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return String(payload?.role || "") || null;
  } catch {
    return null;
  }
}

export function authenticatedHome(role?: string | null, token?: string | null) {
  const normalized = normalizeRole(role || roleFromToken(token));
  if (normalized === "super_admin") return "/super-admin";
  if (normalized === "admin") return "/admin";
  return "/workspaces";
}

export function authAwareHref({
  token,
  role,
  guestHref,
}: {
  token?: string | null;
  role?: string | null;
  guestHref: "/login" | "/register";
}) {
  return token ? authenticatedHome(role, token) : guestHref;
}
