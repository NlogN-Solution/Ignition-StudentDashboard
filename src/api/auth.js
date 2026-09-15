import { apiGet, apiPost, clearTokens, getRefreshToken, setTokens } from "./client";

export const login = async (email, password) => {
  const data = await apiPost("/auth/login", { email, password }, { skipAuth: true });
  setTokens(data);
  return data;
};

export const register = async (payload) => {
  const data = await apiPost("/auth/register", payload, { skipAuth: true });
  setTokens(data);
  return data;
};

export const logout = async () => {
  const refresh_token = getRefreshToken();
  try {
    if (refresh_token) await apiPost("/auth/logout", { refresh_token });
  } finally {
    clearTokens();
  }
};

// There is no PATCH /auth/me on the backend — first_name/last_name/phone
// aren't self-service-editable by a student today (only staff can PATCH
// another user's account fields, via /users/{id}). AuthContext's `updateUser`
// therefore only ever writes through the student-profile endpoints below.
export const fetchCurrentUser = () => apiGet("/auth/me");

// KNOWN GAP: the backend has no password-reset-by-email flow yet (no
// /auth/password-reset/* routes) — these will 404 until one is built. Left
// wired at the FastAPI-shaped path they'd land on, rather than removed, so
// the reset screen only needs this file to change once that lands.
export const requestPasswordReset = (email) =>
  apiPost("/auth/password-reset/request", { email }, { skipAuth: true });

export const confirmPasswordReset = ({ uid, token, newPassword }) =>
  apiPost(
    "/auth/password-reset/confirm",
    { uid, token, new_password: newPassword },
    { skipAuth: true }
  );
