export function redactAnalyticsUrl(value: string | null | undefined) {
  if (!value) {
    return value;
  }

  try {
    const url = new URL(value);
    url.pathname = url.pathname.replace(/^\/c\/[^/]+/, "/c/[redacted]");
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return undefined;
  }
}
