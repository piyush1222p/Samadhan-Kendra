import { getGrievances, createGrievance, addComment } from "./api.js";

const listEl = document.querySelector("#grievanceList");
const formEl = document.querySelector("#grievanceForm");
const commentFormEl = document.querySelector("#commentForm");
const messageBox = document.querySelector("#message");

function showMessage(text, isError = false) {
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.style.color = isError ? "crimson" : "green";
}

async function loadGrievances() {
  try {
    const data = await getGrievances();
    if (listEl) {
      listEl.innerHTML = data.map(g => `
        <li>
          <strong>${g.title}</strong> — ${g.description}
          <br/>Dept: ${g.department_name ?? g.department} | Priority: ${g.priority} | Status: ${g.status}
          <br/>ID: ${g.id}
        </li>
      `).join("");
    }
  } catch (err) {
    showMessage(err?.detail || "Failed to load grievances", true);
  }
}

if (formEl) {
  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(formEl);
    const payload = {
      title: fd.get("title"),
      description: fd.get("description"),
      priority: Number(fd.get("priority")),
      department: Number(fd.get("department")),
    };
    try {
      await createGrievance(payload);
      showMessage("Grievance created!");
      await loadGrievances();
      formEl.reset();
    } catch (err) {
      showMessage(err?.detail || "Failed to create grievance", true);
    }
  });
}

if (commentFormEl) {
  commentFormEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(commentFormEl);
    const id = Number(fd.get("grievanceId"));
    const text = fd.get("text");
    try {
      await addComment(id, text);
      showMessage("Comment added!");
      await loadGrievances();
      commentFormEl.reset();
    } catch (err) {
      showMessage(err?.detail || "Failed to add comment", true);
    }
  });
}

loadGrievances();