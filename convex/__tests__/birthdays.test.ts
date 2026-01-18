import { describe, it, expect } from "vitest";
import {
  getMonthDay,
  isLeapYear,
  isBirthdayOnDate,
  generateBirthdayMessage,
} from "../birthdays";

/**
 * Tests for birthday feature date logic.
 *
 * These tests verify the date parsing and leap year handling logic.
 */

describe("Birthday date logic", () => {
  describe("isLeapYear", () => {
    it("identifies 2024 as a leap year", () => {
      expect(isLeapYear(2024)).toBe(true);
    });

    it("identifies 2023 as not a leap year", () => {
      expect(isLeapYear(2023)).toBe(false);
    });

    it("identifies 1900 as not a leap year (century exception)", () => {
      expect(isLeapYear(1900)).toBe(false);
    });

    it("identifies 2000 as a leap year (400-year exception)", () => {
      expect(isLeapYear(2000)).toBe(true);
    });

    it("identifies 2100 as not a leap year (century exception)", () => {
      expect(isLeapYear(2100)).toBe(false);
    });
  });

  describe("getMonthDay", () => {
    it("correctly parses a regular date", () => {
      // July 15, 2000
      const timestamp = Date.UTC(2000, 6, 15); // month is 0-indexed
      const result = getMonthDay(timestamp, 2024);
      expect(result).toEqual({ month: 7, day: 15 });
    });

    it("correctly parses January 1", () => {
      const timestamp = Date.UTC(1995, 0, 1);
      const result = getMonthDay(timestamp, 2024);
      expect(result).toEqual({ month: 1, day: 1 });
    });

    it("correctly parses December 31", () => {
      const timestamp = Date.UTC(1990, 11, 31);
      const result = getMonthDay(timestamp, 2024);
      expect(result).toEqual({ month: 12, day: 31 });
    });

    it("handles February 28 normally", () => {
      const timestamp = Date.UTC(2000, 1, 28);
      const result = getMonthDay(timestamp, 2024);
      expect(result).toEqual({ month: 2, day: 28 });
    });

    it("treats Feb 29 as Feb 29 in leap years (2024)", () => {
      const timestamp = Date.UTC(2000, 1, 29); // Feb 29, 2000 (leap year)
      const result = getMonthDay(timestamp, 2024); // 2024 is a leap year
      expect(result).toEqual({ month: 2, day: 29 });
    });

    it("treats Feb 29 as Mar 1 in non-leap years (2023)", () => {
      const timestamp = Date.UTC(2000, 1, 29); // Feb 29, 2000
      const result = getMonthDay(timestamp, 2023); // 2023 is not a leap year
      expect(result).toEqual({ month: 3, day: 1 });
    });

    it("treats Feb 29 as Mar 1 in century years (1900)", () => {
      const timestamp = Date.UTC(2000, 1, 29);
      const result = getMonthDay(timestamp, 1900);
      expect(result).toEqual({ month: 3, day: 1 });
    });

    it("treats Feb 29 as Feb 29 in 400-year cycle years (2000)", () => {
      const timestamp = Date.UTC(1996, 1, 29);
      const result = getMonthDay(timestamp, 2000);
      expect(result).toEqual({ month: 2, day: 29 });
    });
  });

  describe("isBirthdayOnDate", () => {
    it("returns true when birthday matches today", () => {
      const checkDate = new Date(Date.UTC(2024, 6, 15, 12, 0)); // July 15, 2024 noon UTC
      const birthdate = Date.UTC(2000, 6, 15); // July 15, 2000

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(true);
    });

    it("returns false when birthday does not match", () => {
      const checkDate = new Date(Date.UTC(2024, 6, 15, 12, 0)); // July 15
      const birthdate = Date.UTC(2000, 6, 16); // July 16

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(false);
    });

    it("returns false when only month matches", () => {
      const checkDate = new Date(Date.UTC(2024, 6, 15, 12, 0)); // July 15
      const birthdate = Date.UTC(2000, 6, 20); // July 20

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(false);
    });

    it("returns false when only day matches", () => {
      const checkDate = new Date(Date.UTC(2024, 6, 15, 12, 0)); // July 15
      const birthdate = Date.UTC(2000, 7, 15); // August 15

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(false);
    });

    it("handles year boundary correctly (Dec 31)", () => {
      const checkDate = new Date(Date.UTC(2024, 11, 31, 12, 0)); // Dec 31, 2024
      const birthdate = Date.UTC(1990, 11, 31); // Dec 31, 1990

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(true);
    });

    it("handles different birth years correctly", () => {
      const checkDate = new Date(Date.UTC(2024, 3, 10, 12, 0)); // April 10, 2024
      const birthdate = Date.UTC(1950, 3, 10); // April 10, 1950

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(true);
    });

    it("matches Feb 29 birthday on Feb 29 in leap year", () => {
      const checkDate = new Date(Date.UTC(2024, 1, 29, 12, 0)); // Feb 29, 2024
      const birthdate = Date.UTC(2000, 1, 29); // Feb 29, 2000

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(true);
    });

    it("matches Feb 29 birthday on Mar 1 in non-leap year", () => {
      const checkDate = new Date(Date.UTC(2023, 2, 1, 12, 0)); // Mar 1, 2023
      const birthdate = Date.UTC(2000, 1, 29); // Feb 29, 2000

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(true);
    });

    it("does NOT match Feb 29 birthday on Feb 28 in non-leap year", () => {
      const checkDate = new Date(Date.UTC(2023, 1, 28, 12, 0)); // Feb 28, 2023
      const birthdate = Date.UTC(2000, 1, 29); // Feb 29, 2000

      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(false);
    });
  });

  describe("generateBirthdayMessage", () => {
    it("returns empty string for empty names array", () => {
      const message = generateBirthdayMessage([], "12345");
      expect(message).toBe("");
    });

    it("generates message containing single person's name", () => {
      const message = generateBirthdayMessage(["Alice"], "12345");
      expect(message).toContain("Alice");
      expect(message).toContain("12345");
      expect(message).toContain("🎂");
    });

    it("generates message containing both names for two people", () => {
      const message = generateBirthdayMessage(["Alice", "Bob"], "12345");
      expect(message).toContain("Alice");
      expect(message).toContain("Bob");
      expect(message).toContain("and");
    });

    it("generates message with Oxford comma for three people", () => {
      const message = generateBirthdayMessage(
        ["Alice", "Bob", "Charlie"],
        "12345"
      );
      expect(message).toContain("Alice");
      expect(message).toContain("Bob");
      expect(message).toContain("Charlie");
      // Should have Oxford comma style
      expect(message).toMatch(/Alice.*Bob.*and.*Charlie/);
    });

    it("includes team number in message", () => {
      const message = generateBirthdayMessage(["Alice"], "98765");
      expect(message).toContain("98765");
    });

    it("uses singular pronouns for one person", () => {
      // Run multiple times to check across random selections
      for (let i = 0; i < 10; i++) {
        const message = generateBirthdayMessage(["Alice"], "12345");
        // Should not have plural "you all" or "each of you" for single person
        expect(message).not.toContain("you all");
        expect(message).not.toContain("each of you");
      }
    });

    it("uses plural pronouns for multiple people", () => {
      // Run multiple times to check across random selections
      let foundPlural = false;
      for (let i = 0; i < 20; i++) {
        const message = generateBirthdayMessage(["Alice", "Bob"], "12345");
        if (message.includes("you all") || message.includes("each of you")) {
          foundPlural = true;
          break;
        }
      }
      // At least some messages should use plural forms
      expect(foundPlural).toBe(true);
    });
  });
});
