import { GA_MEASUREMENT_ID } from "lib/analytics";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** One pageview per route/query change; hash-only TOC navigation is excluded. */
export function useGtag() {
  const { pathname, search } = useLocation();
  const previousUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !window.gtag) return;

    const url = new URL(pathname + search, window.location.origin).href;
    if (previousUrl.current === url) return;

    window.gtag("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_location: url,
      page_title: document.title,
      page_referrer: previousUrl.current ?? document.referrer,
    });
    previousUrl.current = url;
  }, [pathname, search]);
}
