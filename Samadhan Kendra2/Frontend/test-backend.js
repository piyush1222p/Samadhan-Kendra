(async () => {
  const base = window.APP_CONFIG?.API_BASE || "";
  try {
    const r = await fetch(`${base}/ping`);
    const data = await r.json();
    console.log("Ping response:", data);
    document.getElementById("status").textContent =
      r.ok ? "Frontend ↔ Backend: OK" : `Error: ${r.status}`;
  } catch (e) {
    console.error(e);
    document.getElementById("status").textContent = "Request failed (check URL/CORS)";
  }
})();