import Link from "next/link";
import { ActivityCard } from "@/components/activity-card";
import { cloneTemplate } from "@/app/actions";
import { groupActivitiesBySeason, type Activity, type Season } from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: template } = await supabase
    .from("calendar_templates")
    .select("id, title, description")
    .eq("is_published", true)
    .order("created_at")
    .limit(1)
    .single();

  const [{ data: seasons }, { data: activities }] = await Promise.all([
    supabase.from("seasons").select("id, name, emoji, sort_order").order("sort_order"),
    template
      ? supabase
          .from("template_activities")
          .select("id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_featured")
          .eq("template_id", template.id)
          .eq("is_published", true)
          .order("sort_order")
      : Promise.resolve({ data: [] }),
  ]);

  const groups = groupActivitiesBySeason((seasons ?? []) as Season[], (activities ?? []) as Activity[]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">A seasonal guide for every family</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-semibold leading-[1.02] text-ink md:text-7xl">
            Seasonal plans you can actually use.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/75">
            Start with a curated seasonal activity calendar, then make a personal copy and tailor the activities, locations, and notes to wherever your family lives.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#calendar" className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-card hover:bg-black">
              Browse the calendar
            </a>
            {user ? (
              <Link href="/dashboard" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-ink shadow-card hover:bg-cream">
                Open dashboard
              </Link>
            ) : (
              <Link href="/login" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-ink shadow-card hover:bg-cream">
                Sign in to customize
              </Link>
            )}
          </div>
        </div>

        <form action={cloneTemplate} className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-card backdrop-blur">
          <input type="hidden" name="template_id" value={template?.id ?? ""} />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-peach">Make it yours</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Create your personal calendar</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            Use this template as a starting point, then hide, edit, favorite, and add activities near you.
          </p>
          <label className="mt-5 block text-sm font-bold" htmlFor="family_name">
            Family name
          </label>
          <input
            id="family_name"
            name="family_name"
            placeholder="The Smiths"
            className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-leaf/30 focus:ring-4"
          />
          <button className="mt-5 w-full rounded-2xl bg-leaf px-5 py-3 font-bold text-white shadow-sm hover:bg-leaf/90" type="submit">
            {user ? "Clone & edit this calendar" : "Sign in and clone"}
          </button>
        </form>
      </section>

      <section id="calendar" className="space-y-10">
        {template ? (
          <div className="rounded-[2rem] bg-ink p-6 text-white shadow-card md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-peach">Template</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold">{template.title}</h2>
            <p className="mt-3 max-w-3xl text-white/75">{template.description}</p>
          </div>
        ) : (
          <div className="rounded-[2rem] bg-white/80 p-8 shadow-card">Run `supabase/schema.sql` to seed the first calendar template.</div>
        )}

        {groups.map(({ season, activities: seasonActivities }) => (
          <div key={season.id} className="space-y-5">
            <h2 className="font-serif text-4xl font-semibold">
              <span aria-hidden="true">{season.emoji} </span>
              {season.name}
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
