"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { splitLines } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") {
    throw new Error("Admin access required.");
  }

  return supabase;
}

export async function updateTemplate(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("template_id") ?? "");

  const { error } = await supabase
    .from("calendar_templates")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addTemplateActivity(formData: FormData) {
  const supabase = await requireAdmin();
  const templateId = String(formData.get("template_id") ?? "");

  const { error } = await supabase.from("template_activities").insert({
    template_id: templateId,
    season_id: String(formData.get("season_id") ?? ""),
    title: String(formData.get("title") ?? "").trim(),
    date_label: String(formData.get("date_label") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    notes: splitLines(formData.get("notes")),
    locations: splitLines(formData.get("locations")),
    tags: splitLines(formData.get("tags")),
    sort_order: Number(formData.get("sort_order") ?? 100),
    is_featured: formData.get("is_featured") === "on",
    is_published: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateTemplateActivity(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("activity_id") ?? "");

  const { error } = await supabase
    .from("template_activities")
    .update({
      season_id: String(formData.get("season_id") ?? ""),
      title: String(formData.get("title") ?? "").trim(),
      date_label: String(formData.get("date_label") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      notes: splitLines(formData.get("notes")),
      locations: splitLines(formData.get("locations")),
      tags: splitLines(formData.get("tags")),
      sort_order: Number(formData.get("sort_order") ?? 0),
      is_featured: formData.get("is_featured") === "on",
      is_published: formData.get("is_published") === "on",
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteTemplateActivity(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("activity_id") ?? "");

  const { error } = await supabase.from("template_activities").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}
