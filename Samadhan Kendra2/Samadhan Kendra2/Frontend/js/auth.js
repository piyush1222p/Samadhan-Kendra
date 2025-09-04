import { login, register } from "./api.js";

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const messageBox = document.querySelector("#message");

function showMessage(text, isError = false) {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.style.color = isError ? "crimson" : "green";
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = formData.get("username");
    const password = formData.get("password");
    try {
      await login({ username, password });
      showMessage("Logged in!");
      // redirect after login if you want:
      // window.location.href = "admin.html";
    } catch (err) {
      showMessage(err?.detail || "Login failed", true);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");
    try {
      await register({ username, email, password });
      showMessage("Registered! You can login now.");
    } catch (err) {
      showMessage(err?.detail || "Registration failed", true);
    }
  });
}