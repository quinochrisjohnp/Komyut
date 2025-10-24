import express from 'express';
import { sql } from '../config/db.js';

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, category, sent_to, message } = req.body;


    if (!title || !category || !message) {
      return res.status(400).json({ error: "Title, category, and message are required." });
    }

    const result = await sql`
      INSERT INTO notifications (title, category, sent_to, message)
      VALUES (${title}, ${category}, ${sent_to || 'All Users'}, ${message})
      RETURNING *;
    `;

    res.status(201).json({
      message: "Notification added successfully!",
      data: result[0],
    });
  } catch (error) {
    console.error("Error inserting notification:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const result = await sql`SELECT * FROM notifications ORDER BY sent_time DESC;`;
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
