import { describe, it, expect } from "vitest";
import { hasRole, normalizeRole, Role } from "./permissions";

describe("normalizeRole", () => {
  it("maps admin to lead_mentor for backwards compatibility", () => {
    expect(normalizeRole("admin")).toBe("lead_mentor");
  });

  it("passes through valid roles unchanged", () => {
    expect(normalizeRole("lead_mentor")).toBe("lead_mentor");
    expect(normalizeRole("mentor")).toBe("mentor");
    expect(normalizeRole("student")).toBe("student");
  });

  it("defaults unknown roles to student", () => {
    expect(normalizeRole("unknown")).toBe("student");
    expect(normalizeRole("")).toBe("student");
  });
});

describe("hasRole", () => {
  it("lead_mentor has all roles", () => {
    expect(hasRole("lead_mentor", "lead_mentor")).toBe(true);
    expect(hasRole("lead_mentor", "mentor")).toBe(true);
    expect(hasRole("lead_mentor", "student")).toBe(true);
  });

  it("admin maps to lead_mentor (backwards compatibility)", () => {
    expect(hasRole("admin", "lead_mentor")).toBe(true);
    expect(hasRole("admin", "mentor")).toBe(true);
    expect(hasRole("admin", "student")).toBe(true);
  });

  it("mentor has mentor and student roles", () => {
    expect(hasRole("mentor", "lead_mentor")).toBe(false);
    expect(hasRole("mentor", "mentor")).toBe(true);
    expect(hasRole("mentor", "student")).toBe(true);
  });

  it("student has only student role", () => {
    expect(hasRole("student", "lead_mentor")).toBe(false);
    expect(hasRole("student", "mentor")).toBe(false);
    expect(hasRole("student", "student")).toBe(true);
  });

  it("role hierarchy is transitive", () => {
    const roles: Role[] = ["lead_mentor", "mentor", "student"];

    // Higher roles should have access to all lower roles
    for (let i = 0; i < roles.length; i++) {
      for (let j = i; j < roles.length; j++) {
        expect(hasRole(roles[i], roles[j])).toBe(true);
      }
      // But not to higher roles
      for (let j = 0; j < i; j++) {
        expect(hasRole(roles[i], roles[j])).toBe(false);
      }
    }
  });
});
