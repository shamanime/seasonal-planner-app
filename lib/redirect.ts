const SAFE_REDIRECT_ORIGIN = "https://redirect.invalid";

export function getSafeRedirectPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value, SAFE_REDIRECT_ORIGIN);

    if (url.origin !== SAFE_REDIRECT_ORIGIN || !value.startsWith("/") || url.pathname.startsWith("//")) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
