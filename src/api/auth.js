import { apiGet, apiPatch, apiPost, clearTokens, getRefreshToken, setTokens } from "./client";

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

export const fetchCurrentUser = () => apiGet("/auth/me");

/**
 * The signed-in user's own account fields: first_name, last_name, phone,
 * date_of_birth, gender. `PATCH /users/me` is open to every role and rejects
 * role/status outright. Email is not sent from the portal — changing it needs
 * the current password, and students ask their counsellor (see Settings).
 */
export const updateMyAccount = (patch) => apiPatch("/users/me", patch);

export const uploadMyAvatar = (file) => {
  const body = new FormData();
  body.append("file", file);
  return apiPost("/users/me/avatar", body);
};

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

/** Self-service password change. The backend revokes every other session on
 * success, so a stolen token stops working the moment the real owner changes
 * their password. */
export const changePassword = ({ currentPassword, newPassword }) =>
  apiPost("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
