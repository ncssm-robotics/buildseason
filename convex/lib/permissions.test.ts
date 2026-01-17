import { describe, it, expect } from "vitest";
import { hasRole, Role } from "./permissions";

describe("hasRole", () => {
  it("admin has all roles", () => {
    expect(hasRole("admin", "admin")).toBe(true);
    expect(hasRole("admin", "mentor")).toBe(true);
    expect(hasRole("admin", "student")).toBe(true);
  });

  it("mentor has mentor and student roles", () => {
    expect(hasRole("mentor", "admin")).toBe(false);
    expect(hasRole("mentor", "mentor")).toBe(true);
    expect(hasRole("mentor", "student")).toBe(true);
  });

  it("student has only student role", () => {
    expect(hasRole("student", "admin")).toBe(false);
    expect(hasRole("student", "mentor")).toBe(false);
    expect(hasRole("student", "student")).toBe(true);
  });

  it("role hierarchy is transitive", () => {
    const roles: Role[] = ["admin", "mentor", "student"];

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
