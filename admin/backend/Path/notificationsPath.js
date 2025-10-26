// Path/notificationsPath.js
import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

// ✅ GET all notifications (for admin & mobile)
router.get("/", async (req, res) => {
  try {
    const notifications = await sql`
      SELECT * FROM notifications
      WHERE sent_to = 'All Users'
      ORDER BY sent_time DESC
    `;
    res.json(notifications);
  } catch (error) {
    console.error("GET /notifications error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ POST new notification (always sent to all users)
router.post("/", async (req, res) => {
  try {
    const { title, category, message } = req.body;

    if (!title || !category || !message) {
      return res.status(400).json({ error: "Title, category, and message are required." });
    }

    await sql`
      INSERT INTO notifications (title, category, sent_to, message)
      VALUES (${title}, ${category}, 'All Users', ${message})
    `;

    res.json({ success: "Notification sent to all users!" });
  } catch (error) {
    console.error("POST /notifications error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
