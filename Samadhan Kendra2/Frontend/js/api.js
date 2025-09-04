// API base: prefers window.APP_CONFIG, falls back to window.CONFIG, then default
let API_BASE =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
  (window.CONFIG && window.CONFIG.API_BASE) ||
  "http://localhost:8000/api";

// Tokens in memory + localStorage
let accessToken = localStorage.getItem("accessToken") || null;
let refreshToken = localStorage.getItem("refreshToken") || null;

// Optional: allow changing base at runtime
export function setApiBase(url) {
  API_BASE = String(url || "").replace(/\/+$/, ""); // trim trailing slash
}

// Token helpers
export function setTokens(access, refresh) {
  accessToken = access || null;
  refreshToken = refresh || null;
  if (access) localStorage.setItem("accessToken", access);
  else localStorage.removeItem("accessToken");
  if (refresh) localStorage.setItem("refreshToken", refresh);
  else localStorage.removeItem("refreshToken");
}

export function getTokens() {
  return { accessToken, refreshToken };
}

// Safe JSON parser (handles empty body, non-JSON)
async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// Build full URL with a guaranteed single slash
function apiUrl(path) {
  const base = API_BASE.replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

// Refresh lock to avoid multiple concurrent refresh calls
let refreshInFlight = null;

async function doRefresh() {
  if (!refreshToken) return false;
  const res = await fetch(apiUrl("/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh: refreshToken })
  });
  if (!res.ok) {
    // Clear tokens if refresh fails
    setTokens(null, null);
    return false;
  }
  const data = (await safeJson(res)) || {};
  // SimpleJWT usually returns { access }; if rotation is enabled, it can also return refresh
  setTokens(data.access, data.refresh || refreshToken);
  return true;
}

async function refreshAccessToken() {
  if (!refreshToken) return false;
  if (refreshInFlight) {
    // Wait for the ongoing refresh
    try {
      return await refreshInFlight;
    } finally {
      // no-op
    }
  }
  refreshInFlight = doRefresh()
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

// Core fetch with auth + auto-refresh on 401
export async function authFetch(pathOrUrl, options = {}) {
  const url =
    /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : apiUrl(pathOrUrl);

  // Avoid forcing JSON headers for FormData
  const isFormData = options.body instanceof FormData;
  const headers = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {})
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let res = await fetch(url, { ...options, headers });

  // If unauthorized, try refresh once
  if (res.status === 401 && refreshToken) {
    const ok = await refreshAccessToken();
    if (ok) {
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }
  return res;
}

// Throw on non-2xx with parsed error
async function assertOk(res) {
  if (res.ok) return res;
  const data = await safeJson(res);
  const err = new Error(
    (data && (data.detail || data.error || data.message)) ||
      `Request failed with status ${res.status}`
  );
  err.status = res.status;
  err.data = data;
  throw err;
}

// -------------------- Auth --------------------
export async function register({ username, email, password }) {
  const res = await fetch(apiUrl("/auth/register/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  await assertOk(res);
  return safeJson(res);
}

export async function login({ username, password }) {
  const res = await fetch(apiUrl("/auth/token/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password })
  });
  await assertOk(res);
  const data = (await safeJson(res)) || {};
  // Expected: { access, refresh }
  setTokens(data.access, data.refresh);
  return data;
}

// Optional blacklist if DRF SimpleJWT blacklist is enabled
export async function logout() {
  try {
    if (refreshToken) {
      await fetch(apiUrl("/auth/token/blacklist/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh: refreshToken })
      }).catch(() => {});
    }
  } finally {
    setTokens(null, null);
  }
}

// Current user (if your backend exposes it; adjust path if different)
export async function me() {
  const res = await authFetch("/auth/me/");
  await assertOk(res);
  return safeJson(res);
}

// -------------------- API calls --------------------
export async function getDepartments() {
  const res = await authFetch("/departments/");
  await assertOk(res);
  return safeJson(res);
}

export async function getGrievances() {
  const res = await authFetch("/grievances/");
  await assertOk(res);
  return safeJson(res);
}

export async function createGrievance({ title, description, priority, department }) {
  const res = await authFetch("/grievances/", {
    method: "POST",
    body: JSON.stringify({ title, description, priority, department })
  });
  await assertOk(res);
  return safeJson(res);
}

export async function addComment(grievanceId, text) {
  const res = await authFetch(`/grievances/${encodeURIComponent(grievanceId)}/comment/`, {
    method: "POST",
    body: JSON.stringify({ text })
  });
  await assertOk(res);
  return safeJson(res);
}

export async function setStatus(grievanceId, status) {
  const res = await authFetch(`/grievances/${encodeURIComponent(grievanceId)}/set_status/`, {
    method: "POST",
    body: JSON.stringify({ status })
  });
  await assertOk(res);
  return safeJson(res);
}

export async function assign(grievanceId, userId) {
  const res = await authFetch(`/grievances/${encodeURIComponent(grievanceId)}/assign/`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId })
  });
  await assertOk(res);
  return safeJson(res);
}

// --------------- Optional utilities ---------------
export async function health() {
  const res = await fetch(apiUrl("/health/"));
  if (!res.ok) return { ok: false, status: res.status };
  return safeJson(res);
}