import { describe, expect, test } from "bun:test";

// These tests validate production environment configuration.
// They are skipped if the environment variables are not set.
const skipIfNotConfigured = !process.env.GITHUB_CLIENT_ID;

describe.skipIf(skipIfNotConfigured)("OAuth Configuration", () => {
  test("GITHUB_CLIENT_ID is configured", () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
  });

  test("GITHUB_CLIENT_SECRET is configured", () => {
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
  });

  test("GOOGLE_CLIENT_ID is configured", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
  });

  test("GOOGLE_CLIENT_SECRET is configured", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
  });

  test("BETTER_AUTH_SECRET is configured", () => {
    const secret = process.env.BETTER_AUTH_SECRET;
    expect(secret).toBeDefined();
    expect(secret).not.toBe("");
    expect(secret).not.toBe("your-secret-key-change-in-production");
  });

  test("BETTER_AUTH_URL is configured", () => {
    const url = process.env.BETTER_AUTH_URL;
    expect(url).toBeDefined();
    expect(url).toMatch(/^https?:\/\//);
  });
});

describe.skipIf(skipIfNotConfigured)("OAuth Credential Format", () => {
  test("GitHub Client ID has valid format", () => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (clientId) {
      // GitHub OAuth client IDs are typically 20 characters
      expect(clientId.length).toBeGreaterThanOrEqual(10);
    }
  });

  test("Google Client ID has valid format", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId) {
      // Google OAuth client IDs end with .apps.googleusercontent.com
      expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
    }
  });
});
