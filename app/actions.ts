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

  const { data: template, error: templateError } = await supabase
    .from("calendar_templates")
    .select("id, title")
    .eq("id", templateId)
    .eq("is_published", true)
    .single();

  if (templateError || !template) {
    throw new Error("Published template not found.");
  }

  const { data: calendar, error: calendarError } = await supabase
    .from("family_calendars")
    .insert({
      owner_id: user.id,
      template_id: template.id,
      title,
      family_name: familyName || null,
      share_slug: shareSlug,
      is_public: true,
      kiosk_enabled: true,
    })
    .select("id")
    .single();

  if (calendarError || !calendar) {
    throw new Error(calendarError?.message ?? "Could not create seasonal calendar.");
  }

  const { data: activities, error: activitiesError } = await supabase
    .from("template_activities")
    .select("id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_featured")
    .eq("template_id", template.id)
    .eq("is_published", true)
    .order("sort_order");

  if (activitiesError) {
    throw new Error(activitiesError.message);
  }

  if (activities?.length) {
    const { error: insertError } = await supabase.from("family_activities").insert(
      activities.map((activity) => ({
        calendar_id: calendar.id,
        source_activity_id: activity.id,
        season_id: activity.season_id,
        title: activity.title,
        date_label: activity.date_label,
        description: activity.description,
        notes: activity.notes,
        locations: activity.locations,
        tags: activity.tags,
        sort_order: activity.sort_order,
        is_favorite: activity.is_featured,
      })),
    );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  revalidatePath("/dashboard");
  redirect(`/calendar/${calendar.id}/edit`);
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
