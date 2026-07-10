import Link from "next/link";
import { redirect } from "next/navigation";
import { cloneTemplate, signOut } from "@/app/actions";
import { CopyShareLinkButton } from "@/components/copy-share-link-button";
import { DeleteCalendarButton } from "@/components/delete-calendar-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: calendars }, { data: template }] = await Promise.all([
    supabase.from("family_calendars").select("id, title, family_name, share_slug, is_public, created_at").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("calendar_templates").select("id, title").eq("is_published", true).order("created_at").limit(1).single(),
  ]);

  return (
    <main className="mx-auto max-w-5xl px-5 pb-16">
      <section className="flex flex-wrap items-end justify-between gap-5 py-10">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">Dashboard</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold">Your seasonal calendars</h1>
        </div>
        <form action={signOut}>
          <button className="rounded-full bg-white px-5 py-3 text-sm font-bold shadow-card" type="submit">
            Sign out
          </button>
        </form>
      </section>

      <div className="grid gap-5 md:grid-cols-[1fr_18rem]">
        <section className="space-y-4">
          {calendars?.length ? (
            calendars.map((calendar) => (
              <article key={calendar.id} className="motion-card rounded-[1.75rem] bg-white/80 p-5 shadow-card">
                <h2 className="font-serif text-3xl font-semibold">{calendar.title}</h2>
                <div className="mt-2 flex items-center gap-2 text-sm text-ink/65">
                  <p className="break-all">Share link: /c/{calendar.share_slug}</p>
                  <CopyShareLinkButton path={`/c/${calendar.share_slug}`} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link className="motion-soft rounded-full bg-ink px-4 py-2 text-sm font-bold text-white" href={`/calendar/${calendar.id}/edit`}>
                    Edit
                  </Link>
                  <Link className="motion-soft rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm" href={`/c/${calendar.share_slug}`}>
                    Share view
                  </Link>
                  <Link className="motion-soft rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm" href={`/c/${calendar.share_slug}/kiosk`}>
                    Kiosk
                  </Link>
                </div>
                <div className="mt-4">
                  <DeleteCalendarButton calendarId={calendar.id} title={calendar.title} />
                </div>
              </article>
            ))
          ) : (
            <div className="motion-card rounded-[1.75rem] bg-white/80 p-8 shadow-card">No seasonal calendars yet. Create your first copy.</div>
          )}
        </section>

        <aside className="rounded-[1.75rem] bg-ink p-5 text-white shadow-card">
          <h2 className="font-serif text-3xl font-semibold">Start fresh</h2>
          <p className="mt-3 text-sm leading-6 text-white/72">Clone the public template and customize it for another season, trip, or household.</p>
          <form action={cloneTemplate} className="mt-5 space-y-3">
            <input type="hidden" name="template_id" value={template?.id ?? ""} />
            <input name="family_name" placeholder="Family name" className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 outline-none placeholder:text-white/50" />
            <button className="w-full rounded-2xl bg-peach px-4 py-3 font-bold text-ink" type="submit">
              Clone template
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
