"use client";

import { useEffect } from "react";
import { redactAnalyticsUrl } from "@/lib/analytics";

let initializationStarted = false;

export function PlausibleAnalytics({ domain }: { domain?: string }) {
  useEffect(() => {
    if (!domain || initializationStarted) return;

    initializationStarted = true;
    void import("@plausible-analytics/tracker").then(({ init }) => {
      init({
        domain,
        transformRequest(payload) {
          const url = redactAnalyticsUrl(payload.u);

          if (!url) return null;

          return {
            ...payload,
            u: url,
            r: redactAnalyticsUrl(payload.r),
          };
        },
      });
    });
  }, [domain]);

  return null;
}
