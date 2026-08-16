// Single configured HTTP client for every real backend call. Handles the
// base URL, attaching the JWT, and transparently refreshing an expired
// access token once before giving up — callers never see a 401 caused by
// token expiry, only a genuine "you're logged out" or "you can't do this."

// 8001, not FastAPI's usual 8000 — offset because ED360's own stack already
// occupies 8000 on this machine (see backend/README.md "Ports").
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8001/api/v1";

const ACCESS_TOKEN_KEY = "ignition_access_token";
const REFRESH_TOKEN_KEY = "ignition_refresh_token";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

// Ignition's TokenResponse uses access_token/refresh_token (FastAPI/OAuth2
// convention), not SimpleJWT's access/refresh.
export const setTokens = ({ access_token, refresh_token }) => {
  if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/** Reads the signed-in user's id straight off the access token's `sub` claim
 * (no signature check — the backend is the one that verifies it; this is
 * only ever used to fill a form field the backend overwrites for a student
 * caller anyway). Needed because `/documents/upload` requires `student_id`
 * in the body even though it's ignored for non-staff callers. */
export const getCurrentUserId = () => {
  const token = getAccessToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded).sub ?? null;
  } catch {
    return null;
  }
};

/** Thrown for any non-2xx response; carries the parsed body so callers can read field errors. */
export class ApiError extends Error {
  constructor(status, data) {
    super(data?.detail || "Request failed");
    this.status = status;
    this.data = data;
  }
}

const parseBody = async (response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError(401, { detail: "No session to refresh." });

  // Coalesce concurrent 401s into a single refresh call.
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    })
      .then(async (response) => {
        const data = await parseBody(response);
        if (!response.ok) {
          clearTokens();
          throw new ApiError(response.status, data);
        }
        setTokens(data);
        return data.access_token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

/**
 * @param {string} path - e.g. "/auth/me" (leading slash required, no trailing slash — FastAPI routes don't have one)
 * @param {object} options - fetch options; `body` may be a plain object (auto JSON-encoded) or FormData
 */
export const apiRequest = async (path, options = {}) => {
  const { body, headers = {}, skipAuth = false, isRetry = false, ...rest } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const finalHeaders = { ...headers };
  if (!isFormData && body !== undefined) finalHeaders["Content-Type"] = "application/json";

  const token = getAccessToken();
  if (!skipAuth && token) finalHeaders.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (response.status === 401 && !skipAuth && !isRetry && getRefreshToken()) {
    try {
      await refreshAccessToken();
      return apiRequest(path, { ...options, isRetry: true });
    } catch {
      // fall through to the normal error path below with the original 401
    }
  }

  const data = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
};

export const apiGet = (path, options) => apiRequest(path, { ...options, method: "GET" });
export const apiPost = (path, body, options) => apiRequest(path, { ...options, method: "POST", body });
export const apiPatch = (path, body, options) => apiRequest(path, { ...options, method: "PATCH", body });
export const apiPut = (path, body, options) => apiRequest(path, { ...options, method: "PUT", body });
export const apiDelete = (path, options) => apiRequest(path, { ...options, method: "DELETE" });
