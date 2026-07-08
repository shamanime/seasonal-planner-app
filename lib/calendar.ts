export type Season = {
  id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
};

export type Activity = {
  id: string;
  season_id: string;
  title: string;
  date_label: string | null;
  description: string | null;
  notes: string[] | null;
  locations: string[] | null;
  tags: string[] | null;
  sort_order: number;
  is_featured?: boolean | null;
  is_hidden?: boolean | null;
  is_favorite?: boolean | null;
};

export function groupActivitiesBySeason<T extends Activity>(seasons: Season[], activities: T[]) {
  return seasons
    .map((season) => ({
      season,
      activities: activities
        .filter((activity) => activity.season_id === season.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((group) => group.activities.length > 0);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
}

export function splitLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
