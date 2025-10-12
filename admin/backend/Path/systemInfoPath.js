// Path/systemInfoPath.js
import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [info] = await sql`SELECT * FROM system_info LIMIT 1;`;
    const unreadFeedback = await sql`SELECT COUNT(*) FROM user_feedback WHERE status = FALSE;`;

    res.json({
      system_status: info.system_status ? "ACTIVE" : "INACTIVE",
      mode: info.mode,
      total_users: info.total_users,
      active_routes: info.active_routes,
      unread_feedback: Number(unreadFeedback[0].count),
    });
  } catch (err) {
    console.error("Error fetching system info:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
