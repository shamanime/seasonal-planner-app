import { redirect } from "next/navigation";
import { addTemplateActivity, deleteTemplateActivity, updateTemplate, updateTemplateActivity } from "./actions";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") {
    return (
      <main className="mx-auto max-w-3xl px-5 pb-16 pt-10">
        <section className="rounded-[2rem] bg-white/80 p-8 shadow-card">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-peach">Admin setup needed</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold">Your account is not an admin yet.</h1>
          <p className="mt-4 leading-7 text-ink/70">After signing in once, run this in Supabase SQL editor with your email address:</p>
          <pre className="mt-5 overflow-x-auto rounded-2xl bg-ink p-4 text-sm text-white">
            {`update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');`}
          </pre>
        </section>
      </main>
    );
  }

  const [{ data: template }, { data: seasons }] = await Promise.all([
    supabase.from("calendar_templates").select("id, title, description, is_published").order("created_at").limit(1).single(),
    supabase.from("seasons").select("id, name, emoji, sort_order").order("sort_order"),
  ]);

  const { data: activities } = template
    ? await supabase
        .from("template_activities")
        .select("id, season_id, title, date_label, description, notes, locations, tags, sort_order, is_featured, is_published")
        .eq("template_id", template.id)
        .order("sort_order")
    : { data: [] };

  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <section className="py-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">Admin</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold">Main template editor</h1>
        <p className="mt-4 max-w-2xl leading-7 text-ink/70">Changes here affect the public template and future cloned calendars. Existing family copies stay independent.</p>
      </section>

      {template ? (
        <form action={updateTemplate} className="rounded-[2rem] bg-white/80 p-5 shadow-card">
          <input type="hidden" name="template_id" value={template.id} />
          <label className="block text-sm font-bold">
            Template title
            <input name="title" defaultValue={template.title} required className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
          </label>
          <label className="mt-4 block text-sm font-bold">
            Description
            <textarea name="description" defaultValue={template.description ?? ""} rows={3} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
          </label>
          <label className="mt-4 flex items-center gap-3 text-sm font-bold">
            <input name="is_published" type="checkbox" defaultChecked={template.is_published} className="h-5 w-5" />
            Published
          </label>
          <button className="mt-4 rounded-2xl bg-leaf px-5 py-3 font-bold text-white" type="submit">
            Save template
          </button>
        </form>
      ) : null}

      {template ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-5">
            {activities?.map((activity) => (
              <form key={activity.id} action={updateTemplateActivity} className="rounded-[1.75rem] bg-white/80 p-5 shadow-card">
                <input type="hidden" name="activity_id" value={activity.id} />
                <div className="grid gap-4 md:grid-cols-[1fr_12rem_8rem]">
                  <label className="block text-sm font-bold">
                    Title
                    <input name="title" defaultValue={activity.title} required className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                  </label>
                  <label className="block text-sm font-bold">
                    Season
                    <select name="season_id" defaultValue={activity.season_id} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3">
                      {(seasons ?? []).map((season) => (
                        <option key={season.id} value={season.id}>
                          {season.name}
                        </option>
                      ))}
                    </select>
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
                  Description
                  <textarea name="description" defaultValue={activity.description ?? ""} rows={2} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                </label>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <textarea name="notes" aria-label="Notes" defaultValue={(activity.notes ?? []).join("\n")} rows={4} className="rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                  <textarea name="locations" aria-label="Locations" defaultValue={(activity.locations ?? []).join("\n")} rows={4} className="rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                  <textarea name="tags" aria-label="Tags" defaultValue={(activity.tags ?? []).join("\n")} rows={4} className="rounded-2xl border border-ink/10 bg-white px-4 py-3" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input name="is_featured" type="checkbox" defaultChecked={activity.is_featured} className="h-5 w-5" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input name="is_published" type="checkbox" defaultChecked={activity.is_published} className="h-5 w-5" />
                    Published
                  </label>
                  <button className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white" type="submit">
                    Save
                  </button>
                  <button formAction={deleteTemplateActivity} className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-800" type="submit">
                    Delete
                  </button>
                </div>
              </form>
            ))}
          </div>

          <aside className="h-fit rounded-[1.75rem] bg-ink p-5 text-white shadow-card">
            <h2 className="font-serif text-3xl font-semibold">Add template item</h2>
            <form action={addTemplateActivity} className="mt-5 space-y-4">
              <input type="hidden" name="template_id" value={template.id} />
              <select name="season_id" className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                {(seasons ?? []).map((season) => (
                  <option key={season.id} value={season.id} className="text-ink">
                    {season.name}
                  </option>
                ))}
              </select>
              <input name="title" required placeholder="Activity title" className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
              <input name="date_label" placeholder="Timing" className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
              <textarea name="description" placeholder="Description" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
              <textarea name="notes" placeholder="Notes, one per line" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
              <textarea name="locations" placeholder="Locations, one per line" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
              <textarea name="tags" placeholder="Tags, one per line" rows={3} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 placeholder:text-white/50" />
              <input name="sort_order" type="number" defaultValue={100} className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3" />
              <label className="flex items-center gap-2 text-sm font-bold">
                <input name="is_featured" type="checkbox" className="h-5 w-5" />
                Featured
              </label>
              <button className="w-full rounded-2xl bg-peach px-4 py-3 font-bold text-ink" type="submit">
                Add activity
              </button>
            </form>
          </aside>
        </section>
      ) : null}
    </main>
  );
}
