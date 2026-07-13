import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { addActivity, deleteActivity, updateActivity, updateCalendar } from "./actions";
import {
  activityStatusLabels,
  groupActivitiesBySeason,
  MAX_ACTIVITIES_PER_SEASON,
  type Activity,
  type ActivityStatus,
  type Season,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export default async function EditCalendarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/calendar/${id}/edit`);
  }

  const { data: calendar } = await supabase
    .from("family_calendars")
    .select("id, owner_id, title, family_name, share_slug, is_public, kiosk_enabled")
    .eq("id", id)
    .single();

  if (!calendar) {
    notFound();
  }

  if (calendar.owner_id !== user.id) {
    redirect(`/c/${calendar.share_slug}`);
  }

  const [{ data: seasons }, { data: activities }] = await Promise.all([
    supabase.from("seasons").select("id, name, emoji, sort_order").order("sort_order"),
    supabase
      .from("family_activities")
      .select("id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_hidden, is_favorite, status")
      .eq("calendar_id", id)
      .order("sort_order"),
  ]);

  const typedSeasons = (seasons ?? []) as Season[];
  const typedActivities = (activities ?? []) as Activity[];
  const groups = groupActivitiesBySeason(typedSeasons, typedActivities);
  const activityCounts = new Map(
    typedSeasons.map((season) => [
      season.id,
      typedActivities.filter((activity) => activity.season_id === season.id).length,
    ]),
  );
  const hasAvailableSeason = typedSeasons.some(
    (season) => (activityCounts.get(season.id) ?? 0) < MAX_ACTIVITIES_PER_SEASON,
  );

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="py-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">Family editor</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">{calendar.title}</h1>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/c/${calendar.share_slug}`} className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white">
            Share view
          </Link>
          <Link href={`/c/${calendar.share_slug}/kiosk`} className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-card">
            Kiosk view
          </Link>
          <Link href="/dashboard" className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-card">
            Dashboard
          </Link>
        </div>
      </section>

      <form action={updateCalendar} className="motion-card grid gap-4 rounded-[2rem] bg-white/80 p-5 shadow-card md:grid-cols-2">
        <input type="hidden" name="calendar_id" value={calendar.id} />
        <label className="block text-sm font-bold">
          Calendar title
          <input name="title" defaultValue={calendar.title} required className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
        </label>
        <label className="block text-sm font-bold">
          Family name
          <input name="family_name" defaultValue={calendar.family_name ?? ""} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
        </label>
        <label className="flex items-center gap-3 text-sm font-bold">
          <input name="is_public" type="checkbox" defaultChecked={calendar.is_public} className="h-5 w-5" />
          Enable share link
        </label>
        <label className="flex items-center gap-3 text-sm font-bold">
          <input name="kiosk_enabled" type="checkbox" defaultChecked={calendar.kiosk_enabled} className="h-5 w-5" />
          Enable kiosk view
        </label>
        <button className="rounded-2xl bg-leaf px-5 py-3 font-bold text-white md:col-span-2" type="submit">
          Save calendar settings
        </button>
      </form>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          {groups.map(({ season, activities: seasonActivities }) => (
            <div key={season.id} className="space-y-4">
              <h2 className="font-serif text-4xl font-semibold">
                {season.emoji} {season.name}
              </h2>
              {seasonActivities.map((activity) => (
                <form key={activity.id} action={updateActivity} className="motion-card rounded-[1.75rem] bg-white/80 p-5 shadow-card">
                  <input type="hidden" name="calendar_id" value={calendar.id} />
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <div className="grid gap-4 md:grid-cols-[1fr_10rem]">
                    <label className="block text-sm font-bold">
                      Title
                      <input name="title" defaultValue={activity.title} required className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                    </label>
                    <label className="block text-sm font-bold">
                      Order
                      <input name="sort_order" type="number" defaultValue={activity.sort_order} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                    </label>
                  </div>
                  <label className="mt-4 block text-sm font-bold">
                    Date label
                    <input name="date_label" defaultValue={activity.date_label ?? ""} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                  </label>
                  <label className="mt-4 block text-sm font-bold">
                    Status
                    <select name="status" defaultValue={activity.status ?? "planned"} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3">
                      {Object.entries(activityStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-4 block text-sm font-bold">
                    Description
                    <textarea name="description" defaultValue={activity.description ?? ""} rows={2} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                  </label>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <label className="block text-sm font-bold">
                      Notes, one per line
                      <textarea name="notes" defaultValue={(activity.notes ?? []).join("\n")} rows={4} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                    </label>
                    <label className="block text-sm font-bold">
                      Locations, one per line
                      <textarea name="locations" defaultValue={(activity.locations ?? []).join("\n")} rows={4} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                    </label>
                    <label className="block text-sm font-bold">
                      Tags, one per line
                      <textarea name="tags" defaultValue={(activity.tags ?? []).join("\n")} rows={4} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <input name="is_favorite" type="checkbox" defaultChecked={Boolean(activity.is_favorite)} className="h-5 w-5" />
                      Favorite
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold">
                      <input name="is_hidden" type="checkbox" defaultChecked={Boolean(activity.is_hidden)} className="h-5 w-5" />
                      Hide from share view
                    </label>
                    <button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white" type="submit">
                      Save activity
                    </button>
                    <button formAction={deleteActivity} className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-800" type="submit">
                      Delete
                    </button>
                  </div>
                </form>
              ))}
            </div>
          ))}
        </div>

        <aside className="motion-card h-fit rounded-[1.75rem] bg-ink p-5 text-white shadow-card">
          <h2 className="font-serif text-3xl font-semibold">Add activity</h2>
          <p className="mt-2 text-sm text-white/70">
            Each season can hold up to {MAX_ACTIVITIES_PER_SEASON} activities.
          </p>
          <form action={addActivity} className="mt-5 space-y-4">
            <input type="hidden" name="calendar_id" value={calendar.id} />
            <select name="season_id" required className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              {typedSeasons.map((season) => {
                const count = activityCounts.get(season.id) ?? 0;
                const isFull = count >= MAX_ACTIVITIES_PER_SEASON;

                return (
                  <option key={season.id} value={season.id} disabled={isFull} className="text-ink">
                    {season.name} ({count}/{MAX_ACTIVITIES_PER_SEASON}){isFull ? " — full" : ""}
                  </option>
                );
              })}
            </select>
            <input name="title" required placeholder="Activity title" className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
            <input name="date_label" placeholder="Timing" className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
            <select name="status" defaultValue="planned" className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              {Object.entries(activityStatusLabels).map(([value, label]) => (
                <option key={value} value={value as ActivityStatus} className="text-ink">
                  {label}
                </option>
              ))}
            </select>
            <textarea name="description" placeholder="Description" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
            <textarea name="notes" placeholder="Notes, one per line" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
            <textarea name="locations" placeholder="Locations, one per line" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
            <textarea name="tags" placeholder="Tags, one per line" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
            <input name="sort_order" type="number" defaultValue={100} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3" />
            <button
              className="w-full rounded-2xl bg-peach px-4 py-3 font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              disabled={!hasAvailableSeason}
            >
              {hasAvailableSeason ? "Add custom activity" : "All seasons are full"}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
