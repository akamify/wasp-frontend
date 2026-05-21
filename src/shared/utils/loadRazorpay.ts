declare global {
  interface Window {
    Razorpay?: any;
    __waspakamifyRzpPromise?: Promise<void>;
  }
}

export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (window.__waspakamifyRzpPromise) return window.__waspakamifyRzpPromise;

  window.__waspakamifyRzpPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });

  return window.__waspakamifyRzpPromise;
}

