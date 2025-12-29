const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message?: string
  ) {
    super(message || `${status} ${statusText}`);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = "/login";
      throw new ApiError(401, "Unauthorized", "Please sign in");
    }

    let message: string | undefined;
    try {
      const data = await response.json();
      message = data.error || data.message;
    } catch {
      // Response may not be JSON
    }

    throw new ApiError(response.status, response.statusText, message);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
    return handleResponse<T>(response);
  },
};

export { ApiError };
