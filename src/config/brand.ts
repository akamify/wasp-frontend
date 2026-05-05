export const BRAND_NAME = import.meta.env.VITE_APP_BRAND_NAME || "DigitalWhasp";
export const BRAND_TAGLINE = import.meta.env.VITE_APP_BRAND_TAGLINE || "WhatsApp Marketing Platform";
export const BRAND_LEGAL_NAME = import.meta.env.VITE_APP_BRAND_LEGAL_NAME || BRAND_NAME;
export const BRAND_SLUG =
  import.meta.env.VITE_APP_BRAND_SLUG ||
  BRAND_NAME.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^_+|_+$/g, "");
