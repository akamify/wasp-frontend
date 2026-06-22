function normalizeBaseUrl(value: string) {
  return String(value || "").trim().replace(/\/+$/, "");
}

async function checkCorsPath(baseUrl: string, signal: AbortSignal) {
  const response = await fetch(`${baseUrl}/health`, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    signal,
  });
  if (response.ok) return response.status;
  throw new Error(`Unexpected API status: ${response.status}`);
}

async function checkHostResolvable(baseUrl: string, signal: AbortSignal) {
  await fetch(`${baseUrl}/health`, {
    method: "HEAD",
    mode: "no-cors",
    cache: "no-store",
    signal,
  });
}

export function startApiReachabilityCheck() {
  const baseUrl = normalizeBaseUrl(
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.NEXT_PUBLIC_API_BASE_URL ||
    import.meta.env.NEXT_PUBLIC_API_URL ||
    ""
  );
  if (!baseUrl) return;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 6000);

  checkCorsPath(baseUrl, controller.signal)
    .then(() => {
      (window as any).__waspakamifyApiReachable = true;
      (window as any).__waspakamifyApiHealth = "ok";
    })
    .catch(async (err) => {
      try {
        await checkHostResolvable(baseUrl, controller.signal);
        (window as any).__waspakamifyApiReachable = true;
        (window as any).__waspakamifyApiHealth = "reachable_but_blocked";
        void baseUrl;
      } catch (secondaryErr) {
        (window as any).__waspakamifyApiReachable = false;
        (window as any).__waspakamifyApiHealth = "unreachable";
        void secondaryErr;
      }
    })
    .finally(() => {
      window.clearTimeout(timeoutId);
    });
}
