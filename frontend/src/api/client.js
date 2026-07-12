const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const TOKEN_KEY = "assetflow_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

/**
 * Thin fetch wrapper: injects the JWT, base URL, and JSON headers,
 * and normalizes the backend's { success, message, data } envelope
 * into either the resolved data or a thrown ApiError.
 */
export class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function apiRequest(path, { method = "GET", body, params } = {}) {
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    if (query) url += `?${query}`;
  }

  const headers = {};
  const isFormData = body instanceof FormData;

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(
      "Could not reach the server. Is the backend running?",
      0,
      null
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // no JSON body
  }

  if (!response.ok || (payload && payload.success === false)) {
    const message = payload?.message || `Request failed (${response.status})`;
    if (response.status === 401) setToken(null);
    throw new ApiError(message, response.status, payload?.errors);
  }

  return payload?.data;
}

export const api = {
  get: (path, params) => apiRequest(path, { method: "GET", params }),
  post: (path, body) => apiRequest(path, { method: "POST", body }),
  put: (path, body) => apiRequest(path, { method: "PUT", body }),
  del: (path) => apiRequest(path, { method: "DELETE" }),
};
