import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/activity-card";
import { groupActivitiesBySeason, type Activity, type Season } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export default async function SharedCalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: calendar } = await supabase
    .from("family_calendars")
    .select("id, title, family_name, share_slug, is_public")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .single();

  if (!calendar) {
    notFound();
  }

  const [{ data: seasons }, { data: activities }] = await Promise.all([
    supabase.from("seasons").select("id, name, emoji, sort_order").order("sort_order"),
    supabase
      .from("family_activities")
      .select("id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_favorite")
      .eq("calendar_id", calendar.id)
      .eq("is_hidden", false)
      .order("sort_order"),
  ]);

  const groups = groupActivitiesBySeason((seasons ?? []) as Season[], (activities ?? []) as Activity[]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="py-10">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">Shared family calendar</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold md:text-6xl">{calendar.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">A simple seasonal plan for easy outings and family coordination.</p>
        <div className="no-print mt-6 flex flex-wrap gap-3">
          <Link href={`/c/${calendar.share_slug}/kiosk`} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
            Kiosk mode
          </Link>
          <span className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-card">
            Print or save PDF from browser
          </span>
        </div>
      </section>
      <section className="space-y-10">
        {groups.map(({ season, activities: seasonActivities }) => (
          <div key={season.id} className="space-y-5">
            <h2 className="font-serif text-4xl font-semibold">
              {season.emoji} {season.name}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {seasonActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
