const API_BASE = window.CONFIG?.API_BASE ?? "http://localhost:8000/api";

let accessToken = localStorage.getItem("accessToken") || null;
let refreshToken = localStorage.getItem("refreshToken") || null;

function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem("accessToken", access);
  else localStorage.removeItem("accessToken");
  if (refresh) localStorage.setItem("refreshToken", refresh);
  else localStorage.removeItem("refreshToken");
}

async function refreshAccessToken() {
  if (!refreshToken) return false;
  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });
  if (!res.ok) {
    setTokens(null, null);
    return false;
  }
  const data = await res.json();
  setTokens(data.access, refreshToken);
  return true;
}

async function authFetch(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let res = await fetch(url, { ...options, headers });

  // If the access token expired, try to refresh once
  if (res.status === 401 && refreshToken) {
    const ok = await refreshAccessToken();
    if (ok) {
      headers.Authorization = `Bearer ${accessToken}`;
      res = await fetch(url, { ...options, headers });
    }
  }
  return res;
}

// Auth
export async function register({ username, email, password }) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function login({ username, password }) {
  const res = await fetch(`${API_BASE}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw await res.json();
  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data;
}

export function logout() {
  setTokens(null, null);
}

// API calls
export async function getDepartments() {
  const res = await authFetch(`${API_BASE}/departments/`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function getGrievances() {
  const res = await authFetch(`${API_BASE}/grievances/`);
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function createGrievance({ title, description, priority, department }) {
  const res = await authFetch(`${API_BASE}/grievances/`, {
    method: "POST",
    body: JSON.stringify({ title, description, priority, department }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function addComment(grievanceId, text) {
  const res = await authFetch(`${API_BASE}/grievances/${grievanceId}/comment/`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function setStatus(grievanceId, status) {
  const res = await authFetch(`${API_BASE}/grievances/${grievanceId}/set_status/`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function assign(grievanceId, userId) {
  const res = await authFetch(`${API_BASE}/grievances/${grievanceId}/assign/`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw await res.json();
  return res.json();
}