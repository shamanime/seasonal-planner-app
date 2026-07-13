import { describe, expect, it } from "vitest";

import { redactAnalyticsUrl } from "./analytics";

describe("redactAnalyticsUrl", () => {
  it("redacts bearer share slugs and strips query data", () => {
    expect(
      redactAnalyticsUrl("https://calendar.example/c/family-calendar-secret-token/kiosk?next=/private#activity"),
    ).toBe("https://calendar.example/c/[redacted]/kiosk");
  });

  it("strips query strings from non-share routes", () => {
    expect(redactAnalyticsUrl("https://calendar.example/login?error=sensitive")).toBe("https://calendar.example/login");
  });

  it("drops malformed URLs", () => {
    expect(redactAnalyticsUrl("not a url")).toBeUndefined();
  });
});
