import express from 'express';
import { sql } from '../config/db.js';

const router = express.Router();

// CREATE saved_routes
router.post("/", async (req, res) => {
  try {
    const { user_id, type, start_location, destination, description } = req.body;

    if (!user_id || !start_location || !destination || !description) {
      return res
        .status(400)
        .json({ error: "user_id, start_location, destination, and description are required" });
    }

    const newRoute = await sql`
      INSERT INTO saved_routes (
        user_id, type, start_location, destination, description
      )
      VALUES (
        ${user_id}, ${type}, ${start_location}, ${destination}, ${description}
      )
      RETURNING *;
    `;

    res.status(201).json(newRoute[0]);
  } catch (error) {
    console.error("Error saving route:", error.message);
    res.status(500).json({ error: "Failed to save route", details: error.message });
  }
});

// READ saved_routes
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const saved_routes = await sql`
      SELECT * FROM saved_routes WHERE user_id = ${user_id} ORDER BY created_at DESC;
    `;

    res.status(200).json(saved_routes);
  } catch (error) {
    console.error("Error fetching routes:", error.message);
    res.status(500).json({ error: "Failed to fetch routes", details: error.message });
  }
});

// UPDATE saved_routes
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { type, start_location, destination, description } = req.body;

  try {
    const updatedRoute = await sql`
      UPDATE saved_routes
      SET type = COALESCE(${type}, type),
          start_location = COALESCE(${start_location}, start_location),
          destination = COALESCE(${destination}, destination),
          description = COALESCE(${description}, description)
      WHERE id = ${id}
      RETURNING *;
    `;

    if (updatedRoute.length === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json(updatedRoute[0]);
  } catch (error) {
    console.error("Error updating saved_routes:", error.message);
    res.status(500).json({ error: "Failed to update route", details: error.message });
  }
});


// DELETE saved_routes
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRoutes = await sql`
      DELETE FROM saved_routes WHERE id = ${id} RETURNING *;
    `;

    if (deletedRoutes.length === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json({ message: "Route deleted successfully", deleted: deletedRoutes });
  } catch (error) {
    console.error("Error deleting saved_routes:", error.message);
    res.status(500).json({ error: "Failed to delete route", details: error.message });
  }
});

export default router;
