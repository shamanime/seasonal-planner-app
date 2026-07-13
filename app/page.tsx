import Link from "next/link";
import { ActivityCard } from "@/components/activity-card";
import { PointerGlowSection } from "@/components/pointer-glow-section";
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

  const { data: quotaRows } = user ? await supabase.rpc("get_calendar_quota") : { data: null };
  const quota = quotaRows?.[0];
  const hasCalendarSlot = !quota || Number(quota.calendar_count) < Number(quota.calendar_limit);
  const groups = groupActivitiesBySeason((seasons ?? []) as Season[], (activities ?? []) as Activity[]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">A seasonal guide for every family</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-semibold leading-[1.02] text-ink md:text-7xl">
            More good days, already planned.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink/75">
            Start with a year of simple family outings, cozy traditions, and little adventures—then make it yours with
            the places and plans your family loves.
          </p>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Ideas for every season">
            <span className="family-moment">
              <span aria-hidden="true">🌱</span> Little adventures
            </span>
            <span className="family-moment">
              <span aria-hidden="true">🍓</span> Family favourites
            </span>
            <span className="family-moment">
              <span aria-hidden="true">✨</span> Cozy traditions
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#calendar"
              className="rounded-full bg-leaf px-5 py-3 text-sm font-bold text-white shadow-card hover:bg-leaf/90"
            >
              Explore family activities
            </a>
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-ink shadow-card hover:bg-cream"
              >
                Open dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-ink shadow-card hover:bg-cream"
              >
                Sign in to customize
              </Link>
            )}
          </div>
        </div>

        <form
          action={cloneTemplate}
          className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-card backdrop-blur"
        >
          <input type="hidden" name="template_id" value={template?.id ?? ""} />
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-terracotta">Make it yours</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">Create your family calendar</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            Begin with our ideas, then add your favourite places, hide what does not fit, and plan the year together.
          </p>
          {user && quota ? (
            <p className="mt-4 text-sm font-bold" aria-live="polite">
              {Number(quota.calendar_count)} of {Number(quota.calendar_limit)} calendar slots used
            </p>
          ) : null}
          <label className="mt-5 block text-sm font-bold" htmlFor="family_name">
            Family name
          </label>
          <input
            disabled={!hasCalendarSlot}
            id="family_name"
            name="family_name"
            placeholder="e.g. The Parkers"
            className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-leaf/30 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            disabled={!hasCalendarSlot}
            className="mt-5 w-full rounded-2xl bg-leaf px-5 py-3 font-bold text-white shadow-sm hover:bg-leaf/90 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
          >
            {!hasCalendarSlot ? "Calendar limit reached" : user ? "Make this calendar ours" : "Sign in to make it ours"}
          </button>
        </form>
      </section>

      <section id="calendar" className="space-y-10">
        {template ? (
          <PointerGlowSection className="calendar-intro pointer-glow-surface overflow-hidden rounded-[2rem] p-6 text-white shadow-card md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-peach">Your year of family time</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold">{template.title}</h2>
            <p className="mt-3 max-w-3xl text-white/80">{template.description}</p>
          </PointerGlowSection>
        ) : (
          <div className="rounded-[2rem] bg-white/80 p-8 shadow-card">
            Run `supabase/schema.sql` to seed the first calendar template.
          </div>
        )}

        {groups.map(({ season, activities: seasonActivities }) => (
          <div key={season.id} className="season-theme season-group space-y-5" data-season={season.name.toLowerCase()}>
            <div className="season-heading flex items-center gap-4">
              <span className="season-icon" aria-hidden="true">
                {season.emoji}
              </span>
              <div>
                <p className="season-kicker text-xs font-bold uppercase tracking-[0.2em]">Ideas for the</p>
                <h2 className="font-serif text-4xl font-semibold">{season.name}</h2>
              </div>
            </div>
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
