"use client";

import { useEffect } from "react";

let initializationStarted = false;

export function PlausibleAnalytics({ domain }: { domain?: string }) {
  useEffect(() => {
    if (!domain || initializationStarted) return;

    initializationStarted = true;
    void import("@plausible-analytics/tracker").then(({ init }) => {
      init({ domain });
    });
  }, [domain]);

  return null;
}
