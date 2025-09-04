// Node backend API client
// Base URL comes from window.APP_CONFIG.API_BASE (or window.CONFIG for fallback)
let API_BASE =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
  (window.CONFIG && window.CONFIG.API_BASE) ||
  "http://localhost:4000";

// Token storage
let accessToken = localStorage.getItem("accessToken") || null;

// Utilities
export function setApiBase(url) {
  API_BASE = String(url || "").replace(/\/+$/, ""); // trim trailing slash
}

export function setToken(token) {
  accessToken = token || null;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

export function getToken() {
  return accessToken;
}

function apiUrl(path) {
  const base = API_BASE.replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function authFetch(pathOrUrl, options = {}) {
  const url = /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : apiUrl(pathOrUrl);
  const isFormData = options.body instanceof FormData;

  const headers = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(url, { ...options, headers });
  return res;
}

async function assertOk(res) {
  if (res.ok) return res;
  const data = await safeJson(res);
  const err = new Error(
    (data && (data.error || data.detail || data.message)) ||
      `Request failed with status ${res.status}`
  );
  err.status = res.status;
  err.data = data;
  throw err;
}

// Health
export async function health() {
  const res = await fetch(apiUrl("/health"));
  await assertOk(res);
  return safeJson(res);
}

// Auth (Node backend expects email for login/register)
export async function register({ firstName, lastName, email, password, city, phone }) {
  const res = await fetch(apiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ firstName, lastName, email, password, city, phone }),
  });
  await assertOk(res);
  const data = (await safeJson(res)) || {};
  // Node backend returns { user, accessToken, refreshToken }
  if (data.accessToken) setToken(data.accessToken);
  return data;
}

// Keeps DRF-style signature (username) but maps to email for Node
export async function login({ username, email, password }) {
  const payload = { email: email || username, password };
  const res = await fetch(apiUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  await assertOk(res);
  const data = (await safeJson(res)) || {};
  if (data.accessToken) setToken(data.accessToken);
  return data;
}

export async function me() {
  const res = await authFetch("/auth/me");
  await assertOk(res);
  return safeJson(res);
}

export function logout() {
  setToken(null);
}

// Rewards and issues
export async function redeemReward({ rewardType, points }) {
  const res = await authFetch("/rewards/redeem", {
    method: "POST",
    body: JSON.stringify({ rewardType, points }),
  });
  await assertOk(res);
  return safeJson(res);
}

export async function upvoteIssue(issueId) {
  const res = await authFetch(`/issues/${encodeURIComponent(issueId)}/upvote`, {
    method: "POST",
  });
  await assertOk(res);
  return safeJson(res);
}