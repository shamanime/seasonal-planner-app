const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] as const;

export function getSupabaseEnv() {
  const missing = requiredEnv.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required Supabase env vars: ${missing.join(", ")}`);
  }

  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}

export function getAppUrl() {
  const value = process.env.APP_URL;

  if (!value) {
    throw new Error("Missing required env var: APP_URL");
  }

  try {
    return new URL(value).origin;
  } catch {
    throw new Error("APP_URL must be an absolute URL");
  }
}
