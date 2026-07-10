import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: calendar } = await supabase
    .from("family_calendars")
    .select("title")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .single();

  return {
    title: calendar?.title ?? "Shared Seasonal Calendar",
  };
}

export default function SharedCalendarLayout({ children }: { children: ReactNode }) {
  return children;
}
