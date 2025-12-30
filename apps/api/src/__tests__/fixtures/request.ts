import { Hono } from "hono";

/**
 * Test request helpers for Hono applications.
 * Provides utilities to make test requests to Hono routes.
 */

/**
 * Creates a test request for a Hono app.
 * This is a simple wrapper around the fetch API that makes it easier to test routes.
 */
export interface TestRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}

/**
 * Makes a test request to a Hono app instance.
 */
export async function testRequest(
  app: Hono,
  path: string,
  options: TestRequestOptions = {}
) {
  const { method = "GET", headers = {}, body, query } = options;

  // Build URL with query params
  let url = `http://localhost${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  // Build request init
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    init.body = JSON.stringify(body);
  }

  // Make request
  const req = new Request(url, init);
  const res = await app.fetch(req);

  return res;
}

/**
 * Helper to make a GET request
 */
export async function testGet(
  app: Hono,
  path: string,
  options: Omit<TestRequestOptions, "method"> = {}
) {
  return testRequest(app, path, { ...options, method: "GET" });
}

/**
 * Helper to make a POST request
 */
export async function testPost(
  app: Hono,
  path: string,
  body?: unknown,
  options: Omit<TestRequestOptions, "method" | "body"> = {}
) {
  return testRequest(app, path, { ...options, method: "POST", body });
}

/**
 * Helper to make a PUT request
 */
export async function testPut(
  app: Hono,
  path: string,
  body?: unknown,
  options: Omit<TestRequestOptions, "method" | "body"> = {}
) {
  return testRequest(app, path, { ...options, method: "PUT", body });
}

/**
 * Helper to make a PATCH request
 */
export async function testPatch(
  app: Hono,
  path: string,
  body?: unknown,
  options: Omit<TestRequestOptions, "method" | "body"> = {}
) {
  return testRequest(app, path, { ...options, method: "PATCH", body });
}

/**
 * Helper to make a DELETE request
 */
export async function testDelete(
  app: Hono,
  path: string,
  options: Omit<TestRequestOptions, "method"> = {}
) {
  return testRequest(app, path, { ...options, method: "DELETE" });
}

/**
 * Creates an authenticated request with a session token.
 * This helper adds the appropriate authentication headers for testing protected routes.
 */
export async function testAuthRequest(
  app: Hono,
  path: string,
  token: string,
  options: TestRequestOptions = {}
) {
  const headers = {
    ...options.headers,
    Cookie: `session=${token}`,
  };

  return testRequest(app, path, { ...options, headers });
}

/**
 * Helper to parse JSON response body
 */
export async function parseJsonResponse<T = unknown>(
  response: Response
): Promise<T> {
  return (await response.json()) as T;
}

/**
 * Helper to parse text response body
 */
export async function parseTextResponse(response: Response): Promise<string> {
  return await response.text();
}

/**
 * Creates a mock Hono app for testing individual route handlers.
 * Useful for unit testing specific routes without the full app setup.
 */
export function createTestApp(): Hono {
  return new Hono();
}

/**
 * Assertion helper to check if response is successful (2xx status code)
 */
export function assertResponseSuccess(response: Response): void {
  if (!response.ok) {
    throw new Error(
      `Expected successful response, got ${response.status} ${response.statusText}`
    );
  }
}

/**
 * Assertion helper to check response status code
 */
export function assertResponseStatus(
  response: Response,
  expectedStatus: number
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

/**
 * Helper to create form data for multipart/form-data requests
 */
export function createFormData(data: Record<string, string | Blob>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }
  return formData;
}

/**
 * Helper to make a multipart form request
 */
export async function testFormRequest(
  app: Hono,
  path: string,
  data: Record<string, string | Blob>,
  options: Omit<TestRequestOptions, "body"> = {}
) {
  const formData = createFormData(data);
  const { method = "POST", headers = {}, query } = options;

  // Build URL with query params
  let url = `http://localhost${path}`;
  if (query) {
    const params = new URLSearchParams(query);
    url += `?${params.toString()}`;
  }

  // Note: Don't set Content-Type header for FormData, browser will set it with boundary
  const init: RequestInit = {
    method,
    headers,
    body: formData,
  };

  const req = new Request(url, init);
  const res = await app.fetch(req);

  return res;
}
