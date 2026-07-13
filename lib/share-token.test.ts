import { describe, expect, it } from "vitest";

import { generateShareToken } from "./share-token";

describe("generateShareToken", () => {
  it("returns a 16-character Base64URL token with 96 bits of entropy", () => {
    expect(generateShareToken()).toMatch(/^[A-Za-z0-9_-]{16}$/);
  });

  it("generates independent tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, generateShareToken));

    expect(tokens.size).toBe(100);
  });
});
