import { describe, expect, test } from "bun:test";

describe("example", () => {
  test("addition works", () => {
    expect(1 + 1).toBe(2);
  });

  test("strings concatenate", () => {
    expect("Build" + "Season").toBe("BuildSeason");
  });
});
