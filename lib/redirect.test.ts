import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "./redirect";

describe("getSafeRedirectPath", () => {
  it("keeps same-origin paths, queries, and fragments", () => {
    expect(getSafeRedirectPath("/calendar/123/edit?tab=details#title")).toBe("/calendar/123/edit?tab=details#title");
  });

  it.each([
    "https://attacker.example/path",
    "//attacker.example/path",
    "/\\attacker.example/path",
    "/\\/attacker.example/path",
    "/foo/..//attacker.example/path",
    "/.//attacker.example/path",
    "/a/%2e%2e//attacker.example/path",
    "dashboard",
  ])("rejects an external or malformed redirect target: %s", (target) => {
    expect(getSafeRedirectPath(target)).toBe("/dashboard");
  });

  it("uses the requested fallback for an empty target", () => {
    expect(getSafeRedirectPath(null, "/")).toBe("/");
  });
});
