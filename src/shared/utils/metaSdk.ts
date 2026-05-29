let sdkPromise: Promise<any> | null = null;

declare global {
  interface Window {
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

function appId() {
  const env = (import.meta as any).env || {};
  return String(env.NEXT_PUBLIC_META_APP_ID || env.VITE_META_APP_ID || "").trim();
}

function graphVersion() {
  const env = (import.meta as any).env || {};
  return String(env.NEXT_PUBLIC_META_GRAPH_VERSION || env.VITE_META_GRAPH_VERSION || "v25.0").trim() || "v25.0";
}

export function loadMetaSdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.FB) return Promise.resolve(window.FB);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const id = "facebook-jssdk";
    const existing = document.getElementById(id);
    const onReady = () => {
      if (!window.FB) return reject(new Error("Meta SDK failed to initialize"));
      window.FB.init({
        appId: appId(),
        cookie: true,
        xfbml: true,
        version: graphVersion(),
      });
      resolve(window.FB);
    };
    window.fbAsyncInit = onReady;

    if (!existing) {
      const js = document.createElement("script");
      js.id = id;
      js.async = true;
      js.defer = true;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.onerror = () => reject(new Error("Could not load Meta SDK"));
      document.body.appendChild(js);
    }
  });

  return sdkPromise;
}
