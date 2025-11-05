import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

/* CREATE a new user report */
router.post("/", async (req, res) => {
  try {
    const { user_id, username, subject, message } = req.body;

    if (!user_id || !username || !subject || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const result = await sql`
      INSERT INTO user_reports (user_id, username, subject, message)
      VALUES (${user_id}, ${username}, ${subject}, ${message})
      RETURNING *;
    `;

    res.status(201).json({
      message: "✅ Report submitted successfully.",
      report: result[0],
    });
  } catch (error) {
    console.error("❌ Error inserting user report:", error);
    res.status(500).json({ error: "Failed to submit report." });
  }
});

/* GET all user reports */
router.get("/", async (req, res) => {
  try {
    const reports = await sql`
      SELECT * FROM user_reports ORDER BY created_at DESC;
    `;
    res.status(200).json(reports);
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
});

/* GET reports by username */
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const reports = await sql`
      SELECT * FROM user_reports
      WHERE username = ${username}
      ORDER BY created_at DESC;
    `;
    res.status(200).json(reports);
  } catch (error) {
    console.error("❌ Error fetching user reports:", error);
    res.status(500).json({ error: "Failed to fetch user reports." });
  }
});

export default router;