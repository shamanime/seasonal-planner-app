import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: calendar } = await supabase
    .rpc("get_shared_calendar", { p_slug: slug, p_require_kiosk: false })
    .select("title")
    .single();

  return {
    title: calendar?.title ?? "Shared Seasonal Calendar",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function SharedCalendarLayout({ children }: { children: ReactNode }) {
  return children;
}
