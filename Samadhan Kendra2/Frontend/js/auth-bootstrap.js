import { me, getToken, logout } from "./api.js";

async function bootstrapAuth() {
  if (!getToken || typeof getToken !== "function" || !getToken()) {
    if (typeof initializePointsDisplay === "function") initializePointsDisplay();
    return;
  }
  try {
    const user = await me();
    localStorage.setItem("userLoggedIn", "true");
    localStorage.setItem("userEmail", user.email || "");
    localStorage.setItem("userFirstName", user.firstName || "");
    localStorage.setItem("userLastName", user.lastName || "");
    localStorage.setItem("userPoints", String(user.points ?? 0));
  } catch (e) {
    console.warn("Auth bootstrap failed:", e?.status || "", e?.data || e);
    if (typeof logout === "function") logout();
    localStorage.removeItem("userLoggedIn");
    localStorage.removeItem("userPoints");
  } finally {
    if (typeof initializePointsDisplay === "function") initializePointsDisplay();
  }
}

document.addEventListener("DOMContentLoaded", bootstrapAuth);