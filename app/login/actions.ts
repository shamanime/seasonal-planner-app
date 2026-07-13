"use server";

import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/env";
import { getSafeRedirectPath } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = getSafeRedirectPath(String(formData.get("next") ?? "/dashboard"));
  const appUrl = getAppUrl();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("Unable to send a magic link. Please try again.")}&next=${encodeURIComponent(next)}`,
    );
  }

  redirect(`/login?sent=1&next=${encodeURIComponent(next)}`);
}
