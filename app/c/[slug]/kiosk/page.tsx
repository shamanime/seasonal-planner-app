import { notFound } from "next/navigation";
import { activityStatusLabels, getActivityStatus, groupActivitiesBySeason, type Activity, type Season } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export default async function KioskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: calendar } = await supabase
    .from("family_calendars")
    .select("id, title, kiosk_enabled, is_public")
    .eq("share_slug", slug)
    .eq("is_public", true)
    .eq("kiosk_enabled", true)
    .single();

  if (!calendar) {
    notFound();
  }

  const [{ data: seasons }, { data: activities }] = await Promise.all([
    supabase.from("seasons").select("id, name, emoji, sort_order").order("sort_order"),
    supabase
      .from("family_activities")
      .select("id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_favorite, status")
      .eq("calendar_id", calendar.id)
      .eq("is_hidden", false)
      .order("sort_order"),
  ]);

  const groups = groupActivitiesBySeason((seasons ?? []) as Season[], (activities ?? []) as Activity[]);

  return (
    <main className="min-h-screen bg-ink p-4 text-white md:p-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-white/10 p-6 md:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-peach">Kiosk view</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold md:text-7xl">{calendar.title}</h1>
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {groups.map(({ season, activities: seasonActivities }) => (
            <section key={season.id} className="motion-card rounded-[2rem] bg-cream p-5 text-ink shadow-card">
              <h2 className="font-serif text-4xl font-semibold">
                {season.emoji} {season.name}
              </h2>
              <div className="mt-5 space-y-4">
                {seasonActivities.map((activity) => {
                  const status = getActivityStatus(activity.status);

                  return (
                  <article key={activity.id} className={`motion-card rounded-[1.5rem] bg-white p-4 ${status !== "planned" ? "opacity-70" : ""}`}>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">{activity.date_label}</p>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <h3 className="font-serif text-2xl font-semibold">
                        {activity.title}
                        {activity.is_favorite ? <span className="ml-2 text-peach">★</span> : null}
                      </h3>
                      {status !== "planned" ? <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">{activityStatusLabels[status]}</span> : null}
                    </div>
                    {activity.notes?.[0] ? <p className="mt-2 text-sm leading-6 text-ink/72">{activity.notes[0]}</p> : null}
                    {activity.locations?.[0] ? <p className="mt-3 text-sm font-bold">{activity.locations[0]}</p> : null}
                  </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
