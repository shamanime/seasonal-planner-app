"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/calendar";

export async function cloneTemplate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/");
  }

  const templateId = String(formData.get("template_id") ?? "");
  const familyName = String(formData.get("family_name") ?? "").trim();
  const title = familyName ? `${familyName} Seasonal Activity Calendar` : "My Seasonal Activity Calendar";
  const shareSlug = `${slugify(title) || "calendar"}-${crypto.randomUUID().slice(0, 8)}`;

  const { data: calendarId, error } = await supabase.rpc("clone_calendar_from_template", {
    p_template_id: templateId,
    p_title: title,
    p_family_name: familyName,
    p_share_slug: shareSlug,
  });

  if (error || !calendarId) {
    if (error?.message.includes("CALENDAR_LIMIT_REACHED")) {
      throw new Error("You have reached your current calendar limit. Another slot unlocks on your next account anniversary.");
    }

    throw new Error(error?.message ?? "Could not create seasonal calendar.");
  }

  revalidatePath("/dashboard");
  redirect(`/calendar/${calendarId}/edit`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function deleteFamilyCalendar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const id = String(formData.get("calendar_id") ?? "");
  const confirmed = formData.get("confirm_delete") === "on";

  if (!id || !confirmed) {
    redirect("/dashboard");
  }

  const { error } = await supabase.from("family_calendars").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
