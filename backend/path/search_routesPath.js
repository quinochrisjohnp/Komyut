import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

// CREATE search_routes
router.post("/", async (req, res) => {
  try {
    const { user_id, starting_loc, destination_loc, event_time, event_date } = req.body;

    // Validate required fields
    if (!user_id || !starting_loc || !destination_loc || !event_time || !event_date) {
      return res.status(400).json({
        error: "user_id, starting_loc, destination_loc, event_time, and event_date are required",
      });
    }

    const newRoute = await sql`
      INSERT INTO search_routes (
        user_id, starting_loc, destination_loc, event_time, event_date
      )
      VALUES (
        ${user_id}, ${starting_loc}, ${destination_loc}, ${event_time}, ${event_date}
      )
      RETURNING *;
    `;

    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error("Error saving search route:", error.message);
    res.status(500).json({ error: "Failed to save search route", details: error.message });
  }
});

// READ search_routes by user_id
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const search_routes = await sql`
      SELECT * FROM search_routes 
      WHERE user_id = ${user_id}
      ORDER BY created_at DESC;
    `;

    res.status(200).json(search_routes);
  } catch (error) {
    console.error("Error fetching search routes:", error.message);
    res.status(500).json({ error: "Failed to fetch search routes", details: error.message });
  }
});

export default router;
