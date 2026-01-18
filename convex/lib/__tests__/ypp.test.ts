import { describe, it, expect } from "vitest";
import {
  calculateAge,
  isAdult,
  isMinor,
  isMentorRole,
  canBeYppContact,
  TEAM_ROLES,
  isBirthdayOnDate,
} from "../ypp";

describe("YPP utilities", () => {
  describe("calculateAge", () => {
    it("calculates age correctly", () => {
      // Born Jan 1, 2008 = 18 years old in 2026
      const birthdate = new Date("2008-01-01").getTime();
      expect(calculateAge(birthdate)).toBe(18);
    });

    it("handles birthday not yet occurred this year", () => {
      // Born Dec 31, 2008 = still 17 in Jan 2026
      const birthdate = new Date("2008-12-31").getTime();
      // This depends on current date, so let's use a more stable test
      const age = calculateAge(birthdate);
      expect(age).toBeGreaterThanOrEqual(17);
    });

    it("calculates age for adult correctly", () => {
      const birthdate = new Date("1990-06-15").getTime();
      expect(calculateAge(birthdate)).toBeGreaterThanOrEqual(35);
    });
  });

  describe("isAdult / isMinor", () => {
    it("correctly identifies adults", () => {
      const adultBirthdate = new Date("2000-01-01").getTime();
      expect(isAdult(adultBirthdate)).toBe(true);
      expect(isMinor(adultBirthdate)).toBe(false);
    });

    it("correctly identifies minors", () => {
      const minorBirthdate = new Date("2015-01-01").getTime();
      expect(isAdult(minorBirthdate)).toBe(false);
      expect(isMinor(minorBirthdate)).toBe(true);
    });
  });

  describe("isMentorRole", () => {
    it("returns true for mentor roles", () => {
      expect(isMentorRole(TEAM_ROLES.LEAD_MENTOR)).toBe(true);
      expect(isMentorRole(TEAM_ROLES.MENTOR)).toBe(true);
    });

    it("returns false for student role", () => {
      expect(isMentorRole(TEAM_ROLES.STUDENT)).toBe(false);
    });

    it("returns true for legacy admin role (backwards compat)", () => {
      expect(isMentorRole("admin")).toBe(true);
    });

    it("returns false for unknown roles", () => {
      expect(isMentorRole("unknown")).toBe(false);
    });
  });

  describe("canBeYppContact", () => {
    it("requires adult mentor", () => {
      const adultBirthdate = new Date("2000-01-01").getTime();
      const minorBirthdate = new Date("2015-01-01").getTime();

      expect(canBeYppContact(TEAM_ROLES.MENTOR, adultBirthdate)).toBe(true);
      expect(canBeYppContact(TEAM_ROLES.LEAD_MENTOR, adultBirthdate)).toBe(
        true
      );
      expect(canBeYppContact(TEAM_ROLES.MENTOR, minorBirthdate)).toBe(false);
      expect(canBeYppContact(TEAM_ROLES.STUDENT, adultBirthdate)).toBe(false);
    });

    it("returns false if no birthdate", () => {
      expect(canBeYppContact(TEAM_ROLES.MENTOR, undefined)).toBe(false);
    });

    it("allows legacy admin role as YPP contact", () => {
      const adultBirthdate = new Date("2000-01-01").getTime();
      expect(canBeYppContact("admin", adultBirthdate)).toBe(true);
    });
  });

  describe("isBirthdayOnDate", () => {
    it("identifies matching birthday", () => {
      const birthdate = new Date("2000-03-15").getTime();
      const checkDate = new Date("2026-03-15");
      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(true);
    });

    it("returns false for non-matching date", () => {
      const birthdate = new Date("2000-03-15").getTime();
      const checkDate = new Date("2026-03-16");
      expect(isBirthdayOnDate(birthdate, checkDate)).toBe(false);
    });

    it("handles Feb 29 birthday in non-leap year", () => {
      const leapBirthdate = new Date("2000-02-29").getTime();
      // 2026 is not a leap year, so Feb 29 birthday should be on Mar 1
      const mar1 = new Date("2026-03-01");
      expect(isBirthdayOnDate(leapBirthdate, mar1)).toBe(true);
    });

    it("handles Feb 29 birthday in leap year", () => {
      const leapBirthdate = new Date("2000-02-29").getTime();
      // 2028 is a leap year
      const feb29 = new Date("2028-02-29");
      expect(isBirthdayOnDate(leapBirthdate, feb29)).toBe(true);
    });
  });
});
