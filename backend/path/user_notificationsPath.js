// Path: /Path/notificationsPath.js
import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

// ✅ GET all notifications (for all users)
router.get("/", async (req, res) => {
  try {
    const notifications = await sql`
      SELECT * FROM notifications
      WHERE sent_to = 'All Users'
      ORDER BY sent_time DESC;
    `;

    if (notifications.length === 0) {
      return res.status(404).json({ message: "No notifications found." });
    }

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("❌ GET /notifications error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
