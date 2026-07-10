"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActivityStatus, splitLines } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  return { supabase, user };
}

export async function updateCalendar(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("calendar_id") ?? "");

  const { error } = await supabase
    .from("family_calendars")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      family_name: String(formData.get("family_name") ?? "").trim() || null,
      is_public: formData.get("is_public") === "on",
      kiosk_enabled: formData.get("kiosk_enabled") === "on",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/calendar/${id}/edit`);
  redirect(`/calendar/${id}/edit`);
}

export async function updateActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("activity_id") ?? "");
  const calendarId = String(formData.get("calendar_id") ?? "");

  const { error } = await supabase
    .from("family_activities")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      date_label: String(formData.get("date_label") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      notes: splitLines(formData.get("notes")),
      locations: splitLines(formData.get("locations")),
      tags: splitLines(formData.get("tags")),
      sort_order: Number(formData.get("sort_order") ?? 0),
      is_hidden: formData.get("is_hidden") === "on",
      is_favorite: formData.get("is_favorite") === "on",
      status: getActivityStatus(formData.get("status")),
    })
    .eq("id", id)
    .eq("calendar_id", calendarId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/calendar/${calendarId}/edit`);
  redirect(`/calendar/${calendarId}/edit`);
}

export async function addActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const calendarId = String(formData.get("calendar_id") ?? "");

  const { error } = await supabase.from("family_activities").insert({
    calendar_id: calendarId,
    season_id: String(formData.get("season_id") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    date_label: String(formData.get("date_label") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    notes: splitLines(formData.get("notes")),
    locations: splitLines(formData.get("locations")),
    tags: splitLines(formData.get("tags")),
    sort_order: Number(formData.get("sort_order") ?? 100),
    status: getActivityStatus(formData.get("status")),
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/calendar/${calendarId}/edit`);
  redirect(`/calendar/${calendarId}/edit`);
}

export async function deleteActivity(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("activity_id") ?? "");
  const calendarId = String(formData.get("calendar_id") ?? "");

  const { error } = await supabase.from("family_activities").delete().eq("id", id).eq("calendar_id", calendarId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/calendar/${calendarId}/edit`);
  redirect(`/calendar/${calendarId}/edit`);
}
