import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityCard } from "@/components/activity-card";
import {
	groupActivitiesBySeason,
	type Activity,
	type Season,
} from "@/lib/calendar";
import { createClient } from "@/lib/supabase/server";

export default async function SharedCalendarPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const supabase = await createClient();
	const { data: calendarData } = await supabase
		.rpc("get_shared_calendar", { p_slug: slug, p_require_kiosk: false })
		.single();
	const calendar = calendarData as {
		id: string;
		title: string;
		family_name: string | null;
		share_slug: string;
	} | null;
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!calendar) {
		notFound();
	}

	const [{ data: seasons }, { data: activities }] = await Promise.all([
		supabase
			.from("seasons")
			.select("id, name, emoji, sort_order")
			.order("sort_order"),
		supabase.rpc("get_shared_activities", { p_slug: slug }),
	]);

	const groups = groupActivitiesBySeason(
		(seasons ?? []) as Season[],
		(activities ?? []) as Activity[],
	);

	return (
		<main className="mx-auto max-w-6xl px-5 pb-16">
			<section className="py-10">
				<p className="text-sm font-bold uppercase tracking-[0.24em] text-leaf">
					Shared seasonal calendar
				</p>
				<h1 className="mt-3 font-serif text-5xl font-semibold md:text-6xl">
					{calendar.title}
				</h1>
				<p className="mt-4 max-w-2xl text-lg leading-8 text-ink/70">
					A simple seasonal plan for easy outings and family coordination.
				</p>
				<div className="no-print mt-6 flex flex-wrap gap-3">
					<Link
						href={`/c/${calendar.share_slug}/kiosk`}
						className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white"
					>
						Kiosk mode
					</Link>
					<span className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-card">
						Print or save PDF from browser
					</span>
				</div>
			</section>
			{!user ? (
				<aside className="no-print mb-10 rounded-[2rem] bg-ink p-6 text-white shadow-card md:flex md:items-center md:justify-between md:gap-8 md:p-8">
					<div>
						<p className="text-sm font-bold uppercase tracking-[0.2em] text-peach">
							Plan your own seasons
						</p>
						<h2 className="mt-3 font-serif text-3xl font-semibold">
							Create a calendar your family can make its own.
						</h2>
						<p className="mt-3 max-w-2xl leading-7 text-white/75">
							Create a free account or sign in to customize activities, add
							local favorites, and share your own seasonal plan.
						</p>
					</div>
					<Link
						href={`/login?next=${encodeURIComponent(`/c/${calendar.share_slug}`)}`}
						className="mt-6 inline-flex shrink-0 rounded-full bg-peach px-5 py-3 text-sm font-bold text-ink hover:bg-white md:mt-0"
					>
						Create an account or sign in
					</Link>
				</aside>
			) : null}
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
