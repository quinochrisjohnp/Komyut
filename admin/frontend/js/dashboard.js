document.addEventListener("DOMContentLoaded", async () => {
  const systemStatusEl = document.getElementById("system-status");
  const totalUsersEl = document.getElementById("total-users");
  const activeRoutesEl = document.getElementById("active-routes");
  const unreadFeedbackEl = document.getElementById("unread-feedback");
  
  console.log("✅ dashboard.js loaded!"); // confirms JS file is connected

  try {
    const response = await fetch("http://localhost:5002/api/system-info");
    const data = await response.json();
    console.log("✅ Data received:", data); // confirms backend response arrived

    systemStatusEl.textContent = data.system_status === "ACTIVE" ? "Online" : "Offline";
    totalUsersEl.textContent = data.total_users;
    activeRoutesEl.textContent = data.active_routes;
    unreadFeedbackEl.textContent = data.unread_feedback;
  } catch (err) {
    console.error("❌ Error fetching system info:", err);
    systemStatusEl.textContent = "Error";
  }
});
