"use client";

import { useEffect, useState } from "react";

export function CopyShareLinkButton({ path }: { path: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") return;

    const timeout = window.setTimeout(() => setStatus("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyLink() {
    try {
      const shareUrl = new URL(path, window.location.origin).toString();
      await navigator.clipboard.writeText(shareUrl);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  const label = status === "copied" ? "Copied!" : status === "error" ? "Copy failed" : "Copy share link";

  return (
    <button
      className="motion-soft inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm"
      type="button"
      onClick={copyLink}
      aria-label={label}
      title={label}
    >
      {status === "copied" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 text-leaf" fill="none" stroke="currentColor" strokeWidth="2.25">
          <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : status === "error" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 text-red-700" fill="none" stroke="currentColor" strokeWidth="2.25">
          <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
        </svg>
      )}
      <span className="sr-only" aria-live="polite">{label}</span>
    </button>
  );
}
