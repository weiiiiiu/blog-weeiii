import { siteInfo } from "site.config";

const configuredId = siteInfo.GAId?.trim() || import.meta.env.VITE_GA_ID?.trim();

// An empty or invalid ID must never load the Google tag.
export const GA_MEASUREMENT_ID =
  configuredId && /^G-[A-Z0-9]+$/.test(configuredId) ? configuredId : undefined;
