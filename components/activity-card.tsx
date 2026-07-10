import { activityStatusLabels, getActivityStatus, type Activity } from "@/lib/calendar";

export function ActivityCard({ activity }: { activity: Activity }) {
  const status = getActivityStatus(activity.status);
  const isInactive = status !== "planned";

  return (
    <article className={`rounded-[1.75rem] border border-white/70 bg-white/78 p-5 shadow-card backdrop-blur ${isInactive ? "opacity-75" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {activity.date_label ? <p className="text-sm font-bold uppercase tracking-[0.18em] text-leaf">{activity.date_label}</p> : null}
          <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-ink">
            {activity.title}
            {activity.is_featured || activity.is_favorite ? <span className="ml-2 text-peach">★</span> : null}
          </h3>
        </div>
        {status !== "planned" ? (
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {activityStatusLabels[status]}
          </span>
        ) : null}
      </div>
      {activity.description ? <p className="mt-3 text-base leading-7 text-ink/78">{activity.description}</p> : null}
      {activity.notes?.length ? (
        <ul className="mt-4 space-y-2 text-sm leading-6 text-ink/80">
          {activity.notes.map((note) => (
            <li key={note} className="rounded-2xl bg-cream px-3 py-2">
              {note}
            </li>
          ))}
        </ul>
      ) : null}
      {activity.locations?.length ? (
        <div className="mt-4 space-y-2">
          {activity.locations.map((location) => (
            <p key={location} className="text-sm font-semibold text-ink/85">
              <span aria-hidden="true">📍 </span>
              {location}
            </p>
          ))}
        </div>
      ) : null}
      {activity.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activity.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-skywash px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink/70">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
