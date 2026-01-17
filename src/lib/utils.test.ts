import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, formatDateTime } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const showBar = false;
    expect(cn("foo", showBar && "bar", "baz")).toBe("foo baz");
  });

  it("merges tailwind classes correctly", () => {
    // twMerge should resolve conflicting tailwind classes
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles undefined and null", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});

describe("formatCurrency", () => {
  it("formats cents to dollars", () => {
    expect(formatCurrency(1000)).toBe("$10.00");
    expect(formatCurrency(1234)).toBe("$12.34");
    expect(formatCurrency(99)).toBe("$0.99");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("handles large amounts", () => {
    expect(formatCurrency(100000)).toBe("$1,000.00");
    expect(formatCurrency(1234567)).toBe("$12,345.67");
  });

  it("handles negative amounts", () => {
    expect(formatCurrency(-500)).toBe("-$5.00");
  });
});

describe("formatDate", () => {
  it("formats a Date object", () => {
    const date = new Date("2024-03-15T12:00:00Z");
    // Note: This will format based on UTC, actual output depends on timezone
    const result = formatDate(date);
    expect(result).toMatch(/Mar 15, 2024/);
  });

  it("formats a timestamp number", () => {
    const timestamp = new Date("2024-12-25T00:00:00Z").getTime();
    const result = formatDate(timestamp);
    expect(result).toMatch(/Dec 2[45], 2024/); // Timezone may affect day
  });
});

describe("formatDateTime", () => {
  it("formats a Date object with time", () => {
    const date = new Date("2024-03-15T14:30:00Z");
    const result = formatDateTime(date);
    expect(result).toMatch(/Mar 15, 2024/);
    // Time portion depends on timezone
    expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
  });

  it("formats a timestamp number with time", () => {
    const timestamp = new Date("2024-07-04T18:00:00Z").getTime();
    const result = formatDateTime(timestamp);
    expect(result).toMatch(/Jul 4, 2024/);
    expect(result).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i);
  });
});
