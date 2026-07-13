import { describe, expect, it } from "vitest";

import {
  getActivityStatus,
  groupActivitiesBySeason,
  slugify,
  splitLines,
  type Activity,
  type Season,
} from "./calendar";

const seasons: Season[] = [
  { id: "winter", name: "Winter", emoji: "❄️", sort_order: 1 },
  { id: "summer", name: "Summer", emoji: "☀️", sort_order: 2 },
  { id: "empty", name: "Empty", emoji: null, sort_order: 3 },
];

function activity(id: string, seasonId: string, sortOrder: number): Activity {
  return {
    id,
    season_id: seasonId,
    title: id,
    date_label: null,
    description: null,
    notes: null,
    locations: null,
    tags: null,
    sort_order: sortOrder,
  };
}

describe("getActivityStatus", () => {
  it.each(["completed", "skipped", "expired"] as const)("keeps the supported %s status", (status) => {
    expect(getActivityStatus(status)).toBe(status);
  });

  it.each(["planned", "unknown", null, undefined, 1])("defaults %j to planned", (status) => {
    expect(getActivityStatus(status)).toBe("planned");
  });
});

describe("groupActivitiesBySeason", () => {
  it("groups in season order, sorts activities, and omits empty seasons", () => {
    const activities = [
      activity("summer-late", "summer", 2),
      activity("winter", "winter", 1),
      activity("summer-early", "summer", 1),
      activity("orphan", "missing", 1),
    ];

    const groups = groupActivitiesBySeason(seasons, activities);

    expect(groups.map(({ season }) => season.id)).toEqual(["winter", "summer"]);
    expect(groups[1].activities.map(({ id }) => id)).toEqual(["summer-early", "summer-late"]);
    expect(activities.map(({ id }) => id)).toEqual(["summer-late", "winter", "summer-early", "orphan"]);
  });
});

describe("slugify", () => {
  it("normalizes separators and trims them from both ends", () => {
    expect(slugify("  Summer Fun & Games!  ")).toBe("summer-fun-games");
  });

  it("limits slugs to 42 characters", () => {
    expect(slugify("A".repeat(50))).toBe("a".repeat(42));
  });
});

describe("splitLines", () => {
  it("trims lines and removes blank entries", () => {
    expect(splitLines(" First line \n\n Second line\r\n  ")).toEqual(["First line", "Second line"]);
  });

  it("returns an empty list for a missing value", () => {
    expect(splitLines(null)).toEqual([]);
  });
});
