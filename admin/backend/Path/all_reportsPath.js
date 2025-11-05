import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

// ✅ GET all user reports
router.get("/", async (req, res) => {
  try {
    const reports = await sql`
      SELECT id, user_id, username, subject, message, created_at
      FROM user_reports
      ORDER BY created_at DESC;
    `;

    if (reports.length === 0) {
      return res.status(404).json({ message: "No user reports found." });
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    console.error("❌ GET /user_reports error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
