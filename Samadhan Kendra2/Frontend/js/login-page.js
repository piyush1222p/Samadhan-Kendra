import { login } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const msg = document.getElementById("loginMsg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "Logging in...";
    msg.style.color = "#555";

    const username = document.getElementById("username")?.value?.trim();
    const email = document.getElementById("email")?.value?.trim();
    const password = document.getElementById("password")?.value;

    try {
      await login({ username, email, password }); // api.js stores accessToken
      localStorage.setItem("userLoggedIn", "true");
      msg.textContent = "Logged in! Redirecting...";
      setTimeout(() => (window.location.href = "index.html"), 700);
    } catch (err) {
      msg.style.color = "#b91c1c";
      msg.textContent =
        err?.data?.error || err?.data?.detail || "Login failed";
    }
  });
});