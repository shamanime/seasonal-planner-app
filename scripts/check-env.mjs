import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

for (const name of required) {
  const value = process.env[name];
  const status = value ? `present (${value.length} chars)` : "missing";
  console.log(`${name}: ${status}`);
}

const missing = required.filter((name) => !process.env[name]);
process.exitCode = missing.length ? 1 : 0;
